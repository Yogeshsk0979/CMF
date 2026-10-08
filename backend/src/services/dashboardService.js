import { query } from '../config/db.js';

export async function getStages() {
  const result = await query('SELECT * FROM stages ORDER BY stage_order');
  return result.rows;
}

export async function getTransitionHistory(appId) {
  const result = await query(
    `SELECT st.*, u.first_name, u.last_name, f_stage.name as from_stage_name, t_stage.name as to_stage_name
     FROM stage_transitions st
     LEFT JOIN users u ON u.id = st.performed_by
     LEFT JOIN stages f_stage ON f_stage.id = st.from_stage_id
     LEFT JOIN stages t_stage ON t_stage.id = st.to_stage_id
     WHERE st.application_id = $1 ORDER BY st.transitioned_at DESC`,
    [appId]
  );
  return result.rows;
}

export async function getDashboardStats(branchId) {
  const branchFilter = branchId ? 'WHERE l.branch_id = $1' : 'WHERE 1=1';
  const appBranchFilter = branchId ? 'WHERE branch_id = $1' : 'WHERE 1=1';
  const overdueBranchFilter = branchId ? 'WHERE loan_id IN (SELECT id FROM loans WHERE branch_id = $1)' : 'WHERE 1=1';
  const params = branchId ? [branchId] : [];

  const loanResult = await query(
    `SELECT
      COUNT(DISTINCT l.id) as total_loans,
      COALESCE(SUM(l.loan_amount),0) as total_disbursed,
      COALESCE(SUM(l.outstanding_principal),0) as total_outstanding,
      COALESCE(SUM(l.principal_paid),0) as total_repaid,
      COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END) as active_loans,
      COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_loans
     FROM loans l ${branchFilter}`,
    params
  );

  const appResult = await query(
    `SELECT COUNT(*) FILTER (WHERE status IN ('submitted','in_review')) as pending,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_today,
            COUNT(*) FILTER (WHERE status = 'disbursed') as disbursed
     FROM applications ${appBranchFilter}`,
    params
  );

  const overdueResult = await query(
    `SELECT COUNT(*) FILTER (WHERE is_overdue = true AND is_paid = false) as overdue_emis,
            COALESCE(SUM(emi_amount) FILTER (WHERE is_overdue = true AND is_paid = false),0) as overdue_amount
     FROM emi_schedules
     ${overdueBranchFilter}`,
    params
  );

  return {
    loans: loanResult.rows[0],
    applications: appResult.rows[0],
    overdue: overdueResult.rows[0]
  };
}

export async function getCollectionStats() {
  const result = await query(
    `SELECT
      COUNT(*) FILTER (WHERE is_paid = false AND due_date < CURRENT_DATE) as overdue_count,
      COALESCE(SUM(emi_amount) FILTER (WHERE is_paid = false AND due_date < CURRENT_DATE),0) as overdue_amount,
      COUNT(*) FILTER (WHERE is_paid = true AND paid_on >= DATE_TRUNC('month', CURRENT_DATE)) as collected_this_month,
      COALESCE(SUM(emi_amount) FILTER (WHERE is_paid = true AND paid_on >= DATE_TRUNC('month', CURRENT_DATE)),0) as collected_amount
     FROM emi_schedules`
  );
  return result.rows[0];
}

export async function getApprovalLimits(roleId) {
  const result = await query(
    'SELECT * FROM approval_limits WHERE role_id = $1 AND is_active = true',
    [roleId]
  );
  return result.rows;
}

export async function getNpaStats() {
  const result = await query(
    `SELECT npa_category, COUNT(*) as count, COALESCE(SUM(overdue_amount),0) as amount
     FROM npa_classifications WHERE is_active = true GROUP BY npa_category`
  );
  return result.rows;
}
