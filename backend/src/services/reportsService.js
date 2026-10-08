import { query } from '../config/db.js';

export async function getPortfolioReport(filters = {}) {
  const params = [];
  let whereClause = 'WHERE 1=1';
  if (filters.branch_id) {
    whereClause += ` AND l.branch_id = $${params.length + 1}`;
    params.push(filters.branch_id);
  }
  if (filters.product_id) {
    whereClause += ` AND l.product_id = $${params.length + 1}`;
    params.push(filters.product_id);
  }

  const summary = await query(
    `SELECT
       COUNT(*) as total_loans,
       COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_loans,
       COUNT(CASE WHEN l.status = 'foreclosed' THEN 1 END) as foreclosed_loans,
       COUNT(CASE WHEN l.status = 'closed' THEN 1 END) as closed_loans,
       COALESCE(SUM(l.loan_amount), 0) as total_disbursed,
       COALESCE(SUM(l.outstanding_principal), 0) as total_outstanding,
       COALESCE(SUM(l.principal_paid), 0) as total_principal_collected,
       COALESCE(SUM(l.interest_paid), 0) as total_interest_collected,
       COALESCE(SUM(l.penalty_collected), 0) as total_penalty_collected,
       COALESCE(AVG(l.interest_rate), 0) as avg_interest_rate
     FROM loans l ${whereClause}`, params);

  const byProduct = await query(
    `SELECT lp.product_name, lp.category,
       COUNT(l.id) as count, COALESCE(SUM(l.loan_amount), 0) as disbursed,
       COALESCE(SUM(l.outstanding_principal), 0) as outstanding
     FROM loans l
     JOIN loan_products lp ON lp.id = l.product_id
     ${whereClause}
     GROUP BY lp.id, lp.product_name, lp.category
     ORDER BY disbursed DESC`, params);

  const byBranch = await query(
    `SELECT b.branch_name,
       COUNT(l.id) as count, COALESCE(SUM(l.loan_amount), 0) as disbursed,
       COALESCE(SUM(l.outstanding_principal), 0) as outstanding,
       COUNT(CASE WHEN l.overdue_emis > 0 THEN 1 END) as overdue_count
     FROM loans l
     JOIN branches b ON b.id = l.branch_id
     ${whereClause}
     GROUP BY b.id, b.branch_name
     ORDER BY disbursed DESC`, params);

  const npaStats = await query(
    `SELECT npa_category, COUNT(*) as count, COALESCE(SUM(overdue_amount), 0) as overdue_amount,
       COALESCE(SUM(provision_amount), 0) as provision_amount
     FROM npa_classifications WHERE is_active = true GROUP BY npa_category`);

  return {
    summary: summary.rows[0],
    byProduct: byProduct.rows,
    byBranch: byBranch.rows,
    npa: npaStats.rows,
  };
}

export async function getCollectionReport(filters = {}) {
  const dateFrom = filters.date_from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const dateTo = filters.date_to || new Date().toISOString().split('T')[0];

  const params = [dateFrom, dateTo];
  let whereClause = 'WHERE ep.payment_date >= $1 AND ep.payment_date <= $2';
  if (filters.branch_id) {
    whereClause += ` AND l.branch_id = $3`;
    params.push(filters.branch_id);
  }

  const summary = await query(
    `SELECT
       COUNT(ep.id) as payment_count,
       COALESCE(SUM(ep.payment_amount), 0) as total_collected,
       COALESCE(SUM(ep.principal_component), 0) as total_principal,
       COALESCE(SUM(ep.interest_component), 0) as total_interest,
       COALESCE(SUM(ep.penalty_component), 0) as total_penalty,
       COUNT(DISTINCT ep.customer_id) as unique_customers,
       COUNT(DISTINCT ep.loan_id) as unique_loans
     FROM emi_payments ep
     JOIN loans l ON l.id = ep.loan_id
     ${whereClause}`, params);

  const daily = await query(
    `SELECT ep.payment_date,
       COUNT(*) as count, COALESCE(SUM(ep.payment_amount), 0) as collected
     FROM emi_payments ep
     JOIN loans l ON l.id = ep.loan_id
     ${whereClause}
     GROUP BY ep.payment_date ORDER BY ep.payment_date DESC LIMIT 30`, params);

  const overdue = await query(
    `SELECT COUNT(*) as overdue_count,
       COALESCE(SUM(e.emi_amount), 0) as overdue_amount,
       COUNT(CASE WHEN e.days_overdue > 30 THEN 1 END) as overdue_30,
       COUNT(CASE WHEN e.days_overdue > 90 THEN 1 END) as overdue_90
     FROM emi_schedules e JOIN loans l ON l.id = e.loan_id
     WHERE e.is_paid = false AND e.due_date < CURRENT_DATE` + (filters.branch_id ? ' AND l.branch_id = $3' : ''),
     filters.branch_id ? [dateFrom, dateTo, filters.branch_id] : []);

  const totalDue = await query(
    `SELECT COALESCE(SUM(e.emi_amount), 0) as total_due
     FROM emi_schedules e JOIN loans l ON l.id = e.loan_id
     WHERE e.is_paid = false AND e.due_date <= CURRENT_DATE` + (filters.branch_id ? ' AND l.branch_id = $1' : ''),
     filters.branch_id ? [filters.branch_id] : []);

  const totalDueAmount = parseFloat(totalDue.rows[0]?.total_due || 0);
  const collectedAmount = parseFloat(summary.rows[0]?.total_collected || 0);
  const collectionRate = totalDueAmount > 0 ? Math.round((collectedAmount / totalDueAmount) * 100) : 100;

  return {
    summary: summary.rows[0],
    daily: daily.rows,
    overdue: overdue.rows[0],
    collectionRate,
    period: { dateFrom, dateTo },
  };
}

