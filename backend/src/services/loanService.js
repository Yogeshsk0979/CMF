import { query, withTransaction } from '../config/db.js';
import { logAudit } from './applicationService.js';
import { calculateEmi } from './disbursementService.js';

// ============================================================================
// 1. createLoan - creates a loan from an approved application
// ============================================================================
export async function createLoan(data) {
  return withTransaction(async (client) => {
    const approvedAmount = data.approved_amount || data.loan_amount;

    const emiResult = calculateEmi(
      parseFloat(approvedAmount),
      parseFloat(data.interest_rate),
      data.tenure_months
    );

    const totalInterest = Math.round(emiResult.totalInterest * 100) / 100;
    const totalPayable = Math.round(emiResult.totalPayable * 100) / 100;
    const totalCharges = parseFloat(data.total_charges || 0);
    const netDisbursementAmount = parseFloat(data.net_disbursement_amount || approvedAmount);

    const loanResult = await client.query(
      `INSERT INTO loans (loan_number, application_id, customer_id, product_id, branch_id, area_id,
       loan_amount, approved_amount, tenure_months, interest_rate, interest_type, emi_amount,
       total_interest, total_payable, total_charges, disbursement_net_amount, total_disbursed,
       outstanding_principal, outstanding_total, total_emis, status, first_emi_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *`,
      [
        null,
        data.application_id, data.customer_id, data.product_id, data.branch_id, data.area_id || null,
        data.loan_amount, approvedAmount, data.tenure_months, data.interest_rate,
        'reducing', emiResult.emi, totalInterest, totalPayable, totalCharges,
        netDisbursementAmount, approvedAmount,
        approvedAmount, totalPayable + totalCharges,
        data.tenure_months, 'disbursed', data.first_emi_date, data.created_by
      ]
    );

    const loan = loanResult.rows[0];
    await generateEmiSchedule(client, loan);

    const lastEmi = await client.query(
      'SELECT due_date FROM emi_schedules WHERE loan_id = $1 ORDER BY emi_number DESC LIMIT 1',
      [loan.id]
    );
    if (lastEmi.rows[0]) {
      await client.query('UPDATE loans SET last_emi_date = $1 WHERE id = $2', [lastEmi.rows[0].due_date, loan.id]);
    }

    await client.query(
      "UPDATE applications SET status = 'disbursed', disbursed_at = NOW() WHERE id = $1",
      [data.application_id]
    );

    await logAudit(data.created_by, 'loan.disbursed', 'loan', loan.id, loan.loan_number);

    const schedule = await client.query(
      'SELECT * FROM emi_schedules WHERE loan_id = $1 ORDER BY emi_number',
      [loan.id]
    );

    return { ...loan, emi_schedule: schedule.rows };
  });
}

// ============================================================================
// generateEmiSchedule - create emi_schedules for entire loan tenure
// ============================================================================
export async function generateEmiSchedule(client, loan) {
  const principal = parseFloat(loan.loan_amount);
  const monthlyRate = parseFloat(loan.interest_rate) / 100 / 12;
  const months = loan.tenure_months;
  const emi = parseFloat(loan.emi_amount);
  const interestType = loan.interest_type || 'reducing';

  let balance = principal;
  const firstEmiDate = new Date(loan.first_emi_date);

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
      [loan.id, i, dueDateStr, emi, principalComponent, interest, balance, closingBalance]
    );

    balance = closingBalance;
  }
}

// ============================================================================
// 2. getLoan - get loan with customer, product details
// ============================================================================
export async function getLoan(loanId) {
  const result = await query(
    `SELECT l.*,
       a.application_number,
       u.email, u.phone, u.customer_code, u.role,
       p.first_name, p.last_name, p.date_of_birth, p.gender,
       lp.product_name, lp.category, lp.interest_type as product_interest_type,
       lp.processing_fee_type, lp.processing_fee_value,
       lp.document_charge_type, lp.document_charge_value,
       lp.insurance_type, lp.insurance_value,
       lp.foreclosure_allowed, lp.foreclosure_charge_pct,
       lp.late_payment_penalty_type, lp.late_payment_penalty_value,
       lp.late_payment_grace_days,
       b.branch_name, b.branch_code,
       ar.area_name
     FROM loans l
     JOIN applications a ON a.id = l.application_id
     JOIN users u ON u.id = l.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN loan_products lp ON lp.id = l.product_id
     JOIN branches b ON b.id = l.branch_id
     LEFT JOIN areas ar ON ar.id = l.area_id
     WHERE l.id = $1`,
    [loanId]
  );
  return result.rows[0];
}

