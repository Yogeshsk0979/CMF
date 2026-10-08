import { query, withTransaction } from '../config/db.js';
import { logAudit } from './applicationService.js';

// ============================================================================
// Account code constants (matches seed data in seed_data.sql)
// ============================================================================
const ACCOUNT_CODES = {
  CASH: '1001',
  HDFC: '1002',
  ICICI: '1003',
  SBI: '1004',
  LOANS_RECEIVABLE: '1101',
  INTEREST_RECEIVABLE: '1102',
  PROCESSING_FEE_RECEIVABLE: '1103',
  INSURANCE_RECEIVABLE: '1104',
  LATE_FEES_RECEIVABLE: '1105',
  LOAN_PORTFOLIO: '2001',
  INTEREST_INCOME: '4001',
  PROCESSING_FEE_INCOME: '4002',
  DOCUMENT_FEE_INCOME: '4003',
  LATE_FEE_INCOME: '4004',
  PREPAYMENT_CHARGES: '4005',
  SALARY_EXPENSE: '5001',
  RENT_EXPENSE: '5002',
  OFFICE_EXPENSE: '5003',
  MARKETING_EXPENSE: '5004',
  TRAVEL_EXPENSE: '5005',
};

const BANK_ACCOUNT_CODES = [ACCOUNT_CODES.HDFC, ACCOUNT_CODES.ICICI, ACCOUNT_CODES.SBI];

// ============================================================================
// Internal helpers
// ============================================================================

async function getAccountId(client, accountCode) {
  const sql = 'SELECT id FROM ledger_accounts WHERE account_code = $1';
  const result = client
    ? await client.query(sql, [accountCode])
    : await query(sql, [accountCode]);
  if (!result.rows.length) {
    throw new Error(`Ledger account not found for code: ${accountCode}`);
  }
  return result.rows[0].id;
}

async function updateAccountBalance(client, accountId, debitDelta, creditDelta, entryDate) {
  const q = client || query;
  await q(
    `INSERT INTO ledger_account_balances (account_id, as_of_date, opening_balance, total_debit, total_credit, closing_balance)
     SELECT $1, $2, COALESCE(
       (SELECT closing_balance FROM ledger_account_balances
        WHERE account_id = $1 AND as_of_date < $2 ORDER BY as_of_date DESC LIMIT 1),
       (SELECT opening_balance FROM ledger_accounts WHERE id = $1), 0
     ), $3, $4, COALESCE(
       (SELECT closing_balance FROM ledger_account_balances
        WHERE account_id = $1 AND as_of_date < $2 ORDER BY as_of_date DESC LIMIT 1),
       (SELECT opening_balance FROM ledger_accounts WHERE id = $1), 0
     ) + $3 - $4
     ON CONFLICT (account_id, as_of_date) DO UPDATE SET
       total_debit = ledger_account_balances.total_debit + EXCLUDED.total_debit,
       total_credit = ledger_account_balances.total_credit + EXCLUDED.total_credit,
       closing_balance = ledger_account_balances.closing_balance + EXCLUDED.total_debit - EXCLUDED.total_credit`,
    [accountId, entryDate, debitDelta, creditDelta]
  );
}

// ============================================================================
// 11. Helper: _resolveBankAccount - find which ledger_account_id matches
// ============================================================================
export async function _resolveBankAccount(disbursement) {
  const bankResult = await query(
    'SELECT bank_name FROM bank_accounts WHERE id = $1',
    [disbursement.bank_account_id]
  );
  if (!bankResult.rows.length) {
    throw new Error(`Bank account not found: ${disbursement.bank_account_id}`);
  }

  const bankName = bankResult.rows[0].bank_name.toLowerCase();
  let accountCode;

  if (bankName.includes('hdfc')) {
    accountCode = ACCOUNT_CODES.HDFC;
  } else if (bankName.includes('icici')) {
    accountCode = ACCOUNT_CODES.ICICI;
  } else if (bankName.includes('sbi')) {
    accountCode = ACCOUNT_CODES.SBI;
  } else {
    const fallback = await query(
      'SELECT account_code FROM ledger_accounts WHERE account_code = ANY($1) ORDER BY account_code LIMIT 1',
      [BANK_ACCOUNT_CODES]
    );
    accountCode = fallback.rows[0]?.account_code || ACCOUNT_CODES.HDFC;
  }

  return getAccountId(null, accountCode);
}

