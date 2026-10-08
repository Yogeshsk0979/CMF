import { query, withTransaction } from '../config/db.js';

export async function logAudit(userId, action, entityType, entityId, entityNumber) {
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_number, ip_address)
     VALUES ($1, $2, $3, $4, $5, 'api')`,
    [userId, action, entityType, entityId, entityNumber]
  );
}

const TOPIC_ORDER = [
  'applicant_details', 'basic_details', 'kyc_details', 'work_details', 'family_details', 'family_references', 'banking_details',
  'ratio_analysis', 'obligations', 'income_details', 'customer_wealth', 'product_details',
  'property_details', 'eligibility', 'documents', 'verification_checks', 'notes', 'query'
];

export async function createApplication(data) {
  const customerId = data.customer_id || data.created_by;
  let branchId = data.branch_id;

  if (!branchId) {
    const defaultBranch = await query('SELECT id FROM branches LIMIT 1');
    branchId = defaultBranch.rows[0]?.id || null;
  }

  const result = await query(
    `INSERT INTO applications (customer_id, product_id, branch_id, area_id, created_by, loan_amount,
     tenure_months, interest_rate, emi_amount, status, cibil_score, eligibility_score, total_household_income)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id, application_number`,
    [customerId, data.product_id || null, branchId || null, data.area_id || null, data.created_by || customerId,
     data.loan_amount || null, data.tenure_months || null, data.interest_rate || null, data.emi_amount || null, data.status || 'draft',
     data.cibil_score || null, data.eligibility_score || null, data.total_household_income || null]
  );
  const app = result.rows[0];
  for (let i = 0; i < TOPIC_ORDER.length; i++) {
    const formattedName = TOPIC_ORDER[i].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    await query(
      'INSERT INTO application_topics (application_id, topic_code, topic_name, topic_order, topic_data, is_completed, completion_pct) VALUES ($1, $2, $3, $4, $5, false, 0)',
      [app.id, TOPIC_ORDER[i], formattedName, i + 1, JSON.stringify({})]
    );
  }
  await logAudit(data.created_by || customerId, 'application.created', 'application', app.id, app.application_number);
  return getApplication(app.id);
}

export async function getApplication(appId) {
  const result = await query(
    `SELECT a.*, u.email, u.phone, u.role, u.customer_code,
     lp.product_name, lp.category, b.branch_name, ar.area_name,
     p.first_name, p.last_name, p.date_of_birth, p.gender, p.marital_status,
     p.aadhaar_verified, p.pan_verified
     FROM applications a
     JOIN users u ON u.id = a.customer_id
     LEFT JOIN user_profiles p ON p.user_id = a.customer_id
     LEFT JOIN loan_products lp ON lp.id = a.product_id
     LEFT JOIN branches b ON b.id = a.branch_id
     LEFT JOIN areas ar ON ar.id = a.area_id
     WHERE a.id = $1`, [appId]);
  return result.rows[0];
}

export async function getApplications(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;
  if (filters.customer_id) { where += ` AND a.customer_id = $${idx++}`; params.push(filters.customer_id); }
  if (filters.status) { where += ` AND a.status = $${idx++}`; params.push(filters.status); }
  if (filters.branch_id) { where += ` AND a.branch_id = $${idx++}`; params.push(filters.branch_id); }
  if (filters.area_id) { where += ` AND a.area_id = $${idx++}`; params.push(filters.area_id); }
  if (filters.search) {
    where += ` AND (u.email ILIKE $${idx} OR p.first_name ILIKE $${idx} OR a.application_number ILIKE $${idx})`;
    params.push('%' + filters.search + '%', '%' + filters.search + '%', '%' + filters.search + '%');
    idx += 3;
  }
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  const result = await query(
    `SELECT a.id, a.application_number, a.status, a.loan_amount, a.tenure_months,
     a.interest_rate, a.emi_amount, a.cibil_score, a.eligibility_score, a.created_at,
     u.email, u.phone, u.customer_code,
     p.first_name, p.last_name, lp.product_name, b.branch_name
     FROM applications a
     JOIN users u ON u.id = a.customer_id
     LEFT JOIN user_profiles p ON p.user_id = a.customer_id
     JOIN loan_products lp ON lp.id = a.product_id
     JOIN branches b ON b.id = a.branch_id
     ${where} ORDER BY a.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]);
  const countResult = await query(`SELECT COUNT(*) FROM applications a JOIN users u ON u.id = a.customer_id ${where}`, params);
  return { applications: result.rows, total: parseInt(countResult.rows[0].count) };
}