// ============================================================================
// 3. getLoans - list with filters
// ============================================================================
export async function getLoans(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.customer_id) { where += ` AND l.customer_id = $${idx++}`; params.push(filters.customer_id); }
  if (filters.status) { where += ` AND l.status = $${idx++}`; params.push(filters.status); }
  if (filters.branch_id) { where += ` AND l.branch_id = $${idx++}`; params.push(filters.branch_id); }
  if (filters.product_id) { where += ` AND l.product_id = $${idx++}`; params.push(filters.product_id); }
  if (filters.search) {
    where += ` AND (u.email ILIKE $${idx++} OR l.loan_number ILIKE $${idx++} OR p.first_name ILIKE $${idx++})`;
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const result = await query(
    `SELECT l.id, l.loan_number, l.status, l.loan_amount, l.emi_amount,
       l.outstanding_principal, l.outstanding_total,
       l.tenure_months, l.interest_rate, l.emi_paid_count, l.total_emis,
       l.overdue_emis, l.created_at as disbursement_date, l.first_emi_date, l.last_emi_date,
       l.created_at,
       u.email, u.customer_code,
       p.first_name, p.last_name,
       lp.product_name, lp.category,
       b.branch_name
     FROM loans l
     JOIN users u ON u.id = l.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN loan_products lp ON lp.id = l.product_id
     JOIN branches b ON b.id = l.branch_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM loans l JOIN users u ON u.id = l.customer_id LEFT JOIN user_profiles p ON p.user_id = u.id ${where}`,
    params
  );

  return { loans: result.rows, total: parseInt(countResult.rows[0].count) };
}

// ============================================================================
// 4. getEmiSchedule - all EMI schedules for a loan
// ============================================================================
export async function getEmiSchedule(loanId) {
  const result = await query(
    `SELECT e.*, l.loan_number, l.interest_rate, lp.product_name
     FROM emi_schedules e
     JOIN loans l ON l.id = e.loan_id
     JOIN loan_products lp ON lp.id = l.product_id
     WHERE e.loan_id = $1
     ORDER BY e.emi_number`,
    [loanId]
  );
  return result.rows;
}

// ============================================================================
// 5. getLoanSummary - summary of all loans for a customer
// ============================================================================
export async function getLoanSummary(customerId) {
  const result = await query(
    `SELECT
       COUNT(*) as total_loans,
       COALESCE(SUM(loan_amount), 0) as total_disbursed,
       COALESCE(SUM(outstanding_principal), 0) as total_outstanding,
       COALESCE(SUM(principal_paid + interest_paid), 0) as total_repaid,
       COALESCE(SUM(principal_paid), 0) as total_principal_paid,
       COALESCE(SUM(interest_paid), 0) as total_interest_paid,
       COALESCE(SUM(penalty_collected), 0) as total_penalty_collected,
       COALESCE(SUM(total_payable), 0) as total_payable,
       SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) as disbursed_loans,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_loans,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_loans,
       SUM(CASE WHEN status = 'foreclosed' THEN 1 ELSE 0 END) as foreclosed_loans,
       SUM(CASE WHEN status = 'npa' THEN 1 ELSE 0 END) as npa_loans,
       SUM(CASE WHEN status IN ('disbursed', 'active') THEN 1 ELSE 0 END) as live_loans,
       SUM(overdue_emis) as total_overdue_emis
     FROM loans WHERE customer_id = $1`,
    [customerId]
  );
  return result.rows[0];
}

// ============================================================================
// 6. forecloseLoan - foreclose a loan
// ============================================================================
export async function forecloseLoan(loanId) {
  return withTransaction(async (client) => {
    const loanResult = await client.query(
      `SELECT l.*, lp.foreclosure_allowed, lp.foreclosure_charge_pct
       FROM loans l
       JOIN loan_products lp ON lp.id = l.product_id
       WHERE l.id = $1`,
      [loanId]
    );
    const loan = loanResult.rows[0];
    if (!loan) throw new Error('Loan not found');
    if (!loan.foreclosure_allowed) throw new Error('Foreclosure not allowed for this product');
    if (loan.status !== 'active' && loan.status !== 'disbursed') {
      throw new Error('Only active or disbursed loans can be foreclosed');
    }

    const unpaidResult = await client.query(
      `SELECT SUM(closing_balance) as remaining_principal
       FROM emi_schedules WHERE loan_id = $1 AND is_paid = false`,
      [loanId]
    );
    const remainingPrincipal = parseFloat(unpaidResult.rows[0]?.remaining_principal || 0);

    const foreclosureChargePct = parseFloat(loan.foreclosure_charge_pct) || 0;
    const foreclosureCharges = Math.round(remainingPrincipal * (foreclosureChargePct / 100) * 100) / 100;

    await client.query(
      `UPDATE emi_schedules SET is_paid = true, paid_on = CURRENT_DATE, paid_amount = closing_balance,
       notes = COALESCE(notes, '') || ' - Foreclosed'
       WHERE loan_id = $1 AND is_paid = false`,
      [loanId]
    );

    const totalPrincipalPaid = parseFloat(loan.principal_paid || 0) + remainingPrincipal;

    await client.query(
      `UPDATE loans SET
        status = 'foreclosed',
        foreclosure_date = CURRENT_DATE,
        closure_date = CURRENT_DATE,
        outstanding_principal = 0,
        outstanding_total = $1,
        principal_paid = $2,
        total_charges = COALESCE(total_charges, 0) + $3
       WHERE id = $4`,
      [foreclosureCharges, totalPrincipalPaid, foreclosureCharges, loanId]
    );

    if (foreclosureCharges > 0) {
      const penaltyNumber = 'PEN' + Date.now().toString().slice(-7);
      await client.query(
        `INSERT INTO penalties (penalty_number, loan_id, customer_id, penalty_type, penalty_amount,
         final_amount, penalty_date, due_date, is_paid)
         VALUES ($1, $2, $3, 'foreclosure', $4, $4, CURRENT_DATE, CURRENT_DATE, false)`,
        [penaltyNumber, loanId, loan.customer_id, foreclosureCharges]
      );
    }

    await logAudit(null, 'loan.foreclosed', 'loan', loanId, loan.loan_number);

    return {
      loan_id: loanId,
      loan_number: loan.loan_number,
      remaining_principal: remainingPrincipal,
      foreclosure_charges: foreclosureCharges,
      total_settled: remainingPrincipal + foreclosureCharges,
      status: 'foreclosed',
    };
  });
}