// ============================================================================
// Helper: resolveBankLedgerAccountId (used by existing code)
// ============================================================================
export async function resolveBankLedgerAccountId(bankAccountId) {
  const bank = await query('SELECT bank_name FROM bank_accounts WHERE id = $1', [bankAccountId]);
  if (!bank.rows[0]) return ACCOUNT_CODES.CASH;
  const name = bank.rows[0].bank_name.toLowerCase();
  if (name.includes('hdfc')) return ACCOUNT_CODES.HDFC;
  if (name.includes('icici')) return ACCOUNT_CODES.ICICI;
  if (name.includes('sbi')) return ACCOUNT_CODES.SBI;
  return ACCOUNT_CODES.CASH;
}

// ============================================================================
// 1. postDisbursement - double entry when loan is disbursed
// ============================================================================
export async function postDisbursement(client, disbursement) {
  const entryNumber = 'LDG' + Date.now().toString().slice(-7);
  const entryDate = disbursement.disbursement_date || new Date().toISOString().split('T')[0];

  // Resolve bank ledger account ID
  const bankLedgerAccountId = await _resolveBankAccount(disbursement);

  // Get receivable account IDs
  const loansReceivableId = await getAccountId(client, ACCOUNT_CODES.LOANS_RECEIVABLE);
  const processingFeeReceivableId = await getAccountId(client, ACCOUNT_CODES.PROCESSING_FEE_RECEIVABLE);
  const insuranceReceivableId = await getAccountId(client, ACCOUNT_CODES.INSURANCE_RECEIVABLE);

  // Create ledger entry
  const entry = await client.query(
    `INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_id, reference_number, narration, bank_account_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      entryNumber, entryDate,
      `Loan Disbursement - Rs.${disbursement.loan_amount} (Net: Rs.${disbursement.net_disbursement_amount})`,
      'disbursement', disbursement.id, disbursement.disbursement_number,
      `Processing fee: ${disbursement.processing_fee}, Doc charge: ${disbursement.document_charge}, Insurance: ${disbursement.insurance_amount}`,
      disbursement.bank_account_id
    ]
  );

  const entryId = entry.rows[0].id;

  // Build double-entry lines
  const lines = [];
  let lineOrder = 1;

  // DR: Loans Receivable - loan_amount
  lines.push({
    account_id: loansReceivableId,
    debit_amount: disbursement.loan_amount,
    credit_amount: 0,
    line_order: lineOrder++,
    narration: 'Loan amount receivable',
  });

  // DR: Processing Fee Receivable
  if (parseFloat(disbursement.processing_fee) > 0) {
    lines.push({
      account_id: processingFeeReceivableId,
      debit_amount: disbursement.processing_fee,
      credit_amount: 0,
      line_order: lineOrder++,
      narration: 'Processing fee receivable',
    });
  }

  // DR: Document Charge Receivable
  if (parseFloat(disbursement.document_charge) > 0) {
    lines.push({
      account_id: processingFeeReceivableId,
      debit_amount: disbursement.document_charge,
      credit_amount: 0,
      line_order: lineOrder++,
      narration: 'Document charge receivable',
    });
  }

  // DR: Insurance Receivable
  if (parseFloat(disbursement.insurance_amount) > 0) {
    lines.push({
      account_id: insuranceReceivableId,
      debit_amount: disbursement.insurance_amount,
      credit_amount: 0,
      line_order: lineOrder++,
      narration: 'Insurance receivable',
    });
  }

  // CR: Bank Account - net_disbursement_amount
  lines.push({
    account_id: bankLedgerAccountId,
    debit_amount: 0,
    credit_amount: disbursement.net_disbursement_amount,
    line_order: lineOrder,
    narration: 'Net disbursement to bank',
  });

  // Insert all ledger entry lines
  for (const line of lines) {
    await client.query(
      'INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, line.account_id, line.debit_amount, line.credit_amount, line.line_order, line.narration]
    );

    // Update account balances in ledger_account_balances
    await updateAccountBalance(client, line.account_id, line.debit_amount, line.credit_amount, entryDate);
  }

  // Create bank statement entries for each debit line (money going out)
  for (const line of lines) {
    if (line.debit_amount > 0) {
      await client.query(
        `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, entry_type)
         VALUES ($1, $2, $3, $4, $5, 'manual')`,
        [disbursement.bank_account_id, entryDate, line.narration, entryNumber, line.debit_amount]
      );
    }
  }

  return entry.rows[0];
}

// ============================================================================
// 2. postEmiPayment - when EMI is collected
// ============================================================================
export async function postEmiPayment(client, payment) {
  const entryNumber = 'LDG' + Date.now().toString().slice(-7);
  const entryDate = payment.payment_date || new Date().toISOString().split('T')[0];

  // Find bank account
  let bankAccountId = payment.bank_account_id;
  if (!bankAccountId) {
    const bankResult = await client.query("SELECT id FROM bank_accounts WHERE is_primary = true LIMIT 1");
    bankAccountId = bankResult.rows[0]?.id;
  }
  if (!bankAccountId) {
    throw new Error('No bank account available for EMI payment posting');
  }

  // Get bank ledger account
  const bankCode = await resolveBankLedgerAccountId(bankAccountId);
  const bankLedgerId = await getAccountId(client, bankCode);

  const loansReceivableId = await getAccountId(client, ACCOUNT_CODES.LOANS_RECEIVABLE);
  const interestIncomeId = await getAccountId(client, ACCOUNT_CODES.INTEREST_INCOME);

  // Create ledger entry
  const entry = await client.query(
    `INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_id, reference_number, narration, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      entryNumber, entryDate,
      `EMI Payment Received - Rs.${payment.payment_amount}`,
      'emi_payment', payment.loan_id, payment.payment_number,
      `Principal: ${payment.principal_component}, Interest: ${payment.interest_component}`,
      payment.received_by
    ]
  );

  const entryId = entry.rows[0].id;
  let lineOrder = 1;

  // DR: Bank Account - payment_amount
  await client.query(
    `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entryId, bankLedgerId, payment.payment_amount, 0, lineOrder++, 'EMI payment received']
  );
  await updateAccountBalance(client, bankLedgerId, payment.payment_amount, 0, entryDate);

  // CR: Loans Receivable - principal_component
  if (parseFloat(payment.principal_component) > 0) {
    await client.query(
      `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entryId, loansReceivableId, 0, payment.principal_component, lineOrder++, 'Principal repayment']
    );
    await updateAccountBalance(client, loansReceivableId, 0, payment.principal_component, entryDate);
  }

  // CR: Interest Income - interest_component
  if (parseFloat(payment.interest_component) > 0) {
    await client.query(
      `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entryId, interestIncomeId, 0, payment.interest_component, lineOrder++, 'Interest income']
    );
    await updateAccountBalance(client, interestIncomeId, 0, payment.interest_component, entryDate);
  }

  // Create bank statement entry
  await client.query(
    `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, credit_amount, entry_type)
     VALUES ($1, $2, $3, $4, $5, 'manual')`,
    [
      bankAccountId, entryDate,
      `EMI Collection - ${payment.payment_number}`,
      payment.transaction_ref || entryNumber,
      payment.payment_amount
    ]
  );

  return entry.rows[0];
}

// ============================================================================
// 3. postPenalty - when penalty is applied
// ============================================================================
export async function postPenalty(client, penalty) {
  const entryNumber = 'LDG' + Date.now().toString().slice(-7);
  const entryDate = penalty.penalty_date || new Date().toISOString().split('T')[0];
  const amount = parseFloat(penalty.final_amount || penalty.penalty_amount);

  const lateFeesReceivableId = await getAccountId(client, ACCOUNT_CODES.LATE_FEES_RECEIVABLE);
  const lateFeeIncomeId = await getAccountId(client, ACCOUNT_CODES.LATE_FEE_INCOME);

  const entry = await client.query(
    `INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_id, reference_number, narration)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      entryNumber, entryDate,
      `Penalty Applied - Rs.${amount}`,
      'penalty', penalty.loan_id, penalty.penalty_number,
      `Late fee for EMI. Due: ${penalty.due_date}`
    ]
  );

  const entryId = entry.rows[0].id;

  // DR: Late Fees Receivable
  await client.query(
    `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entryId, lateFeesReceivableId, amount, 0, 1, 'Late fee receivable']
  );
  await updateAccountBalance(client, lateFeesReceivableId, amount, 0, entryDate);

  // CR: Late Fee Income
  await client.query(
    `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entryId, lateFeeIncomeId, 0, amount, 2, 'Late fee income']
  );
  await updateAccountBalance(client, lateFeeIncomeId, 0, amount, entryDate);

  return entry.rows[0];
}

