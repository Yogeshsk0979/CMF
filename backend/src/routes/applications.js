import express from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../config/db.js';
import { authenticate, authorize, loadPermissions } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { createApplication, getApplications, updateApplication, getApplication, getApplicationTopics, updateTopic, addApplicationNote, getApplicationNotes, approveApplication } from '../services/applicationService.js';

const router = express.Router();

router.get('/',
  authenticate,
  loadPermissions,
  asyncHandler(async (req, res) => {
    const filters = {
      customer_id: req.query.customer_id,
      status: req.query.status,
      product_id: req.query.product_id,
      branch_id: req.query.branch_id,
      area_id: req.query.area_id,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const result = await getApplications(filters);
    res.json(result);
  })
);

router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const app = await getApplication(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  })
);

router.post('/',
  authenticate, authorize('field_officer', 'team_leader', 'branch_admin', 'super_admin', 'customer'),
  asyncHandler(async (req, res) => {
    const app = await createApplication({ ...req.body, created_by: req.user.id });
    res.status(201).json(app);
  })
);

router.put('/:id',
  authenticate, authorize('field_officer', 'team_leader', 'branch_admin', 'super_admin', 'customer'),
  asyncHandler(async (req, res) => {
    const app = await updateApplication(req.params.id, req.body);
    res.json(app);
  })
);

router.patch('/:id/submit',
  authenticate, authorize('field_officer', 'team_leader', 'branch_admin', 'super_admin', 'customer'),
  asyncHandler(async (req, res) => {
    const app = await updateApplication(req.params.id, { status: 'submitted' });
    res.json(app);
  })
);

router.get('/:id/topics',
  authenticate,
  asyncHandler(async (req, res) => {
    const topics = await getApplicationTopics(req.params.id);
    res.json(topics);
  })
);

router.put('/:id/topics/:topicCode',
  authenticate,
  asyncHandler(async (req, res) => {
    const { topicCode } = req.params;
    const topicData = req.body?.data || {};

    if (topicCode === 'applicant_details' || topicCode === 'basic_details') {
      if (topicCode === 'applicant_details') {
        if (topicData.first_name !== undefined && !topicData.first_name?.trim()) {
          return res.status(400).json({ error: 'First Name is mandatory' });
        }
        if (topicData.last_name !== undefined && !topicData.last_name?.trim()) {
          return res.status(400).json({ error: 'Last Name is mandatory' });
        }
        if (topicData.email !== undefined && !topicData.email?.trim()) {
          return res.status(400).json({ error: 'Email is mandatory' });
        }
        if (topicData.phone !== undefined && !topicData.phone?.trim()) {
          return res.status(400).json({ error: 'Mobile Number is mandatory' });
        }
      }

      if (topicData.dob) {
        const dob = new Date(topicData.dob);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ error: 'Invalid Date of Birth' });
        }
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18) {
          return res.status(400).json({ error: 'Applicant must be at least 18 years old' });
        }
      }

      if (topicData.gender === 'female' && topicData.marital_status === 'married') {
        const husbandName = topicData.husband_name || topicData.spouse_name;
        const husbandPhone = topicData.husband_phone || topicData.husband_mobile;
        if (!husbandName || !husbandName.trim()) {
          return res.status(400).json({ error: "Husband's name is mandatory for married female applicants" });
        }
        if (!husbandPhone || !husbandPhone.trim()) {
          return res.status(400).json({ error: "Husband's mobile number is mandatory for married female applicants" });
        }
      }
    }
    await updateTopic(req.params.id, req.params.topicCode, req.body);
    res.json({ success: true });
  })
);

router.get('/:id/notes',
  authenticate,
  asyncHandler(async (req, res) => {
    const notes = await getApplicationNotes(req.params.id);
    res.json(notes);
  })
);

router.post('/:id/notes',
  authenticate,
  asyncHandler(async (req, res) => {
    const note = await addApplicationNote(req.params.id, req.body, req.user.id);
    res.status(201).json(note);
  })
);

router.post('/:id/approve',
  authenticate, authorize('team_leader', 'branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { action, remarks, limitAmount } = req.body;
    await approveApplication(req.params.id, action, req.user.id, remarks, limitAmount);
    res.json({ success: true });
  })
);

router.post('/:id/raise-query',
  authenticate, authorize('branch_admin', 'super_admin', 'team_leader'),
  asyncHandler(async (req, res) => {
    const { category_name, query_text } = req.body;
    if (!query_text || !query_text.trim()) {
      return res.status(400).json({ error: 'Query text is required' });
    }
    const noteContent = category_name ? `[Category: ${category_name}] ${query_text}` : query_text;
    await addApplicationNote(req.params.id, {
      note_type: 'query',
      note_text: noteContent,
      is_internal: false
    }, req.user.id);
    const app = await updateApplication(req.params.id, { status: 'query_raised', notes: noteContent });
    res.json({ success: true, application: app });
  })
);