export async function getNpaReport() {
  const classifications = await query(
    `SELECT nc.*, l.loan_number, u.email, u.customer_code,
       p.first_name, p.last_name, p.address, p.phone
     FROM npa_classifications nc
     JOIN loans l ON l.id = nc.loan_id
     JOIN users u ON u.id = nc.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE nc.is_active = true ORDER BY nc.classification_date DESC`);

  const summary = await query(
    `SELECT npa_category,
       COUNT(*) as count,
       COALESCE(SUM(overdue_amount), 0) as total_overdue,
       COALESCE(SUM(provision_amount), 0) as total_provision
     FROM npa_classifications WHERE is_active = true GROUP BY npa_category`);

  return {
    summary: summary.rows,
    classifications: classifications.rows,
  };
}

export async function getBranchReport(branchId, dateFrom, dateTo) {
  const summary = await query(
    `SELECT
       COUNT(DISTINCT l.id) as total_loans,
       COALESCE(SUM(l.loan_amount), 0) as total_disbursed,
       COALESCE(SUM(l.outstanding_principal), 0) as total_outstanding,
       COUNT(DISTINCT a.id) as total_applications,
       COUNT(DISTINCT u.id) as total_customers
     FROM branches b
     LEFT JOIN loans l ON l.branch_id = b.id
     LEFT JOIN applications a ON a.branch_id = b.id
     LEFT JOIN users u ON u.branch_id = b.id AND u.role = 'customer'
     WHERE b.id = $1`, [branchId]);

  const collection = await query(
    `SELECT COALESCE(SUM(ep.payment_amount), 0) as collected,
       COUNT(ep.id) as count
     FROM emi_payments ep
     JOIN loans l ON l.id = ep.loan_id
     WHERE l.branch_id = $1 AND ep.payment_date >= $2 AND ep.payment_date <= $3`,
     [branchId, dateFrom, dateTo]);

  const overdue = await query(
    `SELECT COUNT(*) as count, COALESCE(SUM(e.emi_amount), 0) as amount
     FROM emi_schedules e JOIN loans l ON l.id = e.loan_id
     WHERE l.branch_id = $1 AND e.is_paid = false AND e.due_date < CURRENT_DATE`, [branchId]);

  const staff = await query(
    `SELECT u.id, u.email, r.role_name, p.first_name, p.last_name,
       COUNT(DISTINCT vt.id) as tasks_assigned
     FROM users u
     JOIN roles r ON r.id = u.role
     LEFT JOIN user_profiles p ON p.user_id = u.id
     LEFT JOIN verification_tasks vt ON vt.assigned_to = u.id
     WHERE u.branch_id = $1 AND u.role != 'customer'
     GROUP BY u.id, u.email, r.role_name, p.first_name, p.last_name`, [branchId]);

  return {
    summary: summary.rows[0],
    collection: collection.rows[0],
    overdue: overdue.rows[0],
    staff: staff.rows,
  };
}