// ============================================================================
// 4. postExpense - for office expenses (salary, rent, etc.)
// ============================================================================
export async function postExpense(client, data) {
  const entryNumber = 'LDG' + Date.now().toString().slice(-7);
  const entryDate = data.expense_date || new Date().toISOString().split('T')[0];
  const amount = parseFloat(data.amount);

  // Resolve expense account
  const expenseAccountMap = {
    salary: ACCOUNT_CODES.SALARY_EXPENSE,
    rent: ACCOUNT_CODES.RENT_EXPENSE,
    office: ACCOUNT_CODES.OFFICE_EXPENSE,
    marketing: ACCOUNT_CODES.MARKETING_EXPENSE,
    travel: ACCOUNT_CODES.TRAVEL_EXPENSE,
  };
  const expenseCode = expenseAccountMap[data.expense_type] || ACCOUNT_CODES.OFFICE_EXPENSE;
  const expenseAccountId = await getAccountId(client, expenseCode);

  // Resolve bank account
  let bankAccountId = data.bank_account_id;
  if (!bankAccountId) {
    const bankResult = await client.query("SELECT id FROM bank_accounts WHERE is_primary = true LIMIT 1");
    bankAccountId = bankResult.rows[0]?.id;
  }
  if (!bankAccountId) {
    throw new Error('No bank account available for expense posting');
  }

  const bankCode = await resolveBankLedgerAccountId(bankAccountId);
  const bankLedgerId = await getAccountId(client, bankCode);

  // Create ledger entry
  const entry = await client.query(
    `INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_number, narration, bank_account_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      entryNumber, entryDate,
      data.description || `Expense - ${data.expense_type}`,
      'expense', data.expense_number || entryNumber,
      data.narration || `Expense of Rs.${amount} for ${data.expense_type}`,
      bankAccountId, data.created_by
    ]
  );

  const entryId = entry.rows[0].id;

  // DR: Expense Account
  await client.query(
    `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entryId, expenseAccountId, amount, 0, 1, data.description || `Expense - ${data.expense_type}`]
  );
  await updateAccountBalance(client, expenseAccountId, amount, 0, entryDate);

  // CR: Bank Account
  await client.query(
    `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entryId, bankLedgerId, 0, amount, 2, `Payment - ${data.expense_type}`]
  );
  await updateAccountBalance(client, bankLedgerId, 0, amount, entryDate);

  // Bank statement entry
  await client.query(
    `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, entry_type)
     VALUES ($1, $2, $3, $4, $5, 'manual')`,
    [bankAccountId, entryDate, data.description || `Expense - ${data.expense_type}`, entryNumber, amount]
  );

  return entry.rows[0];
}

// ============================================================================
// 5. postJournalEntry - manual journal entry
// ============================================================================
export async function postJournalEntry(data) {
  return withTransaction(async (client) => {
    const entryNumber = 'LDG' + Date.now().toString().slice(-7);
    const entryDate = data.entry_date || new Date().toISOString().split('T')[0];

    // Validate balanced
    const totalDebit = (data.lines || []).reduce(
      (sum, l) => sum + (parseFloat(l.debit_amount) || 0), 0
    );
    const totalCredit = (data.lines || []).reduce(
      (sum, l) => sum + (parseFloat(l.credit_amount) || 0), 0
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Journal entry not balanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`
      );
    }

    if (!data.lines || data.lines.length < 2) {
      throw new Error('Journal entry requires at least 2 lines');
    }

    // Create ledger entry
    const entry = await client.query(
      `INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_number, narration, bank_account_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        entryNumber, entryDate,
        data.description || 'Journal Entry',
        'journal', data.reference_number || entryNumber,
        data.narration || '',
        data.bank_account_id || null,
        data.created_by
      ]
    );

    const entryId = entry.rows[0].id;

    // Insert lines and update balances
    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      const debitAmt = parseFloat(line.debit_amount) || 0;
      const creditAmt = parseFloat(line.credit_amount) || 0;

      await client.query(
        `INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [entryId, line.account_id, debitAmt, creditAmt, i + 1, line.narration || '']
      );

      await updateAccountBalance(client, line.account_id, debitAmt, creditAmt, entryDate);
    }

    // Bank statement entry if bank account linked
    if (data.bank_account_id) {
      const creditLine = data.lines.find(l => parseFloat(l.credit_amount) > 0);
      const debitLine = data.lines.find(l => parseFloat(l.debit_amount) > 0);

      if (creditLine || debitLine) {
        await client.query(
          `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, credit_amount, balance, entry_type, ledger_entry_id)
           VALUES ($1, $2, $3, $4, $5, $6, 0, 'manual', $7)`,
          [
            data.bank_account_id, entryDate,
            data.description || 'Journal Entry',
            entryNumber,
            debitLine ? parseFloat(debitLine.debit_amount) : 0,
            creditLine ? parseFloat(creditLine.credit_amount) : 0,
            entryId
          ]
        );
      }
    }

    // Audit log
    if (data.created_by) {
      await logAudit(data.created_by, 'ledger.created', 'ledger', entryId, entryNumber);
    }

    return entry.rows[0];
  });
}

