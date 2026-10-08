import { query } from '../config/db.js';

export async function createVerificationTask(data) {
  const result = await query(
    `INSERT INTO verification_tasks (task_number, application_id, loan_id, task_type, assigned_to, assigned_by,
     priority, status, scheduled_date, verification_data, location_coordinates)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [data.task_number, data.application_id, data.loan_id, data.task_type, data.assigned_to,
     data.assigned_by, data.priority || 'medium', data.status || 'assigned',
     data.scheduled_date, JSON.stringify(data.verification_data || {}),
     data.location_coordinates ? JSON.stringify(data.location_coordinates) : null]
  );
  return result.rows[0];
}

export async function getVerificationTasks(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.assigned_to) { where += ` AND t.assigned_to = $${idx++}`; params.push(filters.assigned_to); }
  if (filters.status) { where += ` AND t.status = $${idx++}`; params.push(filters.status); }
  if (filters.task_type) { where += ` AND t.task_type = $${idx++}`; params.push(filters.task_type); }
  if (filters.application_id) { where += ` AND t.application_id = $${idx++}`; params.push(filters.application_id); }

  const result = await query(
    `SELECT t.*, a.application_number, u.email as assigned_email,
            p.first_name, p.last_name
     FROM verification_tasks t
     LEFT JOIN applications a ON a.id = t.application_id
     JOIN users u ON u.id = t.assigned_to
     LEFT JOIN user_profiles p ON p.user_id = t.assigned_to
     ${where} ORDER BY t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit || 50, filters.offset || 0]
  );
  return result.rows;
}

export async function completeVerificationTask(taskId, data, userId) {
  const result = await query(
    `UPDATE verification_tasks SET status = 'completed', completed_at = NOW(), verification_data = $1, verification_notes = $2, completed_by = $3 WHERE id = $4 RETURNING *`,
    [JSON.stringify(data.verification_data || {}), data.verification_notes, userId, taskId]
  );
  return result.rows[0];
}

export async function getBranches() {
  const result = await query('SELECT * FROM branches WHERE is_active = true ORDER BY branch_name');
  return result.rows;
}

export async function getAreas(filters = {}) {
  let where = 'WHERE a.is_active = true';
  const params = [];
  let idx = 1;

  if (filters.branch_id) { where += ` AND a.branch_id = $${idx++}`; params.push(filters.branch_id); }
  if (filters.search) { where += ` AND a.area_name ILIKE $${idx++}`; params.push('%' + filters.search + '%'); }

  const result = await query(
    `SELECT a.*, b.branch_name,
            (SELECT COUNT(*) FROM user_areas ua WHERE ua.area_id = a.id) as member_count
     FROM areas a JOIN branches b ON b.id = a.branch_id
     ${where} ORDER BY a.area_name`,
    params
  );
  return result.rows;
}

export async function getGeneralSettings() {
  const result = await query('SELECT setting_key, setting_value FROM app_settings');
  const settings = {};
  result.rows.forEach(r => {
    settings[r.setting_key] = r.setting_value;
  });
  return settings;
}

export async function updateGeneralSettings(data) {
  for (const [key, value] of Object.entries(data)) {
    await query(
      `INSERT INTO app_settings (setting_key, setting_value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
      [key, String(value)]
    );
  }
  return getGeneralSettings();
}

export async function getSmsTemplates() {
  const result = await query('SELECT * FROM sms_templates ORDER BY name');
  return result.rows;
}

export async function getEmailTemplates() {
  const result = await query('SELECT * FROM email_templates ORDER BY name');
  return result.rows;
}

export async function getApprovalLimitsAll() {
  const result = await query(
    `SELECT al.*, r.role_name as role, lp.product_name
     FROM approval_limits al
     LEFT JOIN roles r ON r.id = al.role_id
     LEFT JOIN loan_products lp ON lp.id = al.product_id
     ORDER BY al.created_at`
  );
  return result.rows;
}

export async function createArea(data) {
  const result = await query(
    `INSERT INTO areas (area_code, area_name, branch_id, pincode, city, state, latitude, longitude, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) RETURNING *`,
    ['ARE' + Date.now().toString().slice(-7), data.area_name, data.branch_id, data.pincode,
     data.city, data.state, data.latitude, data.longitude]
  );
  return result.rows[0];
}

export async function assignAreaLeader(areaId, userId) {
  await query('UPDATE user_areas SET is_primary = false WHERE user_id = $1', [userId]);
  const result = await query(
    `INSERT INTO user_areas (user_id, area_id, is_primary)
     VALUES ($1, $2, true) ON CONFLICT (user_id, area_id) DO UPDATE SET is_primary = true RETURNING *`,
    [userId, areaId]
  );
  return result.rows[0];
}

export async function getAreaMembers(areaId) {
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.role, u.customer_code,
            p.first_name, p.last_name, ua.is_primary
     FROM user_areas ua
     JOIN users u ON u.id = ua.user_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE ua.area_id = $1
     ORDER BY ua.is_primary DESC, u.role, u.email`,
    [areaId]
  );
  return result.rows;
}

export async function getLoanProducts(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.category) { where += ` AND category = $${idx++}`; params.push(filters.category); }
  if (filters.is_active !== undefined) { where += ` AND is_active = $${idx++}`; params.push(filters.is_active); }

  const result = await query(
    `SELECT * FROM loan_products ${where} ORDER BY created_at`,
    params
  );
  return result.rows;
}

export async function createLoanProduct(data) {
  const result = await query(
    `INSERT INTO loan_products (product_code, product_name, category, description, min_loan_amount, max_loan_amount,
     min_tenure_months, max_tenure_months, min_interest_rate, max_interest_rate,
     processing_fee_type, processing_fee_value, document_charge_type, document_charge_value,
     insurance_type, insurance_value, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true) RETURNING *`,
    ['PRD' + Date.now().toString().slice(-7), data.product_name, data.category, data.description,
     data.min_loan_amount, data.max_loan_amount, data.min_tenure_months, data.max_tenure_months,
     data.min_interest_rate, data.max_interest_rate, data.processing_fee_type || 'flat',
     data.processing_fee_value || 0, data.document_charge_type || 'flat', data.document_charge_value || 0,
     data.insurance_type || 'none', data.insurance_value || 0]
  );
  return result.rows[0];
}

export async function getReferrals(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.referrer_id) { where += ` AND referrer_id = $${idx++}`; params.push(filters.referrer_id); }
  if (filters.status) { where += ` AND status = $${idx++}`; params.push(filters.status); }

  const result = await query(
    `SELECT r.*, u.email as referrer_email, u.customer_code as referrer_code
     FROM referrals r JOIN users u ON u.id = r.referrer_id ${where}
     ORDER BY r.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit || 50, filters.offset || 0]
  );
  return result.rows;
}

export async function getTrustScore(customerId) {
  const result = await query(
    `SELECT * FROM trust_scores WHERE customer_id = $1 ORDER BY calculated_at DESC LIMIT 1`,
    [customerId]
  );
  return result.rows[0];
}

export async function updateLoanProduct(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of Object.keys(data)) {
    fields.push(`${key} = $${idx++}`);
    values.push(data[key]);
  }
  if (fields.length === 0) return null;
  values.push(id);
  const result = await query(
    `UPDATE loan_products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteLoanProduct(id) {
  await query('DELETE FROM loan_products WHERE id = $1', [id]);
  return { success: true };
}