export async function updateApplication(appId, data) {
  const fields = [];
  const values = [];
  let idx = 1;
  const updatable = ['loan_amount', 'tenure_months', 'interest_rate', 'emi_amount', 'status',
    'cibil_score', 'eligibility_score', 'total_household_income', 'product_id', 'notes'];
  for (const key of updatable) {
    if (data[key] !== undefined) { fields.push(key + ' = $' + (idx++)); values.push(data[key]); }
  }
  if (fields.length === 0) return getApplication(appId);
  values.push(appId);
  await query('UPDATE applications SET ' + fields.join(', ') + ' WHERE id = $' + idx, values);
  return getApplication(appId);
}

export async function updateTopic(appId, topicCode, data) {
  const formattedName = topicCode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const topicOrderMap = {
    'applicant_details': 1, 'basic_details': 2, 'kyc_details': 3, 'work_details': 4,
    'family_details': 5, 'family_references': 5, 'banking_details': 6, 'ratio_analysis': 7,
    'obligations': 8, 'income_details': 9, 'customer_wealth': 10, 'product_details': 11,
    'property_details': 12, 'eligibility': 13, 'documents': 14, 'verification_checks': 15,
    'notes': 16, 'query': 17
  };
  const order = topicOrderMap[topicCode] || 99;

  await query(
    `INSERT INTO application_topics (application_id, topic_code, topic_name, topic_order, topic_data, is_completed, completion_pct, completed_at, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NOW(), NOW())
     ON CONFLICT (application_id, topic_code)
     DO UPDATE SET topic_data = EXCLUDED.topic_data, is_completed = EXCLUDED.is_completed, completion_pct = EXCLUDED.completion_pct, completed_at = NOW(), updated_at = NOW()`,
    [appId, topicCode, formattedName, order, JSON.stringify(data.data || {}), data.is_completed !== false, data.completion_pct || 100]
  );
  return { success: true };
}

export async function getApplicationTopics(appId) {
  const result = await query(`SELECT * FROM application_topics WHERE application_id = $1 ORDER BY topic_order`, [appId]);
  return result.rows.map(row => ({
    ...row,
    topic_data: typeof row.topic_data === 'string' ? JSON.parse(row.topic_data) : (row.topic_data || {})
  }));
}