// ============================================================================
// 6. getLedgerAccountBalance - sum debits - sum credits for an account
// ============================================================================
export async function getLedgerAccountBalance(accountId, asOfDate) {
  const params = [accountId];
  let dateFilter = '';
  if (asOfDate) {
    dateFilter = 'AND le.entry_date <= $2';
    params.push(asOfDate);
  }

  const result = await query(
    `SELECT
      COALESCE(SUM(lel.debit_amount), 0) as total_debits,
      COALESCE(SUM(lel.credit_amount), 0) as total_credits,
      la.account_code, la.account_name, la.account_group, la.opening_balance
     FROM ledger_accounts la
     LEFT JOIN ledger_entry_lines lel ON lel.account_id = la.id
     LEFT JOIN ledger_entries le ON le.id = lel.ledger_entry_id
     WHERE la.id = $1 ${dateFilter}
     GROUP BY la.id`,
    params
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];
  const totalDebits = parseFloat(row.total_debits) || 0;
  const totalCredits = parseFloat(row.total_credits) || 0;
  const opening = parseFloat(row.opening_balance) || 0;

  // Asset/Expense: debit increases, credit decreases
  // Liability/Income/Equity: credit increases, debit decreases
  const group = row.account_group;
  let currentBalance;
  if (group === 'liabilities' || group === 'equity' || group === 'income') {
    currentBalance = opening + totalCredits - totalDebits;
  } else {
    currentBalance = opening + totalDebits - totalCredits;
  }

  return {
    account_id: accountId,
    account_code: row.account_code,
    account_name: row.account_name,
    account_group: group,
    opening_balance: opening,
    total_debits: totalDebits,
    total_credits: totalCredits,
    net_balance: totalDebits - totalCredits,
    current_balance: currentBalance,
  };
}