router.post('/:id/assign-fv',
  authenticate, authorize('team_leader', 'branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { officer_id } = req.body;

    if (!officer_id) {
      return res.status(400).json({ error: 'Field Officer ID is required' });
    }

    const officerRes = await query(
      `SELECT u.id, u.email, u.phone, u.role, p.first_name, p.last_name
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [officer_id]
    );

    if (officerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Selected Field Officer not found' });
    }

    const officer = officerRes.rows[0];
    const officerName = `${officer.first_name || ''} ${officer.last_name || ''}`.trim() || officer.email;

    const existingTopics = await getApplicationTopics(id);
    const existingFvTopic = existingTopics.find(t => t.topic_code === 'field_visit')?.topic_data || {};

    const updatedFvData = {
      ...existingFvTopic,
      assigned_officer_id: officer.id,
      assigned_officer_name: officerName,
      assigned_officer_email: officer.email,
      assigned_officer_phone: officer.phone,
      assigned_officer_role: officer.role,
      assigned_at: new Date().toISOString(),
      assigned_by: req.user.id
    };

    await updateTopic(id, 'field_visit', { data: updatedFvData, is_completed: !!existingFvTopic.visit_photo_url });

    try {
      await query(
        `INSERT INTO verification_tasks (application_id, task_type, assigned_to, assigned_by, priority, status)
         VALUES ($1, 'field_verification', $2, $3, 'high', 'assigned')`,
        [id, officer.id, req.user.id]
      );
    } catch (e) {
      console.log('Verification task note:', e.message);
    }

    const app = await getApplication(id);
    res.json({ success: true, application: app, field_visit: updatedFvData });
  })
);

router.post('/:id/field-visit',
  authenticate, authorize('field_officer', 'collection_agent', 'team_leader', 'branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, location_address, visit_photo_url, checklist, remarks } = req.body;

    const existingTopics = await getApplicationTopics(id);
    const existingFvTopic = existingTopics.find(t => t.topic_code === 'field_visit')?.topic_data || {};

    const visitData = {
      ...existingFvTopic,
      latitude: latitude || null,
      longitude: longitude || null,
      location_address: location_address || (latitude ? `${latitude}, ${longitude}` : 'Location Captured'),
      visit_photo_url: visit_photo_url || null,
      checklist: checklist || {},
      remarks: remarks || '',
      verified_by: req.user.id,
      verified_at: new Date().toISOString()
    };

    await updateTopic(id, 'field_visit', { data: visitData, is_completed: true, completion_pct: 100 });
    const app = await updateApplication(id, { status: 'field_visit_completed' });

    res.json({ success: true, application: app, field_visit: visitData });
  })
);

router.post('/clean-photos',
  authenticate, authorize('super_admin', 'branch_admin'),
  asyncHandler(async (req, res) => {
    // 1. Delete application_documents rows
    await query('DELETE FROM application_documents');

    // 2. Clear photo and document keys from application_topics JSONB column
    const photoAndDocKeys = [
      'live_selfie_url', 'photo_url', 'profile_photo', 'visit_photo_url',
      'aadhaar_doc', 'pan_doc', 'voter_doc', 'other_doc', 'education_doc',
      'residence_proof', 'address_proof_doc', 'property_documents', 'property_doc',
      'employment_proof_doc', 'income_proof', 'salary_slip_doc',
      'bank_statement_doc', 'bank_statement', 'passbook_doc', 'cheque_doc', 'bank_passbook'
    ];

    const topicsRes = await query('SELECT id, topic_data FROM application_topics');
    let updatedCount = 0;

    for (const row of topicsRes.rows) {
      let data = row.topic_data || {};
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
      }

      let modified = false;
      for (const key of photoAndDocKeys) {
        if (data[key] !== undefined) {
          delete data[key];
          modified = true;
        }
      }

      if (modified) {
        await query('UPDATE application_topics SET topic_data = $1::jsonb WHERE id = $2', [JSON.stringify(data), row.id]);
        updatedCount++;
      }
    }

    // 3. Remove physical files in backend/uploads/documents/
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    let deletedFiles = 0;
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedFiles++;
        }
      }
    }

    res.json({
      success: true,
      message: `Cleared photos and documents from ${updatedCount} application topics and deleted ${deletedFiles} uploaded file(s).`
    });
  })
);

router.delete('/clean-all',
  authenticate, authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const tablesToClean = [
      'npa_classifications', 'trust_scores', 'referrals', 'payment_receipts',
      'emi_payments', 'emi_schedules', 'disbursement_charges', 'disbursements',
      'penalties', 'loans', 'verification_tasks', 'approval_history',
      'stage_transitions', 'application_notes', 'application_documents',
      'application_stages', 'application_topics', 'applications'
    ];

    let totalDeleted = 0;
    for (const table of tablesToClean) {
      const result = await query(`DELETE FROM ${table}`);
      totalDeleted += result.rowCount || 0;
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
    }

    res.json({ success: true, message: `Successfully deleted all application records, loans, and uploaded document files (${totalDeleted} database rows removed).` });
  })
);

export default router;