// ============================================================================
// Additional: getActiveEmis
// ============================================================================
export async function getActiveEmis(loanId) {
  const result = await query(
    `SELECT * FROM emi_schedules WHERE loan_id = $1 AND is_paid = false ORDER BY emi_number`,
    [loanId]
  );
  return result.rows;
}

// ============================================================================
// Additional: getOverdueEmis
// ============================================================================
export async function getOverdueEmis(loanId) {
  const result = await query(
    `SELECT * FROM emi_schedules
     WHERE loan_id = $1 AND is_paid = false AND due_date < CURRENT_DATE
     ORDER BY due_date`,
    [loanId]
  );
  return result.rows;
}

// ============================================================================
// Additional: getLoanById alias
// ============================================================================
export async function getLoanById(loanId) {
  return getLoan(loanId);
}

// ============================================================================
// Additional: generateLoanNumber helper
// ============================================================================
export async function generateLoanNumber() {
  const result = await query("SELECT generate_id('LON') as loan_number");
  return result.rows[0]?.loan_number;
}

// ============================================================================
// Additional: generateLoanFromDisbursement
// ============================================================================
export async function generateLoanFromDisbursement(client, data) {
  const loanNumber = 'LON' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 100);
  const emiResult = calculateEmi(parseFloat(data.loan_amount), parseFloat(data.interest_rate), data.tenure_months);
  const totalInterest = Math.round(emiResult.totalInterest * 100) / 100;
  const totalPayable = Math.round(emiResult.totalPayable * 100) / 100;

  const loanResult = await client.query(
    `INSERT INTO loans (loan_number, application_id, customer_id, product_id, branch_id, area_id, disbursement_id,
     loan_amount, approved_amount, tenure_months, interest_rate, interest_type, emi_amount, total_interest, total_payable,
     total_charges, disbursement_net_amount, total_disbursed, outstanding_principal, outstanding_total,
     total_emis, status, first_emi_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) RETURNING *`,
    [loanNumber, data.application_id, data.customer_id, data.product_id, data.branch_id, data.area_id || null,
     data.disbursement_id, data.loan_amount, data.approved_amount, data.tenure_months, data.interest_rate,
     'reducing', emiResult.emi, totalInterest, totalPayable, data.total_charges || 0,
     data.net_disbursement_amount, data.loan_amount, data.loan_amount, data.loan_amount, data.tenure_months,
     'active', data.first_emi_date, data.created_by]
  );

  const loan = loanResult.rows[0];
  await generateEmiSchedule(client, loan);

  const lastEmi = await client.query(
    'SELECT due_date FROM emi_schedules WHERE loan_id = $1 ORDER BY emi_number DESC LIMIT 1',
    [loan.id]
  );
  if (lastEmi.rows[0]) {
    await client.query('UPDATE loans SET last_emi_date = $1 WHERE id = $2', [lastEmi.rows[0].due_date, loan.id]);
  }

  return loan;
}

// ============================================================================
// Additional: recordLoanRepayment
// ============================================================================
export async function recordLoanRepayment(loanId, paymentAmount) {
  await query(
    `UPDATE loans SET outstanding_principal = outstanding_principal - $1 WHERE id = $2`,
    [paymentAmount, loanId]
  );
  return { success: true };
}

// ============================================================================
// Additional: updateLoanOutstandingTotals
// ============================================================================
export async function updateLoanOutstandingTotals() {
  await query(
    `UPDATE loans l SET outstanding_principal = (
       SELECT COALESCE(SUM(closing_balance), 0) FROM emi_schedules WHERE loan_id = l.id AND is_paid = false
     ) WHERE l.status = 'active'`
  );
  return { success: true };
}