// ============================================================================
// 7. getLedgerEntries - get ledger entries with filters
// ============================================================================
export async function getLedgerEntries(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.account_id) {
    where += ` AND lel.account_id = $${idx++}`;
    params.push(filters.account_id);
  }
  if (filters.date_from) {
    where += ` AND le.entry_date >= $${idx++}`;
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    where += ` AND le.entry_date <= $${idx++}`;
    params.push(filters.date_to);
  }
  if (filters.entry_type) {
    where += ` AND le.reference_type = $${idx++}`;
    params.push(filters.entry_type);
  }
  if (filters.reference_id) {
    where += ` AND le.reference_id = $${idx++}`;
    params.push(filters.reference_id);
  }

  const result = await query(
    `SELECT DISTINCT le.*,
      la.account_code, la.account_name, la.account_group,
      lel.debit_amount, lel.credit_amount, lel.line_order, lel.narration as line_narration
     FROM ledger_entries le
     LEFT JOIN ledger_entry_lines lel ON lel.ledger_entry_id = le.id
     LEFT JOIN ledger_accounts la ON la.id = lel.account_id
     ${where}
     ORDER BY le.entry_date DESC, le.entry_number
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit || 50, filters.offset || 0]
  );

  // Group lines by entry
  const entriesMap = new Map();
  for (const row of result.rows) {
    if (!entriesMap.has(row.id)) {
      entriesMap.set(row.id, {
        id: row.id,
        entry_number: row.entry_number,
        entry_date: row.entry_date,
        description: row.description,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        reference_number: row.reference_number,
        narration: row.narration,
        created_at: row.created_at,
        lines: [],
      });
    }
    if (row.account_id) {
      entriesMap.get(row.id).lines.push({
        account_id: row.account_id,
        account_code: row.account_code,
        account_name: row.account_name,
        account_group: row.account_group,
        debit_amount: parseFloat(row.debit_amount) || 0,
        credit_amount: parseFloat(row.credit_amount) || 0,
        line_order: row.line_order,
        narration: row.line_narration,
      });
    }
  }

  return {
    entries: Array.from(entriesMap.values()),
    total: entriesMap.size,
  };
}

// ============================================================================
// 8. getTrialBalance - all accounts with debit/credit totals, balanced check
// ============================================================================
export async function getTrialBalance() {
  const result = await query(
    `SELECT
      la.id, la.account_code, la.account_name, la.account_group, la.account_type,
      la.opening_balance,
      COALESCE(SUM(lel.debit_amount), 0) as period_debits,
      COALESCE(SUM(lel.credit_amount), 0) as period_credits
     FROM ledger_accounts la
     LEFT JOIN ledger_entry_lines lel ON lel.account_id = la.id
     LEFT JOIN ledger_entries le ON le.id = lel.ledger_entry_id
     GROUP BY la.id
     ORDER BY la.account_code`
  );

  const accounts = result.rows.map(row => {
    const opening = parseFloat(row.opening_balance) || 0;
    const dr = parseFloat(row.period_debits) || 0;
    const cr = parseFloat(row.period_credits) || 0;

    // Calculate closing balance based on account group
    let closingBalance;
    if (row.account_group === 'liabilities' || row.account_group === 'equity' || row.account_group === 'income') {
      closingBalance = opening + cr - dr;
    } else {
      closingBalance = opening + dr - cr;
    }

    // For trial balance display:
    // Assets/Expenses show debit balance (if positive) or credit balance (if negative)
    // Liabilities/Income/Equity show credit balance (if positive) or debit balance (if negative)
    let debitBalance = 0;
    let creditBalance = 0;

    if (row.account_group === 'liabilities' || row.account_group === 'equity' || row.account_group === 'income') {
      if (closingBalance >= 0) {
        creditBalance = closingBalance;
      } else {
        debitBalance = Math.abs(closingBalance);
      }
    } else {
      if (closingBalance >= 0) {
        debitBalance = closingBalance;
      } else {
        creditBalance = Math.abs(closingBalance);
      }
    }

    return {
      id: row.id,
      account_code: row.account_code,
      account_name: row.account_name,
      account_group: row.account_group,
      account_type: row.account_type,
      opening_balance: opening,
      period_debits: dr,
      period_credits: cr,
      closing_balance: closingBalance,
      debit_balance: debitBalance,
      credit_balance: creditBalance,
    };
  });

  const totalDebits = accounts.reduce((sum, a) => sum + a.debit_balance, 0);
  const totalCredits = accounts.reduce((sum, a) => sum + a.credit_balance, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return {
    accounts,
    summary: {
      total_debit: totalDebits,
      total_credit: totalCredits,
      difference: totalDebits - totalCredits,
      is_balanced: isBalanced,
    },
  };
}

// ============================================================================
// 9. getAccountBalances - all ledger accounts with current balances
// ============================================================================
export async function getAccountBalances(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.group) {
    where += ` AND la.account_group = $${idx++}`;
    params.push(filters.group);
  }
  if (filters.type) {
    where += ` AND la.account_type = $${idx++}`;
    params.push(filters.type);
  }
  if (filters.search) {
    where += ` AND (la.account_name ILIKE $${idx} OR la.account_code ILIKE $${idx})`;
    params.push(`%${filters.search}%`, `%${filters.search}%`);
    idx += 2;
  }

  const result = await query(
    `SELECT
      la.id, la.account_code, la.account_name, la.account_group, la.account_type,
      la.opening_balance, la.current_balance,
      la.is_active, la.is_system, la.description,
      COALESCE(SUM(lel.debit_amount), 0) as total_debit,
      COALESCE(SUM(lel.credit_amount), 0) as total_credit
     FROM ledger_accounts la
     LEFT JOIN ledger_entry_lines lel ON lel.account_id = la.id
     LEFT JOIN ledger_entries le ON le.id = lel.ledger_entry_id
     ${where}
     GROUP BY la.id
     ORDER BY la.account_code`,
    params
  );

  return result.rows.map(row => {
    const opening = parseFloat(row.opening_balance) || 0;
    const current = parseFloat(row.current_balance) || 0;
    return {
      id: row.id,
      account_code: row.account_code,
      account_name: row.account_name,
      account_group: row.account_group,
      account_type: row.account_type,
      opening_balance: opening,
      current_balance: current,
      total_debit: parseFloat(row.total_debit) || 0,
      total_credit: parseFloat(row.total_credit) || 0,
      is_active: row.is_active,
      is_system: row.is_system,
      description: row.description,
    };
  });
}

// ============================================================================
// 10. updateAllAccountBalances(client) - recalculate ALL from ledger_entry_lines
// ============================================================================
export async function updateAllAccountBalances(client) {
  const q = client || query;

  // Get all accounts
  const accountsResult = await q(
    'SELECT id, account_code, account_name, account_group, opening_balance FROM ledger_accounts ORDER BY account_code'
  );

  const results = [];

  for (const account of accountsResult.rows) {
    // Calculate running totals from all entry lines
    const balanceResult = await client
      ? await client.query(
          `SELECT
            COALESCE(SUM(lel.debit_amount), 0) as total_debit,
            COALESCE(SUM(lel.credit_amount), 0) as total_credit
           FROM ledger_entry_lines lel
           JOIN ledger_entries le ON le.id = lel.ledger_entry_id
           WHERE lel.account_id = $1`,
          [account.id]
        )
      : await query(
          `SELECT
            COALESCE(SUM(lel.debit_amount), 0) as total_debit,
            COALESCE(SUM(lel.credit_amount), 0) as total_credit
           FROM ledger_entry_lines lel
           JOIN ledger_entries le ON le.id = lel.ledger_entry_id
           WHERE lel.account_id = $1`,
          [account.id]
        );

    const totalDebit = parseFloat(balanceResult.rows[0]?.total_debit) || 0;
    const totalCredit = parseFloat(balanceResult.rows[0]?.total_credit) || 0;
    const opening = parseFloat(account.opening_balance) || 0;

    // Calculate closing balance based on account group
    let closingBalance;
    if (account.account_group === 'liabilities' || account.account_group === 'equity' || account.account_group === 'income') {
      closingBalance = opening + totalCredit - totalDebit;
    } else {
      closingBalance = opening + totalDebit - totalCredit;
    }

    // Update ledger_accounts.current_balance
    await q(
      'UPDATE ledger_accounts SET current_balance = $1, updated_at = NOW() WHERE id = $2',
      [closingBalance, account.id]
    );

    // Upsert into ledger_account_balances for today
    await client
      ? await client.query(
          `INSERT INTO ledger_account_balances (account_id, as_of_date, opening_balance, total_debit, total_credit, closing_balance)
           VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
           ON CONFLICT (account_id, as_of_date) DO UPDATE SET
             total_debit = $3, total_credit = $4, closing_balance = $5`,
          [account.id, opening, totalDebit, totalCredit, closingBalance]
        )
      : await query(
          `INSERT INTO ledger_account_balances (account_id, as_of_date, opening_balance, total_debit, total_credit, closing_balance)
           VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
           ON CONFLICT (account_id, as_of_date) DO UPDATE SET
             total_debit = $3, total_credit = $4, closing_balance = $5`,
          [account.id, opening, totalDebit, totalCredit, closingBalance]
        );

    results.push({
      account_code: account.account_code,
      account_name: account.account_name,
      total_debit: totalDebit,
      total_credit: totalCredit,
      closing_balance: closingBalance,
    });
  }

  return {
    updated_count: results.length,
    accounts: results,
  };
}

// ============================================================================
// 11. createBankStatementEntry - insert into bank_statement_entries
// ============================================================================
export async function createBankStatementEntry(client, data) {
  const result = await (client || query)(
    `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, credit_amount, balance, entry_type, is_reconciled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      data.bank_account_id, data.entry_date, data.description, data.transaction_ref,
      data.debit_amount || 0, data.credit_amount || 0,
      data.balance || 0, data.entry_type || 'manual', data.is_reconciled || false
    ]
  );

  return result.rows[0];
}