export async function getAgentPerformance(agentId, dateFrom, dateTo) {
  const tasks = await query(
    `SELECT task_type, status, COUNT(*) as count
     FROM verification_tasks
     WHERE assigned_to = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY task_type, status`, [agentId, dateFrom, dateTo]);

  const collections = await query(
    `SELECT COUNT(*) as collections,
       COALESCE(SUM(payment_amount), 0) as total_collected
     FROM emi_payments
     WHERE received_by = $1 AND payment_date >= $2 AND payment_date <= $3`,
     [agentId, dateFrom, dateTo]);

  const applications = await query(
    `SELECT COUNT(*) as created_applications
     FROM applications WHERE created_by = $1 AND created_at >= $2 AND created_at <= $3`,
     [agentId, dateFrom, dateTo]);

  return {
    tasks: tasks.rows,
    collections: collections.rows[0],
    applications: applications.rows[0],
  };
}

export async function getLedgerReport(dateFrom, dateTo) {
  const income = await query(
    `SELECT la.account_name, la.account_code, COALESCE(SUM(ll.credit_amount), 0) as amount
     FROM ledger_accounts la
     LEFT JOIN ledger_entry_lines ll ON ll.account_id = la.id
     LEFT JOIN ledger_entries le ON le.id = ll.ledger_entry_id
     WHERE la.account_group = 'income'
     AND (le.entry_date IS NULL OR (le.entry_date >= $1 AND le.entry_date <= $2))
     GROUP BY la.id, la.account_name, la.account_code
     ORDER BY amount DESC`, [dateFrom, dateTo]);

  const expenses = await query(
    `SELECT la.account_name, la.account_code, COALESCE(SUM(ll.debit_amount), 0) as amount
     FROM ledger_accounts la
     LEFT JOIN ledger_entry_lines ll ON ll.account_id = la.id
     LEFT JOIN ledger_entries le ON le.id = ll.ledger_entry_id
     WHERE la.account_group = 'expenses'
     AND (le.entry_date IS NULL OR (le.entry_date >= $1 AND le.entry_date <= $2))
     GROUP BY la.id, la.account_name, la.account_code
     ORDER BY amount DESC`, [dateFrom, dateTo]);

  const totalIncome = income.rows.reduce((s, r) => s + parseFloat(r.amount), 0);
  const totalExpenses = expenses.rows.reduce((s, r) => s + parseFloat(r.amount), 0);

  return {
    income: income.rows,
    expenses: expenses.rows,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    period: { dateFrom, dateTo },
  };
}

export async function getDashboardStats(branchId = null) {
  const params = branchId ? [branchId] : [];
  const branchFilter = branchId ? 'WHERE branch_id = $1' : '';

  const stats = await query(
    `SELECT
       (SELECT COUNT(*) FROM applications ${branchFilter.replace('branch_id', 'a.branch_id')} ${branchId ? 'a WHERE a.branch_id = $1' : ''}) as total_applications,
       (SELECT COUNT(*) FROM applications WHERE status = 'submitted' ${branchId ? 'AND branch_id = $1' : ''}) as pending_applications,
       (SELECT COUNT(*) FROM applications WHERE status = 'approved' ${branchId ? 'AND branch_id = $1' : ''}) as approved_applications,
       (SELECT COUNT(*) FROM loans WHERE status = 'active' ${branchId ? 'AND branch_id = $1' : ''}) as active_loans,
       (SELECT COALESCE(SUM(loan_amount), 0) FROM loans WHERE status = 'active' ${branchId ? 'AND branch_id = $1' : ''}) as total_disbursed,
       (SELECT COALESCE(SUM(outstanding_principal), 0) FROM loans WHERE status = 'active' ${branchId ? 'AND branch_id = $1' : ''}) as total_outstanding,
       (SELECT COUNT(*) FROM emi_schedules WHERE is_paid = false AND due_date < CURRENT_DATE) as overdue_emis,
       (SELECT COALESCE(SUM(emi_amount), 0) FROM emi_schedules WHERE is_paid = false AND due_date < CURRENT_DATE) as overdue_amount,
       (SELECT COUNT(*) FROM users WHERE role = 'customer' AND is_active = true ${branchId ? 'AND branch_id = $1' : ''}) as total_customers`,
    params);

  return stats.rows[0];
}