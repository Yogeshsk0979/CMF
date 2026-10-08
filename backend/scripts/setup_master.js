const { Client } = require('pg');

// Pre-computed bcrypt hash for "password123"
const PASSWORD_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const DB_CONFIG = {
  host: 'db.kwkdpkewxldxcekeaaoh.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Continnum@2026'
};

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected\n');

  // Clean up any existing data
  console.log('Cleaning existing data...');
  // Use TRUNCATE CASCADE to handle FK constraints
  const cleanupTables = ['audit_logs', 'stage_transitions', 'application_notes', 'application_stages',
    'application_topics', 'application_documents', 'approval_history', 'approval_limits',
    'verification_tasks', 'verifications', 'trust_scores', 'referrals',
    'sms_logs', 'email_logs',
    'disbursement_charges', 'disbursements', 'penalties',
    'payment_receipts', 'emi_payments', 'emi_schedules', 'loans', 'applications',
    'bank_statement_entries', 'bank_reconciliations', 'bank_accounts',
    'ledger_entry_lines', 'ledger_entries', 'ledger_accounts', 'ledger_account_balances',
    'user_permission_overrides', 'role_permissions', 'user_areas', 'permissions', 'roles',
    'password_reset_tokens', 'jwt_refresh_tokens', 'login_audit', 'user_profiles', 'users',
    'npa_classifications', 'product_slabs', 'loan_products', 'areas', 'branches'];
  for (const t of cleanupTables) {
    try {
      await client.query('TRUNCATE TABLE ' + t + ' CASCADE');
    } catch (e) {
      console.log('  Cleanup warn: ' + t + ' - ' + e.message.substring(0, 80));
    }
  }
  // Reset counters
  try {
    await client.query('UPDATE id_counters SET current_value = 0');
  } catch (e) {}
  console.log('  Done\n');

  // Step 1: Branches
  console.log('1. Branches...');
  const branches = {};
  const bR = await client.query(
    `INSERT INTO branches (branch_code, branch_name, branch_type, city, state, pincode, is_active) VALUES
     ('BRN1000001', 'Head Office', 'head_office', 'Chennai', 'Tamil Nadu', '600001', true),
     ('BRN1000002', 'Chennai Main Branch', 'branch', 'Chennai', 'Tamil Nadu', '600002', true),
     ('BRN1000003', 'Tambaram Branch', 'branch', 'Chennai', 'Tamil Nadu', '600043', true)
     RETURNING id, branch_code`
  );
  bR.rows.forEach(r => branches[r.branch_code] = r.id);

  // Step 2: Areas
  console.log('2. Areas...');
  const areas = {};
  const aR = await client.query(
    `INSERT INTO areas (area_code, area_name, branch_id, pincode, city, is_active) VALUES
     ('ARE1000001', 'Anna Nagar', $1, '600040', 'Chennai', true),
     ('ARE1000002', 'T Nagar', $1, '600017', 'Chennai', true),
     ('ARE1000003', 'Tambaram East', $2, '600059', 'Chennai', true),
     ('ARE1000004', 'Tambaram West', $2, '600045', 'Chennai', true),
     ('ARE1000005', 'Adyar', $1, '600020', 'Chennai', true)
     RETURNING id, area_code`,
    [branches['BRN1000002'], branches['BRN1000003']]
  );
  aR.rows.forEach(r => areas[r.area_code] = r.id);

  // Step 3: Products
  console.log('3. Products...');
  const products = {};
  const pR = await client.query(
    `INSERT INTO loan_products (product_code, product_name, category, min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months, min_interest_rate, max_interest_rate, processing_fee_type, processing_fee_value, document_charge_type, document_charge_value, insurance_type, insurance_value, is_active) VALUES
     ('PRD1000001', 'Personal Loan', 'personal', 10000, 200000, 6, 36, 14, 18, 'percentage', 1.0, 'flat', 500, 'percentage', 0.5, true),
     ('PRD1000002', 'Business Loan', 'business', 25000, 500000, 12, 60, 13, 16, 'percentage', 1.5, 'flat', 1000, 'percentage', 0.75, true),
     ('PRD1000003', 'Emergency Loan', 'emergency', 5000, 50000, 3, 12, 16, 20, 'flat', 500, 'flat', 200, 'none', 0, true)
     RETURNING id, product_code`
  );
  pR.rows.forEach(r => products[r.product_code] = r.id);

  // Slabs
  await client.query(
    `INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, is_active) VALUES
     ($1, 'SLB1000001', 'Tier 1 - Small', 1, 10000, 30000, 18, true),
     ($1, 'SLB1000002', 'Tier 2 - Medium', 2, 30001, 70000, 15, true),
     ($1, 'SLB1000003', 'Tier 3 - Large', 3, 70001, 200000, 14, true),
     ($2, 'SLB1000004', 'Tier 1 - Small', 1, 25000, 75000, 16, true),
     ($2, 'SLB1000005', 'Tier 2 - Medium', 2, 75001, 175000, 14, true),
     ($2, 'SLB1000006', 'Tier 3 - Large', 3, 175001, 500000, 13, true),
     ($3, 'SLB1000007', 'Tier 1', 1, 5000, 15000, 20, true),
     ($3, 'SLB1000008', 'Tier 2', 2, 15001, 50000, 16, true)`,
    [products['PRD1000001'], products['PRD1000002'], products['PRD1000003']]
  );

  // Step 4: Bank accounts
  console.log('4. Bank accounts...');
  const banks = {};
  const bkR = await client.query(
    `INSERT INTO bank_accounts (account_code, bank_name, account_number, account_name, account_type, ifsc_code, opening_balance, current_balance, is_primary, is_active) VALUES
     ('BNK1000001', 'State Bank of India', '1234567890', 'CMF Main Account', 'current', 'SBIN0001234', 2500000, 2500000, true, true),
     ('BNK1000002', 'HDFC Bank', '9876543210', 'CMF Disbursement Account', 'savings', 'HDFC0002345', 1800000, 1800000, false, true)
     RETURNING id, account_code`
  );
  bkR.rows.forEach(r => banks[r.account_code] = r.id);

  // Step 5: Users
  console.log('5. Users...');
  const users = {};
  const userData = [
    { username: 'admin', email: 'admin@continummicrofinance.in', phone: '9876543210', role: 'super_admin', fname: 'Admin', lname: 'User' },
    { username: 'branch.chennai', email: 'branch@continummicrofinance.in', phone: '9876543211', role: 'branch_admin', fname: 'Branch', lname: 'Admin' },
    { username: 'tl.anna', email: 'tl.anna@continummicrofinance.in', phone: '9876543212', role: 'team_leader', fname: 'Raman', lname: 'Kumar' },
    { username: 'tl.velachery', email: 'tl.velachery@continummicrofinance.in', phone: '9876543213', role: 'team_leader', fname: 'Priya', lname: 'Devi' },
    { username: 'fo.arun', email: 'fo.arun@continummicrofinance.in', phone: '9876543214', role: 'field_officer', fname: 'Arun', lname: 'Kumar' },
    { username: 'fo.meena', email: 'fo.meena@continummicrofinance.in', phone: '9876543215', role: 'field_officer', fname: 'Meena', lname: 'R' },
    { username: 'fo.ravi', email: 'fo.ravi@continummicrofinance.in', phone: '9876543216', role: 'field_officer', fname: 'Ravi', lname: 'Shankar' },
    { username: 'ca.selva', email: 'ca.selva@continummicrofinance.in', phone: '9876543217', role: 'collection_agent', fname: 'Selvam', lname: 'M' },
    { username: 'ca.kumar', email: 'ca.kumar@continummicrofinance.in', phone: '9876543218', role: 'collection_agent', fname: 'Kumar', lname: 'R' },
    { username: 'ca.devi', email: 'ca.devi@continummicrofinance.in', phone: '9876543219', role: 'collection_agent', fname: 'Devi', lname: 'K' },
    { username: 'cust.raman', email: 'raman.k@gmail.com', phone: '9876500001', role: 'customer', fname: 'Raman', lname: 'Kumar' },
    { username: 'cust.lakshmi', email: 'lakshmi.s@gmail.com', phone: '9876500002', role: 'customer', fname: 'Lakshmi', lname: 'S' },
    { username: 'cust.murugan', email: 'murugan.t@gmail.com', phone: '9876500003', role: 'customer', fname: 'Murugan', lname: 'T' },
    { username: 'cust.kala', email: 'kala.r@gmail.com', phone: '9876500004', role: 'customer', fname: 'Kala', lname: 'R' },
    { username: 'cust.senthil', email: 'senthil.m@gmail.com', phone: '9876500005', role: 'customer', fname: 'Senthil', lname: 'M' },
    { username: 'lender.rao', email: 'lender.rao@example.com', phone: '9876543220', role: 'lender', fname: 'Rao', lname: 'Investments' },
    { username: 'lender.shetty', email: 'lender.shetty@example.com', phone: '9876543221', role: 'lender', fname: 'Shetty', lname: 'Capital' },
  ];

  for (const u of userData) {
    const r = await client.query(
      'INSERT INTO users (username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified) VALUES ($1, $2, $3, $4, $5, true, true, true, true) RETURNING id',
      [u.username, u.email, u.phone, PASSWORD_HASH, u.role]
    );
    const uid = r.rows[0].id;
    users[u.username] = { id: uid, ...u };

    const dob = new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    await client.query(
      'INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, date_of_birth, gender, marital_status, aadhaar_verified, pan_verified, profile_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, true)',
      [uid, u.fname, '', u.lname, dob.toISOString().split('T')[0], 'male', 'married']
    );
  }

  // Step 6: User-area
  console.log('6. User-area assignments...');
  const uaData = [
    ['tl.anna', 'ARE1000001'], ['tl.velachery', 'ARE1000002'], ['fo.arun', 'ARE1000001'],
    ['fo.meena', 'ARE1000002'], ['fo.ravi', 'ARE1000003'], ['ca.selva', 'ARE1000001'],
    ['ca.kumar', 'ARE1000002'], ['ca.devi', 'ARE1000003'],
    ['cust.raman', 'ARE1000001'], ['cust.lakshmi', 'ARE1000001'], ['cust.murugan', 'ARE1000002'],
    ['cust.kala', 'ARE1000003'], ['cust.senthil', 'ARE1000004'],
  ];
  for (const [uname, areaCode] of uaData) {
    await client.query('INSERT INTO user_areas (user_id, area_id, is_primary) VALUES ($1, $2, true)',
      [users[uname].id, areas[areaCode]]);
  }

  // Step 5.5: Roles & permissions (re-seed after cleanup)
  console.log('5b. Roles & permissions...');
  const roleR = await client.query(
    `INSERT INTO roles (name, display_name, description, is_system_role) VALUES
     ('super_admin', 'Super Admin', 'Full system access', true),
     ('branch_admin', 'Branch Admin', 'Branch-level management', true),
     ('team_leader', 'Team Leader', 'Area & team management', true),
     ('field_officer', 'Field Officer', 'Application creation & field verification', true),
     ('collection_agent', 'Collection Agent', 'EMI collection', true),
     ('customer', 'Customer', 'End user / borrower', true),
     ('lender', 'Lender', 'Investor / funder', true)
     RETURNING id, name`
  );
  const roles2 = {};
  roleR.rows.forEach(r => roles2[r.name] = r.id);

  // Re-seed all permissions
  await client.query(
    `INSERT INTO permissions (name, display_name, module, description) VALUES
     ('dashboard.view', 'View Dashboard', 'dashboard', 'Dashboard access'),
     ('branches.view', 'View Branches', 'branches', 'View branches'),
     ('branches.create', 'Create Branch', 'branches', 'Create branches'),
     ('branches.edit', 'Edit Branch', 'branches', 'Edit branches'),
     ('areas.view', 'View Areas', 'areas', 'View areas'),
     ('areas.create', 'Create Area', 'areas', 'Create areas'),
     ('areas.edit', 'Edit Area', 'areas', 'Edit areas'),
     ('areas.assign', 'Assign Leaders', 'areas', 'Assign area leaders'),
     ('users.view', 'View Users', 'users', 'View users'),
     ('users.create', 'Create User', 'users', 'Create users'),
     ('users.edit', 'Edit User', 'users', 'Edit users'),
     ('products.view', 'View Products', 'products', 'View products'),
     ('products.create', 'Create Product', 'products', 'Create products'),
     ('products.edit', 'Edit Product', 'products', 'Edit products'),
     ('applications.view', 'View Applications', 'applications', 'View applications'),
     ('applications.create', 'Create Application', 'applications', 'Create applications'),
     ('applications.review', 'Review Application', 'applications', 'Review applications'),
     ('applications.approve', 'Approve Application', 'applications', 'Approve applications'),
     ('applications.reject', 'Reject Application', 'applications', 'Reject applications'),
     ('disbursements.view', 'View Disbursements', 'disbursements', 'View disbursements'),
     ('disbursements.create', 'Create Disbursement', 'disbursements', 'Create disbursements'),
     ('emi.view', 'View EMI', 'emi', 'View EMI'),
     ('emi.collect', 'Collect EMI', 'emi', 'Collect EMI'),
     ('ledger.view', 'View Ledger', 'ledger', 'View ledger'),
     ('ledger.create', 'Create Entry', 'ledger', 'Create entries'),
     ('banks.view', 'View Bank Accounts', 'banks', 'View bank accounts'),
     ('tasks.view', 'View Tasks', 'tasks', 'View tasks'),
     ('tasks.assign', 'Assign Tasks', 'tasks', 'Assign tasks'),
     ('sms.view', 'View SMS', 'sms', 'View SMS'),
     ('sms.send', 'Send SMS', 'sms', 'Send SMS'),
     ('email.view', 'View Emails', 'email', 'View emails'),
     ('email.send', 'Send Email', 'email', 'Send emails'),
     ('reports.dashboard', 'Dashboard Reports', 'reports', 'Dashboard reports'),
     ('reports.emi', 'EMI Reports', 'reports', 'EMI reports'),
     ('reports.collection', 'Collection Reports', 'reports', 'Collection reports'),
     ('reports.loan', 'Loan Reports', 'reports', 'Loan reports'),
     ('reports.ledger', 'Ledger Reports', 'reports', 'Ledger reports'),
     ('settings.view', 'View Settings', 'settings', 'Settings')`
  );

  // Role-permission mapping (all roles get all permissions for now)
  const allPerms = await client.query('SELECT id FROM permissions');
  for (const role of roleR.rows) {
    for (const perm of allPerms.rows) {
      await client.query('INSERT INTO role_permissions (role_id, permission_id, is_granted) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
        [role.id, perm.id]);
    }
  }

  // Re-seed stages
  const stageR = await client.query(
    `INSERT INTO stages (code, name, description, stage_order, required_roles, sla_hours, is_mandatory) VALUES
     ('new_application', 'New Application', 'Application submitted', 1, ARRAY['field_officer'], 0, true),
     ('document_verification', 'Document Verification', 'Verify documents', 2, ARRAY['field_officer', 'team_leader'], 24, true),
     ('field_verification', 'Field Verification', 'Physical verification', 3, ARRAY['field_officer'], 48, true),
     ('credit_assessment', 'Credit Assessment', 'Evaluate creditworthiness', 4, ARRAY['team_leader', 'branch_admin'], 48, true),
     ('committee_review', 'Committee Review', 'Review committee', 5, ARRAY['branch_admin', 'super_admin'], 72, true),
     ('approval', 'Approval', 'Final approval', 6, ARRAY['branch_admin', 'super_admin'], 48, true),
     ('disbursement', 'Disbursement', 'Process disbursement', 7, ARRAY['branch_admin'], 24, true)
     RETURNING id, code`
  );
  const stageMap = {};
  stageR.rows.forEach(r => stageMap[r.code] = r.id);
  console.log('7. Approval limits...');
  await client.query(
    `INSERT INTO approval_limits (role_id, max_amount, min_amount, is_active) VALUES
     ($1, 50000, 0, true), ($2, 200000, 50001, true), ($3, 1000000, 200001, true)`,
    [roles2['team_leader'], roles2['branch_admin'], roles2['super_admin']]
  );

  // Step 8: Applications
  console.log('8. Applications...');
  const applications = [];
  const appDefs = [
    { customer: 'cust.raman', prod: 'PRD1000001', amount: 25000, tenure: 12, rate: 14, emi: 2380, status: 'submitted', cibil: 650, elig: 85, income: 35000 },
    { customer: 'cust.lakshmi', prod: 'PRD1000001', amount: 50000, tenure: 24, rate: 15, emi: 2435, status: 'in_review', cibil: 720, elig: 92, income: 45000 },
    { customer: 'cust.murugan', prod: 'PRD1000002', amount: 75000, tenure: 36, rate: 13, emi: 2350, status: 'approved', cibil: 580, elig: 78, income: 28000 },
    { customer: 'cust.kala', prod: 'PRD1000002', amount: 100000, tenure: 12, rate: 16, emi: 8742, status: 'query_raised', cibil: 750, elig: 90, income: 50000 },
    { customer: 'cust.senthil', prod: 'PRD1000003', amount: 50000, tenure: 18, rate: 14, emi: 3162, status: 'disbursed', cibil: 680, elig: 88, income: 40000 },
  ];
  for (let i = 0; i < appDefs.length; i++) {
    const d = appDefs[i];
    const r = await client.query(
      `INSERT INTO applications (customer_id, product_id, branch_id, area_id, created_by, loan_amount, tenure_months, interest_rate, emi_amount, status, cibil_score, eligibility_score, total_household_income)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id, application_number`,
      [users[d.customer].id, products[d.prod], branches['BRN1000002'], areas['ARE1000001'], users['fo.arun'].id,
       d.amount, d.tenure, d.rate, d.emi, d.status, d.cibil, d.elig, d.income]
    );
    const app = { id: r.rows[0].id, application_number: r.rows[0].application_number, customer: users[d.customer] };
    applications.push(app);

    const topics = ['applicant_details', 'basic_details', 'kyc_details', 'work_details', 'banking_details',
      'ratio_analysis', 'obligations', 'income_details', 'customer_wealth', 'product_details',
      'property_details', 'eligibility', 'documents', 'verification_checks', 'notes', 'query'];
    const topicNames = ['Applicant Details', 'Basic Details', 'KYC Details', 'Work Details', 'Banking Details',
      'Ratio Analysis', 'Obligations', 'Income Details', 'Customer Wealth', 'Product Details',
      'Property Details', 'Eligibility Calculation', 'Documents', 'Verification Checks', 'Notes', 'Query'];
    for (let t = 0; t < topics.length; t++) {
      await client.query(
        'INSERT INTO application_topics (application_id, topic_code, topic_name, topic_order, topic_data, is_completed, completion_pct) VALUES ($1, $2, $3, $4, $5, true, 100)',
        [app.id, topics[t], topicNames[t], t + 1, JSON.stringify({ completed: true })]
      );
    }
    await client.query(
      'INSERT INTO application_stages (application_id, stage_id, assigned_to, status, notes) VALUES ($1, $2, $3, $4, $5)',
      [app.id, stageMap['field_verification'], users['fo.arun'].id, 'completed', 'Verified']
    );
    await client.query(
      'INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [app.id, 'general', 'Applicant verified successfully', false, true, users['fo.arun'].id]
    );
    await client.query(
      'INSERT INTO stage_transitions (application_id, from_stage_id, to_stage_id, action, performed_by, remarks) VALUES ($1, $2, $3, $4, $5, $6)',
      [app.id, stageMap['new_application'], stageMap['field_verification'], 'complete', users['fo.arun'].id, 'Moved to verification']
    );
  }

  // Step 9: Loans
  console.log('9. Loans...');
  const loans = [];
  const loanDefs = [
    { appIdx: 0, prod: 'PRD1000001', amount: 25000, tenure: 12, rate: 14, emi: 2380, interest: 3600, total: 28600, charges: 2000, princPaid: 12608, intPaid: 3600, emiPaid: 6, status: 'active' },
    { appIdx: 1, prod: 'PRD1000002', amount: 50000, tenure: 24, rate: 15, emi: 2435, interest: 8440, total: 58440, charges: 4000, princPaid: 17500, intPaid: 8440, emiPaid: 10, status: 'active' },
    { appIdx: 2, prod: 'PRD1000002', amount: 75000, tenure: 36, rate: 13, emi: 2350, interest: 19800, total: 94800, charges: 6000, princPaid: 26250, intPaid: 19800, emiPaid: 8, status: 'disbursed' },
  ];
  for (const l of loanDefs) {
    const app = applications[l.appIdx];
    const r = await client.query(
      `INSERT INTO loans (loan_number, application_id, customer_id, product_id, branch_id, area_id, loan_amount, approved_amount, tenure_months, interest_rate, interest_type, emi_amount, total_interest, total_payable, total_charges, principal_paid, interest_paid, emi_paid_count, total_emis, first_emi_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id, loan_number`,
      ['LON' + String(1000001 + loans.length), app.id, app.customer.id, products[l.prod], branches['BRN1000002'], areas['ARE1000001'],
       l.amount, l.amount, l.tenure, l.rate, 'reducing', l.emi, l.interest, l.total, l.charges, l.princPaid, l.intPaid, l.emiPaid, l.tenure, '2026-04-01', l.status]
    );
    loans.push({ id: r.rows[0].id, loan_number: r.rows[0].loan_number, customerId: app.customer.id });
  }

  // Step 10: EMI schedules
  console.log('10. EMI schedules...');
  for (const loan of loans) {
    const lr = await client.query('SELECT * FROM loans WHERE id = $1', [loan.id]);
    const l = lr.rows[0];
    const monthlyRate = l.interest_rate / 100 / 12;
    let balance = l.loan_amount;

    for (let emi = 1; emi <= l.total_emis; emi++) {
      const dueDate = new Date(l.first_emi_date);
      dueDate.setMonth(dueDate.getMonth() + emi - 1);
      const isPaid = emi <= l.emi_paid_count;
      const interest = Math.round(balance * monthlyRate * 100) / 100;
      const principal = Math.round((l.emi_amount - interest) * 100) / 100;
      balance = Math.round((balance - principal) * 100) / 100;

      await client.query(
        `INSERT INTO emi_schedules (loan_id, emi_number, due_date, emi_amount, principal, interest, opening_balance, closing_balance, is_paid, paid_on)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [loan.id, emi, dueDate.toISOString().split('T')[0], l.emi_amount,
         principal, interest, balance + principal, balance, isPaid, isPaid ? dueDate.toISOString().split('T')[0] : null]
      );
    }
  }

  // Step 11: EMI payments
  console.log('11. EMI payments...');
  for (let i = 0; i < 2; i++) {
    const emiR = await client.query(
      'SELECT * FROM emi_schedules WHERE loan_id = $1 AND is_paid = true LIMIT 1 OFFSET $2',
      [loans[i].id, i]
    );
    if (emiR.rows.length === 0) continue;
    const e = emiR.rows[0];
    const pr = await client.query(
      `INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, payment_method, payment_date, received_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      ['PAY' + String(1000001 + i), loans[i].id, e.id, loans[i].customerId, e.emi_amount, e.principal, e.interest, 'cash', e.paid_on, users['ca.selva'].id]
    );
    await client.query(
      'INSERT INTO payment_receipts (emi_payment_id, loan_id, customer_id, receipt_amount, receipt_date) VALUES ($1, $2, $3, $4, $5)',
      [pr.rows[0].id, loans[i].id, loans[i].customerId, e.emi_amount, e.paid_on]
    );
  }

  // Step 12: Penalties
  console.log('12. Penalties...');
  await client.query(
    `INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type, penalty_amount, final_amount, penalty_date, due_date, is_paid) VALUES
     ('PEN1000001', $1, null, $2, 'late_payment', 100, 100, '2026-08-15', '2026-08-10', true),
     ('PEN1000002', $3, null, $4, 'late_payment', 150, 150, '2026-08-20', '2026-08-15', true)`,
    [loans[0].id, appDefs[0].customer ? users[appDefs[0].customer].id : loans[0].customerId, loans[1].id, appDefs[1].customer ? users[appDefs[1].customer].id : loans[1].customerId]
  );

  // Step 13: Disbursements + charges
  console.log('13. Disbursements...');
  for (let i = 0; i < 2; i++) {
    const procFee = i === 0 ? 500 : 1000;
    const docCharge = i === 0 ? 200 : 500;
    const totalCharges = procFee + docCharge;
    const loanAmt = [50000, 75000][i];
    const netAmount = loanAmt - totalCharges;

    const dR = await client.query(
      `INSERT INTO disbursements (disbursement_number, loan_id, application_id, customer_id, product_id, branch_id, bank_account_id, loan_amount, processing_fee, document_charge, total_charges, net_disbursement_amount, disbursement_mode, utr_number, disbursement_date, status, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'bank_transfer', $13, '2026-09-01', 'completed', $14) RETURNING id`,
      ['DSB' + String(1000001 + i), loans[i].id, applications[i].id, applications[i].customer.id,
       products[i === 0 ? 'PRD1000001' : 'PRD1000002'], branches['BRN1000002'], banks['BNK1000001'],
       loanAmt, procFee, docCharge, totalCharges, netAmount,
       'UTR' + Date.now().toString().slice(-10) + i, users['admin'].id]
    );

    await client.query(
      'INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, charge_amount, total_amount) VALUES ($1, $2, $3, $4, $5, $5)',
      ['CHG' + String(1000001 + i * 2 + 1), dR.rows[0].id, 'processing_fee', 'Processing Fee', procFee]
    );
    await client.query(
      'INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, charge_amount, total_amount) VALUES ($1, $2, $3, $4, $5, $5)',
      ['CHG' + String(1000001 + i * 2 + 2), dR.rows[0].id, 'document_charge', 'Document Charge', docCharge]
    );
  }

  // Step 14: Verification tasks
  console.log('14. Tasks...');
  const taskDefs = [
    { type: 'field_verification', appIdx: 0, assignee: 'fo.arun' },
    { type: 'document_verification', appIdx: 1, assignee: 'fo.meena' },
    { type: 'collection', appIdx: 2, assignee: 'ca.selva' },
  ];
  for (let i = 0; i < taskDefs.length; i++) {
    const t = taskDefs[i];
    await client.query(
      `INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, verification_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['TSK' + String(1000001 + i), applications[t.appIdx].id, t.type, users[t.assignee].id,
       users['tl.anna'].id, 'high', 'assigned', '2026-10-15', JSON.stringify({ notes: 'Verify at location' })]
    );
  }

  // Step 15: Ledger
  console.log('15. Ledger...');
  const ledgerAccounts = {};
  const accDefs = [
    ['LAC1000001', 'Cash', 'assets', 'direct', 500000],
    ['LAC1000002', 'Bank - SBI', 'assets', 'direct', 2500000],
    ['LAC1000003', 'Bank - HDFC', 'assets', 'direct', 1800000],
    ['LAC1000004', 'Loans Disbursed', 'assets', 'direct', 350000],
    ['LAC1000005', 'Interest Receivable', 'assets', 'direct', 12000],
    ['LAC1000006', 'Salary Expenses', 'expenses', 'indirect', 45000],
    ['LAC1000007', 'Rent Expenses', 'expenses', 'indirect', 15000],
    ['LAC1000008', 'Processing Fee Income', 'income', 'direct', 8500],
    ['LAC1000009', 'Interest Income', 'income', 'direct', 22000],
    ['LAC1000010', 'Document Charges Income', 'income', 'direct', 3000],
    ['LAC1000011', 'Penalty Income', 'income', 'direct', 500],
    ['LAC1000012', 'EMI Collections', 'assets', 'direct', 8000],
  ];
  for (const [code, name, group, type, balance] of accDefs) {
    const r = await client.query(
      'INSERT INTO ledger_accounts (account_code, account_name, account_group, account_type, current_balance) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [code, name, group, type, balance]
    );
    ledgerAccounts[code] = r.rows[0].id;
  }

  const entryDefs = [
    ['Disbursement to Raman - LON1000001', 'LAC1000004', 'LAC1000002', 50000, 50000],
    ['Office Rent - October 2026', 'LAC1000007', 'LAC1000001', 15000, 15000],
    ['Salary - September 2026', 'LAC1000006', 'LAC1000002', 45000, 45000],
  ];
  for (const [desc, debit, credit, dAmt, cAmt] of entryDefs) {
    const r = await client.query(
      `INSERT INTO ledger_entries (entry_date, description, reference_type, narration) VALUES ($1, $2, 'manual', $3) RETURNING id, entry_number`,
      ['2026-10-01', desc, desc]
    );
    const eid = r.rows[0].id;
    await client.query('INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order) VALUES ($1, $2, $3, 0, $4)',
      [eid, ledgerAccounts[debit], dAmt, 1]);
    await client.query('INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order) VALUES ($1, $2, 0, $3, $4)',
      [eid, ledgerAccounts[credit], cAmt, 2]);
  }

  // Step 16: Bank statements
  console.log('16. Bank statements...');
  await client.query(
    `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, credit_amount, balance, entry_type) VALUES
     ($1, '2026-10-01', 'Salary Deposit', 'TXN100000', 0, 45000, 2950000, 'manual'),
     ($1, '2026-10-02', 'EMI Collection', 'TXN100010', 0, 4505, 2954505, 'manual'),
     ($1, '2026-10-03', 'Office Rent', 'TXN100020', 15000, 0, 2939505, 'manual')`,
    [banks['BNK1000001']]
  );

  // Step 17: SMS/Email
  console.log('17. Communications...');
  const smsTplR = await client.query("SELECT id FROM sms_templates WHERE template_code = 'EMI_DUE' LIMIT 1");
  const smsTplId = smsTplR.rows[0]?.id;
  await client.query(
    `INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, template_id, message_text, status, sent_at) VALUES
     ('SMS1000001', '9876500001', 'Raman', $1, 'Dear Customer, your EMI is due on 2026-11-01.', 'sent', '2026-10-01T10:00:00'),
     ('SMS1000002', '9876500002', 'Lakshmi', $1, 'Dear Customer, your EMI is due on 2026-11-01.', 'sent', '2026-10-01T10:05:00'),
     ('SMS1000003', '9876500003', 'Murugan', $1, 'Dear Customer, your EMI is due on 2026-11-01.', 'sent', '2026-10-01T10:10:00')`,
    [smsTplId]
  );

  const emailTplR = await client.query("SELECT id FROM email_templates WHERE template_code = 'EMI_RECEIPT' LIMIT 1");
  const emailTplId = emailTplR.rows[0]?.id;
  await client.query(
    `INSERT INTO email_logs (email_number, recipient_email, recipient_name, template_id, subject, status, sent_at) VALUES
     ('EML1000001', 'raman.k@gmail.com', 'Raman', $1, 'Your EMI Payment Receipt | CMF', 'sent', '2026-10-01T10:30:00'),
     ('EML1000002', 'lakshmi.s@gmail.com', 'Lakshmi', $1, 'Your EMI Payment Receipt | CMF', 'sent', '2026-10-01T10:35:00')`,
    [emailTplId]
  );

  // Step 18: Referrals
  console.log('18. Referrals...');
  await client.query(
    `INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status) VALUES
     ('REF1000001', $1, 'Karthik', '9876500011', 'Anna Nagar, Chennai', 'pending'),
     ('REF1000002', $2, 'Vijay', '9876500012', 'T Nagar, Chennai', 'contacted'),
     ('REF1000003', $3, 'Deepa', '9876500013', 'Adyar, Chennai', 'applied')`,
    [users['cust.raman'].id, users['cust.lakshmi'].id, users['cust.murugan'].id]
  );

  // Step 19: Trust scores
  console.log('19. Trust scores...');
  await client.query(
    `INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, calculated_by) VALUES
     ($1, $2, 85, 80, 90, 85, 'A', $3),
     ($4, $5, 70, 65, 75, 70, 'B', $3),
     ($6, $7, 90, 88, 95, 91, 'A', $3)`,
    [users['cust.raman'].id, applications[0].id, users['tl.anna'].id,
     users['cust.lakshmi'].id, applications[1].id,
     users['cust.murugan'].id, applications[2].id]
  );

  // Step 20: Audit logs
  console.log('20. Audit logs...');
  await client.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_number, ip_address) VALUES
     ($1, 'application.created', 'application', $2, $3, '192.168.1.100'),
     ($4, 'application.approved', 'application', $2, $3, '192.168.1.100'),
     ($1, 'loan.disbursed', 'loan', $5, $6, '192.168.1.100')`,
    [users['fo.arun'].id, applications[0].id, applications[0].application_number,
     users['tl.anna'].id, loans[0].id, loans[0].loan_number]
  );

  // Step 21: Approval history
  console.log('21. Approval history...');
  await client.query(
    `INSERT INTO approval_history (application_id, level, approver_id, role_at_time, limit_amount, action, remarks) VALUES
     ($1, 1, $2, 'team_leader', 50000, 'approved', 'Verified documents'),
     ($3, 1, $2, 'team_leader', 50000, 'approved', 'Good applicant')`,
    [applications[0].id, users['tl.anna'].id, applications[1].id]
  );

  // Step 22: NPA
  console.log('22. NPA...');
  await client.query(
    `INSERT INTO npa_classifications (npa_number, loan_id, customer_id, classification_date, overdue_days, overdue_amount, npa_category, substandard_days, provision_pct, is_active) VALUES
     ('NPA1000001', $1, $2, '2026-10-01', 90, 2908, 'sub_standard', 90, 15, true)`,
    [loans[2].id, applications[2].customer.id]
  );

  // Final summary
  console.log('\n========== SEEDING COMPLETE ==========');
  const tables = ['users', 'user_profiles', 'applications', 'application_topics', 'application_stages',
    'application_notes', 'loans', 'emi_schedules', 'emi_payments', 'payment_receipts',
    'penalties', 'disbursements', 'disbursement_charges', 'ledger_accounts', 'ledger_entries',
    'ledger_entry_lines', 'bank_statement_entries', 'npa_classifications', 'verification_tasks',
    'referrals', 'trust_scores', 'sms_logs', 'email_logs', 'audit_logs', 'stage_transitions',
    'approval_history', 'bank_accounts', 'loan_products', 'product_slabs', 'branches', 'areas',
    'roles', 'permissions', 'user_areas', 'approval_limits', 'sms_templates', 'email_templates'];
  for (const t of tables) {
    const c = await client.query('SELECT COUNT(*) AS cnt FROM ' + t);
    if (parseInt(c.rows[0].cnt) > 0) console.log('  ' + t + ': ' + c.rows[0].cnt);
  }

  console.log('\nLogin credentials (password: password123):');
  const creds = [
    ['super_admin', 'admin'], ['branch_admin', 'branch.chennai'], ['team_leader', 'tl.anna'],
    ['field_officer', 'fo.arun'], ['collection_agent', 'ca.selva'],
    ['customer', 'cust.raman'], ['lender', 'lender.rao']
  ];
  for (const [role, uname] of creds) {
    const u = users[uname];
    if (u) console.log('  ' + role + ': ' + uname + ' (' + u.customerCode + ')');
  }

  await client.end();
}

main().catch(e => { console.error('Fatal:', e.message); console.error(e.stack); process.exit(1); });