// ============================================================================
// Existing: getLedgerAccounts
// ============================================================================
export async function getLedgerAccounts(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.group) { where += ` AND account_group = $${idx++}`; params.push(filters.group); }
  if (filters.type) { where += ` AND account_type = $${idx++}`; params.push(filters.type); }
  if (filters.search) { where += ` AND account_name ILIKE $${idx++}`; params.push(`%${filters.search}%`); }

  const result = await query(`SELECT * FROM ledger_accounts ${where} ORDER BY account_code`, params);
  return result.rows;
}

// ============================================================================
// Existing: createLedgerEntry (manual)
// ============================================================================
export async function createLedgerEntry(data) {
  return withTransaction(async (client) => {
    const entryNumber = 'LDG' + Date.now().toString().slice(-7);
    const entry = await client.query(
      `INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_id, narration, bank_account_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [entryNumber, data.entry_date, data.description, data.reference_type, data.reference_id, data.narration, data.bank_account_id]
    );
    const entryId = entry.rows[0].id;

    // Validate balanced
    const totalDebit = (data.lines || []).reduce((s, l) => s + (parseFloat(l.debit_amount) || 0), 0);
    const totalCredit = (data.lines || []).reduce((s, l) => s + (parseFloat(l.credit_amount) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Entry not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    for (const line of data.lines) {
      await client.query(
        'INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration) VALUES ($1, $2, $3, $4, $5, $6)',
        [entryId, line.account_id, line.debit_amount || 0, line.credit_amount || 0, line.line_order || 1, line.narration || '']
      );
      await updateAccountBalance(client, line.account_id, line.debit_amount || 0, line.credit_amount || 0, data.entry_date);
    }

    if (data.bank_account_id) {
      await client.query(
        `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, credit_amount, balance, entry_type, ledger_entry_id)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 'manual', $7)`,
        [data.bank_account_id, data.entry_date, data.description, entryNumber, totalDebit, totalCredit, entryId]
      );
    }

    if (data.created_by) {
      await logAudit(data.created_by, 'ledger.created', 'ledger', entryId, entryNumber);
    }

    return entry.rows[0];
  });
}

// ============================================================================
// Existing: getLedgerEntryLines
// ============================================================================
export async function getLedgerEntryLines(entryId) {
  const result = await query(
    `SELECT ll.*, la.account_code, la.account_name, la.account_group, la.account_type
     FROM ledger_entry_lines ll
     JOIN ledger_accounts la ON la.id = ll.account_id
     WHERE ll.ledger_entry_id = $1 ORDER BY ll.line_order`,
    [entryId]
  );
  return result.rows;
}

// ============================================================================
// Existing: getBankAccounts
// ============================================================================
export async function getBankAccounts() {
  const result = await query('SELECT * FROM bank_accounts WHERE is_active = true ORDER BY is_primary DESC, created_at');
  return result.rows;
}

// ============================================================================
// Existing: createBankAccount
// ============================================================================
export async function createBankAccount(data) {
  const result = await query(
    `INSERT INTO bank_accounts (account_code, bank_name, account_number, account_name, account_type, ifsc_code, branch_name, opening_balance, current_balance, is_primary, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING *`,
    ['BNK' + Date.now().toString().slice(-7), data.bank_name, data.account_number, data.account_name,
     data.account_type || 'current', data.ifsc_code, data.branch_name || '',
     data.opening_balance || 0, data.opening_balance || 0, data.is_primary || false]
  );
  return result.rows[0];
}

// ============================================================================
// Existing: getBankStatements
// ============================================================================
export async function getBankStatements(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.bank_account_id) { where += ` AND bse.bank_account_id = $${idx++}`; params.push(filters.bank_account_id); }
  if (filters.date_from) { where += ` AND bse.entry_date >= $${idx++}`; params.push(filters.date_from); }
  if (filters.date_to) { where += ` AND bse.entry_date <= $${idx++}`; params.push(filters.date_to); }

  const result = await query(
    `SELECT bse.*, ba.bank_name, ba.account_number
     FROM bank_statement_entries bse
     JOIN bank_accounts ba ON ba.id = bse.bank_account_id
     ${where}
     ORDER BY bse.entry_date DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit || 100, filters.offset || 0]
  );
  return result.rows;
}

