import { query, withTransaction } from '../config/db.js';
import { logAudit } from './applicationService.js';
import { postEmiPayment, postPenalty } from './ledgerService.js';

// ============================================================================
// 1. generateEmiSchedule - create emi_schedules for entire loan tenure
// ============================================================================
export async function generateEmiSchedule(loanId, loanData) {
  return withTransaction(async (client) => {
    const principal = parseFloat(loanData.loan_amount);
    const monthlyRate = parseFloat(loanData.interest_rate) / 100 / 12;
    const months = loanData.tenure_months;
    const emi = parseFloat(loanData.emi_amount);
    const interestType = loanData.interest_type || 'reducing';

    // Get the loan to find first_emi_date
    const loanResult = await client.query('SELECT first_emi_date FROM loans WHERE id = $1', [loanId]);
    const firstEmiDate = new Date(loanResult.rows[0]?.first_emi_date || new Date());

    let balance = principal;

    for (let i = 1; i <= months; i++) {
      const interest = Math.round(balance * monthlyRate * 100) / 100;
      let principalComponent;
      let closingBalance;

      if (interestType === 'flat') {
        principalComponent = Math.round(principal / months * 100) / 100;
        closingBalance = Math.round((balance - principalComponent) * 100) / 100;
      } else {
        principalComponent = Math.round((emi - interest) * 100) / 100;
        if (i === months) {
          principalComponent = balance;
          closingBalance = 0;
        } else {
          closingBalance = Math.round((balance - principalComponent) * 100) / 100;
        }
      }

      const dueDate = new Date(firstEmiDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      const dueDateStr = dueDate.toISOString().split('T')[0];

      await client.query(
        `INSERT INTO emi_schedules (loan_id, emi_number, due_date, emi_amount, principal, interest,
         opening_balance, closing_balance, is_paid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
        [loanId, i, dueDateStr, emi, principalComponent, interest, balance, closingBalance]
      );

      balance = closingBalance;
    }
  });
}

// ============================================================================
// 2. applyLatePenalties - find overdue EMIs, apply penalties
// ============================================================================
export async function applyLatePenalties() {
  // Get settings
  const graceDaysResult = await query(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'late_payment_grace_days'"
  );
  const graceDays = parseInt(graceDaysResult.rows[0]?.setting_value || '7');

  const feeTypeResult = await query(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'late_fee_type'"
  );
  const feeValueResult = await query(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'late_fee_value'"
  );

  const feeType = feeTypeResult.rows[0]?.setting_value || 'percentage';
  const feeValue = parseFloat(feeValueResult.rows[0]?.setting_value || '2.0');

  // Find overdue EMIs that haven't been penalized
  const overdueResult = await query(
    `SELECT e.*, l.customer_id, l.loan_amount, l.interest_rate, l.branch_id,
       lp.late_payment_penalty_type, lp.late_payment_penalty_value
     FROM emi_schedules e
     JOIN loans l ON l.id = e.loan_id
     JOIN loan_products lp ON lp.id = l.product_id
     WHERE e.is_paid = false
       AND e.penalty_applied = 0
       AND e.due_date < (CURRENT_DATE - $1::int)`,
    [graceDays]
  );

  let appliedCount = 0;

  for (const emi of overdueResult.rows) {
    const penaltyType = emi.late_payment_penalty_type || feeType;
    const penaltyRate = emi.late_payment_penalty_value || feeValue;
    let penaltyAmount;

    if (penaltyType === 'flat') {
      penaltyAmount = parseFloat(penaltyRate);
    } else {
      penaltyAmount = Math.round(parseFloat(emi.emi_amount) * (parseFloat(penaltyRate) / 100) * 100) / 100;
    }

    if (penaltyAmount <= 0) continue;

    const penaltyNumber = 'PEN' + Date.now().toString().slice(-7);
    const daysOverdue = Math.floor(
      (new Date() - new Date(emi.due_date)) / (1000 * 60 * 60 * 24)
    );

    await withTransaction(async (client) => {
      // Create penalty record
      const penaltyResult = await client.query(
        `INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type,
         penalty_amount, final_amount, penalty_date, due_date)
         VALUES ($1, $2, $3, $4, 'late_payment', $5, $5, CURRENT_DATE, $6) RETURNING *`,
        [penaltyNumber, emi.loan_id, emi.id, emi.customer_id, penaltyAmount, emi.due_date]
      );

      const penalty = penaltyResult.rows[0];

      // Update EMI schedule
      await client.query(
        `UPDATE emi_schedules SET penalty_applied = $1, days_overdue = $2 WHERE id = $3`,
        [penaltyAmount, daysOverdue, emi.id]
      );

      // Post penalty ledger entry
      await postPenalty(client, penalty);
    });

    appliedCount++;
  }

  return { applied_count: appliedCount };
}

// ============================================================================
// 3. getEmiStats - get EMI collection stats
// ============================================================================
export async function getEmiStats(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.loan_id) { where += ` AND e.loan_id = $${idx++}`; params.push(filters.loan_id); }
  if (filters.customer_id) { where += ` AND l.customer_id = $${idx++}`; params.push(filters.customer_id); }
  if (filters.date_from) { where += ` AND e.due_date >= $${idx++}`; params.push(filters.date_from); }
  if (filters.date_to) { where += ` AND e.due_date <= $${idx++}`; params.push(filters.date_to); }

  const result = await query(
    `SELECT
       COUNT(*) as total_emis,
       COUNT(*) FILTER (WHERE e.is_paid = true) as paid_count,
       COUNT(*) FILTER (WHERE e.is_paid = false AND e.due_date >= CURRENT_DATE) as upcoming_count,
       COUNT(*) FILTER (WHERE e.is_paid = false AND e.due_date < CURRENT_DATE) as overdue_count,
       COALESCE(SUM(CASE WHEN e.is_paid = true THEN e.emi_amount ELSE 0 END), 0) as total_collected,
       COALESCE(SUM(CASE WHEN e.is_paid = false THEN e.emi_amount ELSE 0 END), 0) as total_pending,
       COALESCE(SUM(e.penalty_applied), 0) as total_penalty_applied,
       COALESCE(AVG(CASE WHEN e.is_paid = true THEN 1.0 ELSE 0.0 END), 0) * 100 as collection_rate_pct
     FROM emi_schedules e
     JOIN loans l ON l.id = e.loan_id
     ${where}`,
    params
  );

  return result.rows[0];
}

// ============================================================================
// 4. markEmiPaid - mark an EMI as paid with payment details
// ============================================================================
export async function markEmiPaid(emiId, paymentData) {
  return withTransaction(async (client) => {
    // Get EMI and loan details
    const emiResult = await client.query(
      `SELECT e.*, l.customer_id, l.loan_number, l.interest_rate,
       l.principal_paid, l.interest_paid, l.emi_paid_count, l.overdue_emis
       FROM emi_schedules e
       JOIN loans l ON l.id = e.loan_id
       WHERE e.id = $1`,
      [emiId]
    );

    const emi = emiResult.rows[0];
    if (!emi) throw new Error('EMI not found');
    if (emi.is_paid) throw new Error('EMI is already paid');

    const paymentAmount = parseFloat(paymentData.payment_amount || emi.emi_amount);
    const principalComponent = parseFloat(emi.principal);
    const interestComponent = parseFloat(emi.interest);
    const penaltyComponent = parseFloat(emi.penalty_applied || 0);
    const totalAmount = paymentAmount + penaltyComponent;

    const paymentNumber = 'PAY' + Date.now().toString().slice(-7);

    // Insert payment record
    const payResult = await client.query(
      `INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id,
       payment_amount, principal_component, interest_component, penalty_component,
       payment_method, bank_account_id, transaction_ref, payment_date, received_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        paymentNumber, emi.loan_id, emi.id, emi.customer_id,
        totalAmount, principalComponent, interestComponent, penaltyComponent,
        paymentData.payment_method || 'cash', paymentData.bank_account_id || null,
        paymentData.transaction_ref || '',
        paymentData.payment_date || new Date().toISOString().split('T')[0],
        paymentData.received_by, paymentData.notes || ''
      ]
    );

    // Update EMI schedule
    await client.query(
      `UPDATE emi_schedules SET is_paid = true, paid_on = $1, paid_amount = $2, is_overdue = false
       WHERE id = $3`,
      [paymentData.payment_date || new Date().toISOString().split('T')[0], totalAmount, emiId]
    );

    // Update loan totals
    await client.query(
      `UPDATE loans SET
        principal_paid = COALESCE(principal_paid, 0) + $1,
        interest_paid = COALESCE(interest_paid, 0) + $2,
        penalty_collected = COALESCE(penalty_collected, 0) + $3,
        emi_paid_count = COALESCE(emi_paid_count, 0) + 1,
        overdue_emis = GREATEST(0, COALESCE(overdue_emis, 0) - 1),
        outstanding_principal = GREATEST(0, COALESCE(outstanding_principal, 0) - $1)
       WHERE id = $4`,
      [principalComponent, interestComponent, penaltyComponent, emi.loan_id]
    );

    // Mark related penalties as paid
    if (penaltyComponent > 0) {
      await client.query(
        `UPDATE penalties SET is_paid = true, paid_on = $1
         WHERE loan_id = $2 AND emi_schedule_id = $3 AND is_paid = false AND is_waived = false`,
        [paymentData.payment_date || new Date().toISOString().split('T')[0], emi.loan_id, emi.id]
      );
    }

    // Create receipt
    const receiptNumber = 'RCP' + Date.now().toString().slice(-7);
    const receiptResult = await client.query(
      `INSERT INTO payment_receipts (receipt_number, emi_payment_id, loan_id, customer_id,
       receipt_amount, receipt_date, receipt_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [receiptNumber, payResult.rows[0].id, emi.loan_id, emi.customer_id, totalAmount,
       paymentData.payment_date || new Date().toISOString().split('T')[0], 'emi']
    );

    // Create ledger entry for EMI payment
    await postEmiPayment(client, {
      loan_id: emi.loan_id,
      payment_amount: totalAmount,
      principal_component: principalComponent,
      interest_component: interestComponent,
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      received_by: paymentData.received_by,
      bank_account_id: paymentData.bank_account_id,
      transaction_ref: paymentResult?.payment_number || '',
    });

    // Audit log
    await logAudit(paymentData.received_by, 'emi.payment', 'emi', emi.loan_id, paymentNumber);

    return {
      payment_id: payResult.rows[0].id,
      payment_number: paymentNumber,
      receipt_id: receiptResult.rows[0].id,
      receipt_number: receiptNumber,
      payment_amount: totalAmount,
      principal_component,
      interest_component,
      penalty_component,
    };
  });
}

// ============================================================================
// Existing: recordEmiPayment
// ============================================================================
export async function recordEmiPayment(data) {
  return withTransaction(async (client) => {
    const paymentNumber = data.payment_number || ('PAY' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 100));

    const emi = data.emi_schedule_id ? (await client.query(
      `SELECT * FROM emi_schedules WHERE id = $1`, [data.emi_schedule_id])).rows[0] : null;

    let principalComponent = data.principal_component;
    let interestComponent = data.interest_component;
    let penaltyComponent = data.penalty_component || 0;

    if (emi && (!principalComponent && !interestComponent)) {
      principalComponent = parseFloat(emi.principal);
      interestComponent = parseFloat(emi.interest);
    }

    const payResult = await client.query(
      `INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id,
       payment_amount, principal_component, interest_component, penalty_component,
       payment_method, bank_account_id, transaction_ref, payment_date, received_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [paymentNumber, data.loan_id, data.emi_schedule_id, data.customer_id,
       data.payment_amount, principalComponent, interestComponent, penaltyComponent,
       data.payment_method, data.bank_account_id, data.transaction_ref, data.payment_date,
       data.received_by, data.notes]
    );

    if (data.emi_schedule_id) {
      await client.query(
        `UPDATE emi_schedules SET is_paid = true, paid_on = $1, paid_amount = $2, is_overdue = false WHERE id = $3`,
        [data.payment_date, data.payment_amount, data.emi_schedule_id]
      );
    }

    await client.query(
      `UPDATE loans SET principal_paid = COALESCE(principal_paid, 0) + $1,
       interest_paid = COALESCE(interest_paid, 0) + $2,
       penalty_collected = COALESCE(penalty_collected, 0) + $3,
       emi_paid_count = COALESCE(emi_paid_count, 0) + 1,
       overdue_emis = GREATEST(0, COALESCE(overdue_emis, 0) - 1),
       outstanding_principal = GREATEST(0, COALESCE(outstanding_principal, 0) - $1)
       WHERE id = $4`,
      [principalComponent, interestComponent, penaltyComponent, data.loan_id]
    );

    if (penaltyComponent > 0) {
      await client.query(
        `UPDATE penalties SET is_paid = true, paid_on = $1
         WHERE loan_id = $2 AND is_paid = false AND is_waived = false`,
        [data.payment_date, data.loan_id]
      );
    }

    const receiptNumber = 'RCP' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 100);
    const receiptResult = await client.query(
      `INSERT INTO payment_receipts (receipt_number, emi_payment_id, loan_id, customer_id, receipt_amount, receipt_date, receipt_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [receiptNumber, payResult.rows[0].id, data.loan_id, data.customer_id, data.payment_amount, data.payment_date, data.receipt_type || 'emi']
    );

    const ledgerData = {
      payment_date: data.payment_date,
      loan_id: data.loan_id,
      payment_amount: parseFloat(data.payment_amount),
      principal_component: parseFloat(principalComponent) || 0,
      interest_component: parseFloat(interestComponent) || 0,
      penalty_component: parseFloat(penaltyComponent) || 0,
      bank_account_id: data.bank_account_id,
      transaction_ref: data.transaction_ref,
    };
    await postEmiPayment(client, ledgerData);

    await logAudit(data.received_by, 'emi.payment', 'emi', data.loan_id, paymentNumber);

    return {
      paymentId: payResult.rows[0].id,
      paymentNumber,
      receiptId: receiptResult.rows[0].id,
      receiptNumber,
    };
  });
}

// ============================================================================
// Existing: createPenalty
// ============================================================================
export async function createPenalty(data) {
  const penaltyNumber = data.penalty_number || ('PEN' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 100));
  const result = await query(
    `INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type,
     penalty_amount, final_amount, penalty_date, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [penaltyNumber, data.loan_id, data.emi_schedule_id, data.customer_id, data.penalty_type,
     data.penalty_amount, data.final_amount || data.penalty_amount, data.penalty_date, data.due_date]
  );
  return result.rows[0];
}

// ============================================================================
// Existing: updateEmiOverdueStatus
// ============================================================================
export async function updateEmiOverdueStatus() {
  const result = await query(
    `UPDATE emi_schedules
     SET is_overdue = true, days_overdue = CURRENT_DATE - due_date
     WHERE is_paid = false AND due_date < CURRENT_DATE
     AND (is_overdue = false OR days_overdue != (CURRENT_DATE - due_date))`
  );

  await query(
    `UPDATE loans l SET overdue_emis = (
       SELECT COUNT(*) FROM emi_schedules WHERE loan_id = l.id AND is_paid = false AND due_date < CURRENT_DATE
     ) WHERE l.status = 'active'`
  );

  return { updated: result.rowCount };
}

// ============================================================================
// Existing: getOverdues
// ============================================================================
export async function getOverdues() {
  const result = await query(
    `SELECT e.*, l.loan_number, l.customer_id, l.interest_rate,
       u.email, u.phone, p.first_name, p.last_name, p.address
     FROM emi_schedules e
     JOIN loans l ON l.id = e.loan_id
     JOIN users u ON u.id = l.customer_id
     LEFT JOIN user_profiles p ON p.user_id = l.customer_id
     WHERE e.is_paid = false AND e.due_date < CURRENT_DATE
     ORDER BY e.due_date ASC`
  );
  return result.rows;
}

// ============================================================================
// Existing: getCustomerEmis
// ============================================================================
export async function getCustomerEmis(customerId) {
  const result = await query(
    `SELECT e.*, l.loan_number, l.product_id
     FROM emi_schedules e
     JOIN loans l ON l.id = e.loan_id
     WHERE l.customer_id = $1
     ORDER BY e.due_date DESC`,
    [customerId]
  );
  return result.rows;
}

// ============================================================================
// Existing: getCustomerDues
// ============================================================================
export async function getCustomerDues(customerId) {
  const result = await query(
    `SELECT e.*, l.loan_number, l.outstanding_principal, p.product_name,
       p.late_payment_penalty_value as penalty_rate
     FROM emi_schedules e
     JOIN loans l ON l.id = e.loan_id
     JOIN loan_products p ON p.id = l.product_id
     WHERE l.customer_id = $1 AND e.is_paid = false
     ORDER BY e.due_date ASC`,
    [customerId]
  );
  return result.rows;
}