export async function addApplicationNote(appId, data, userId) {
  await query(
    `INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [appId, data.note_type || 'general', data.note_text, data.is_internal || false, data.is_resolved || false, userId]
  );
  return { success: true };
}

export async function getApplicationNotes(appId) {
  const result = await query(
    `SELECT n.*, u.first_name, u.last_name
     FROM application_notes n
     LEFT JOIN user_profiles u ON u.user_id = n.added_by
     WHERE n.application_id = $1 ORDER BY n.created_at DESC`,
    [appId]);
  return result.rows;
}

export async function approveApplication(appId, action, approverId, remarks, limitAmount) {
  return query(
    `INSERT INTO approval_history (application_id, level, approver_id, role_at_time, limit_amount, action, remarks)
     VALUES ($1, 1, $2, 'team_leader', $3, $4, $5)`,
    [appId, approverId, limitAmount, action, remarks]
  ).then(() => ({ success: true }));
}

// Stage transitions
export async function transitionStage(appId, toStageCode, userId, data) {
  return withTransaction(async (client) => {
    const currentResult = await client.query(
      `SELECT * FROM application_stages WHERE application_id = $1 AND status = 'in_progress' ORDER BY created_at LIMIT 1`,
      [appId]);
    if (currentResult.rows[0]) {
      await client.query(`UPDATE application_stages SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [currentResult.rows[0].id]);
    }
    const stageResult = await client.query(`SELECT * FROM stages WHERE code = $1`, [toStageCode]);
    const targetStage = stageResult.rows[0];
    if (!targetStage) throw new Error(`Stage not found: ${toStageCode}`);
    const stageResult2 = await client.query(
      `INSERT INTO application_stages (application_id, stage_id, assigned_to, status)
       VALUES ($1, $2, $3, 'in_progress') RETURNING *`,
      [appId, targetStage.id, userId]);
    await client.query(
      `INSERT INTO stage_transitions (application_id, from_stage, to_stage, transitioned_by, remarks, transition_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [appId, currentResult.rows[0]?.stage_id, targetStage.id, userId, data?.remarks || '', 'normal']);
    return stageResult2.rows[0];
  });
}

export async function submitApplication(appId, userId) {
  return withTransaction(async (client) => {
    const topics = await client.query(
      `SELECT topic_code, topic_data FROM application_topics WHERE application_id = $1`, [appId]);
    const applicantTopic = topics.rows.find(t => t.topic_code === 'applicant_details')?.topic_data || {};
    const basicTopic = topics.rows.find(t => t.topic_code === 'basic_details')?.topic_data || {};

    if (!applicantTopic.first_name || !applicantTopic.first_name.trim()) {
      throw new Error('First Name is mandatory to submit application');
    }
    if (!applicantTopic.last_name || !applicantTopic.last_name.trim()) {
      throw new Error('Last Name is mandatory to submit application');
    }
    if (!applicantTopic.email || !applicantTopic.email.trim()) {
      throw new Error('Email is mandatory to submit application');
    }
    if (!applicantTopic.phone || !applicantTopic.phone.trim()) {
      throw new Error('Mobile Number is mandatory to submit application');
    }
    if (!applicantTopic.dob) {
      throw new Error('Date of Birth is mandatory to submit application');
    }

    if (applicantTopic.dob) {
      const dob = new Date(applicantTopic.dob);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18) {
          throw new Error('Applicant must be at least 18 years old to submit application');
        }
      }
    }

    const gender = applicantTopic.gender || basicTopic.gender;
    const maritalStatus = applicantTopic.marital_status || basicTopic.marital_status;
    const husbandName = applicantTopic.husband_name || basicTopic.husband_name || applicantTopic.spouse_name || basicTopic.spouse_name;
    const husbandPhone = applicantTopic.husband_phone || basicTopic.husband_phone || applicantTopic.husband_mobile || basicTopic.husband_mobile;

    if (gender === 'female' && maritalStatus === 'married') {
      if (!husbandName || !husbandName.trim()) {
        throw new Error("Husband's name is mandatory for married female applicants");
      }
      if (!husbandPhone || !husbandPhone.trim()) {
        throw new Error("Husband's mobile number is mandatory for married female applicants");
      }
    }

    const topicResult = await client.query(
      `SELECT COUNT(*) as total, COUNT(CASE WHEN topic_data::text != '{}' THEN 1 END) as filled
       FROM application_topics WHERE application_id = $1`, [appId]);
    if (parseInt(topicResult.rows[0].filled) < 3) {
      throw new Error('Please fill at least 3 sections before submitting');
    }
    await client.query(`UPDATE applications SET status = 'submitted', submitted_at = NOW() WHERE id = $1`, [appId]);
    await transitionStage(appId, 'submitted', userId, {});
    await logAudit(userId, 'application.submitted', 'application', appId, null);
    return { success: true };
  });
}

export async function approveStage(appId, approverId, remarks, action) {
  return withTransaction(async (client) => {
    const appResult = await client.query(`SELECT a.*, r.role_name FROM applications a JOIN users u ON u.id = a.created_by JOIN roles r ON r.id = u.role WHERE a.id = $1`, [appId]);
    const approverResult = await client.query(`SELECT r.role_name FROM users u JOIN roles r ON r.id = u.role WHERE u.id = $1`, [approverId]);
    const approverRole = approverResult.rows[0]?.role_name || '';
    const approvedAmount = parseFloat(appResult.rows[0]?.loan_amount || 0);

    const limitResult = await client.query(
      `SELECT * FROM approval_limits WHERE role_name = $1 AND $2 BETWEEN min_amount AND max_amount AND is_active = true`,
      [approverRole, approvedAmount]);
    const limit = limitResult.rows[0];
    if (!limit && approverRole !== 'super_admin') throw new Error(`Approval limit exceeded for Rs.${approvedAmount}`);

    const stageResult = await client.query(
      `SELECT s.code FROM application_stages ast JOIN stages s ON s.id = ast.stage_id WHERE ast.application_id = $1 AND ast.status = 'in_progress'`,
      [appId]);
    const currentStage = stageResult.rows[0]?.code;

    let nextStageCode = 'approved';
    const flow = { submitted: 'field_verification', field_verification: 'credit_assessment', credit_assessment: 'final_approval', final_approval: 'approved' };
    if (flow[currentStage]) nextStageCode = flow[currentStage];

    if (action === 'reject') {
      await client.query(`UPDATE applications SET status = 'rejected', rejected_at = NOW() WHERE id = $1`, [appId]);
      await client.query(`INSERT INTO application_notes (application_id, note_type, note_text, is_internal, added_by) VALUES ($1, 'rejection', $2, true, $3)`, [appId, remarks, approverId]);
      await transitionStage(appId, 'rejected', approverId, { remarks });
    } else {
      await client.query(`INSERT INTO approval_history (application_id, level, approver_id, role_at_time, limit_amount, action, remarks) VALUES ($1, $2, $3, $4, $5, 'approved', $6)`, [appId, limit?.level || 1, approverId, approverRole, limit?.limit_amount || approvedAmount, remarks]);
      if (nextStageCode === 'approved') {
        await client.query(`UPDATE applications SET status = 'approved', approved_at = NOW(), approved_by = $1 WHERE id = $2`, [approverId, appId]);
      }
      await transitionStage(appId, nextStageCode, approverId, { remarks, limit });
    }
    await logAudit(approverId, `application.${action || 'approved'}`, 'application', appId, appResult.rows[0]?.application_number);
    return { action: action || 'approved', nextStage: nextStageCode };
  });
}

export async function raiseQuery(appId, data, userId) {
  return withTransaction(async (client) => {
    await client.query(`INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by) VALUES ($1, 'query', $2, true, false, $3)`, [appId, data.query_text, userId]);
    await client.query(`UPDATE applications SET status = 'query_raised' WHERE id = $1`, [appId]);
    await transitionStage(appId, 'query_raised', userId, data);
    await logAudit(userId, 'application.query_raised', 'application', appId, null);
    return { success: true };
  });
}

export async function uploadDocument(appId, data) {
  const result = await query(
    `INSERT INTO application_documents (application_id, document_type, document_name, file_url, file_size, mime_type, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [appId, data.document_type, data.document_name, data.file_url, data.file_size, data.mime_type, data.uploaded_by]
  );
  return result.rows[0];
}

export async function getApplicationDocuments(appId) {
  const result = await query(`SELECT * FROM application_documents WHERE application_id = $1 ORDER BY document_type, created_at`, [appId]);
  return result.rows;
}

export async function deleteDocument(documentId) {
  await query('DELETE FROM application_documents WHERE id = $1', [documentId]);
  return { success: true };
}

export async function getApplicationStageHistory(appId) {
  const result = await query(
    `SELECT st.*, s.stage_name, s.code, s.color, u.first_name, u.last_name
     FROM stage_transitions st
     JOIN stages s ON s.id = st.to_stage
     JOIN users u ON u.id = st.transitioned_by
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE st.application_id = $1 ORDER BY st.transitioned_at ASC`, [appId]);
  return result.rows;
}

export async function getApprovalLimits() {
  const result = await query(`SELECT * FROM approval_limits WHERE is_active = true ORDER BY min_amount`);
  return result.rows;
}

export async function createApprovalLimit(data) {
  const result = await query(
    `INSERT INTO approval_limits (role_name, level, min_amount, max_amount, limit_amount, description, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.role_name, data.level || 1, data.min_amount, data.max_amount, data.limit_amount, data.description || '', data.is_active !== false]);
  return result.rows[0];
}