// ============================================================================
// Existing: getLedgerReport
// ============================================================================
export async function getLedgerReport(dateFrom, dateTo) {
  const incomeResult = await query(
    `SELECT COALESCE(SUM(ll.debit_amount), 0) as total_income
     FROM ledger_entries le
     JOIN ledger_entry_lines ll ON ll.ledger_entry_id = le.id
     WHERE le.entry_date >= $1 AND le.entry_date <= $2
     AND ll.account_id IN (SELECT id FROM ledger_accounts WHERE account_group = 'income')`,
    [dateFrom, dateTo]
  );
  const expenseResult = await query(
    `SELECT COALESCE(SUM(ll.debit_amount), 0) as total_expenses
     FROM ledger_entries le
     JOIN ledger_entry_lines ll ON ll.ledger_entry_id = le.id
     WHERE le.entry_date >= $1 AND le.entry_date <= $2
     AND ll.account_id IN (SELECT id FROM ledger_accounts WHERE account_group = 'expenses')`,
    [dateFrom, dateTo]
  );
  return {
    totalIncome: parseFloat(incomeResult.rows[0]?.total_income || 0),
    totalExpenses: parseFloat(expenseResult.rows[0]?.total_expenses || 0),
    netProfit: parseFloat(incomeResult.rows[0]?.total_income || 0) - parseFloat(expenseResult.rows[0]?.total_expenses || 0),
  };
}

// ============================================================================
// Existing: updateAccountBalances (kept for backward compat)
// ============================================================================
export async function updateAccountBalances() {
  const accounts = await query('SELECT id, account_code, account_group, opening_balance FROM ledger_accounts');
  for (const acc of accounts.rows) {
    const result = await query(
      `SELECT COALESCE(SUM(ll.debit_amount), 0) as dr, COALESCE(SUM(ll.credit_amount), 0) as cr
       FROM ledger_entry_lines ll WHERE ll.account_id = $1`,
      [acc.id]
    );
    const dr = parseFloat(result.rows[0]?.dr || 0);
    const cr = parseFloat(result.rows[0]?.cr || 0);
    const opening = parseFloat(acc.opening_balance) || 0;
    let currentBalance;
    if (acc.account_group === 'liabilities' || acc.account_group === 'equity' || acc.account_group === 'income') {
      currentBalance = opening + cr - dr;
    } else {
      currentBalance = opening + dr - cr;
    }
    await query('UPDATE ledger_accounts SET current_balance = $1 WHERE id = $2', [currentBalance, acc.id]);
  }
  return { updated: accounts.rows.length };
}
