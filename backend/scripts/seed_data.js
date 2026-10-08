const { Client } = require('pg');
const bcrypt = require('bcrypt');

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
  console.log('Connected — seeding data\n');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Get role IDs
  const roles = {};
  const r = await client.query('SELECT id, name FROM roles');
  r.rows.forEach(row => roles[row.name] = row.id);

  // Get permission IDs
  const perms = {};
  const p = await client.query('SELECT id, name FROM permissions');
  p.rows.forEach(row => perms[row.name] = row.id);

  // Get branch IDs
  const branches = {};
  const b = await client.query('SELECT id, branch_code FROM branches');
  b.rows.forEach(row => branches[row.branch_code] = row.id);

  // Get area IDs
  const areas = {};
  const a = await client.query('SELECT id, area_code FROM areas');
  a.rows.forEach(row => areas[row.area_code] = row.id);

  // Get product IDs
  const products = {};
  const pr = await client.query('SELECT id, product_code FROM loan_products');
  pr.rows.forEach(row => products[row.product_code] = row.id);

  // Get bank account IDs
  const banks = {};
  const bk = await client.query('SELECT id, account_code FROM bank_accounts');
  bk.rows.forEach(row => banks[row.account_code] = row.id);

  // Get stage IDs
  const stages = {};
  const st = await client.query('SELECT id, code FROM stages');
  st.rows.forEach(row => stages[row.code] = row.id);

  // ====== 1. USERS (5 per role type) ======
  const users = {};
  const userData = [
    // Super Admin (1)
    { username: 'admin.cmf', email: 'admin@continummicrofinance.in', phone: '9876543210', role: 'super_admin', fname: 'Admin', lname: 'User' },
    // Branch Admin (1)
    { username: 'branch.chennai', email: 'branch@continummicrofinance.in', phone: '9876543211', role: 'branch_admin', fname: 'Branch', lname: 'Admin', branch: 'BRN1000001' },
    // Team Leaders (2)
    { username: 'tl.anna', email: 'tl.anna@continummicrofinance.in', phone: '9876543212', role: 'team_leader', fname: 'Raman', lname: 'Kumar', branch: 'BRN1000002', area: 'ARE1000001' },
    { username: 'tl.velachery', email: 'tl.velachery@continummicrofinance.in', phone: '9876543213', role: 'team_leader', fname: 'Priya', lname: 'Devi', branch: 'BRN1000002', area: 'ARE1000002' },
    // Field Officers (3)
    { username: 'fo.arun', email: 'fo.arun@continummicrofinance.in', phone: '9876543214', role: 'field_officer', fname: 'Arun', lname: 'Kumar', branch: 'BRN1000002', area: 'ARE1000001' },
    { username: 'fo.meena', email: 'fo.meena@continummicrofinance.in', phone: '9876543215', role: 'field_officer', fname: 'Meena', lname: 'R', branch: 'BRN1000002', area: 'ARE1000002' },
    { username: 'fo.ravi', email: 'fo.ravi@continummicrofinance.in', phone: '9876543216', role: 'field_officer', fname: 'Ravi', lname: 'Shankar', branch: 'BRN1000003', area: 'ARE1000003' },
    // Collection Agents (3)
    { username: 'ca.selva', email: 'ca.selva@continummicrofinance.in', phone: '9876543217', role: 'collection_agent', fname: 'Selvam', lname: 'M', branch: 'BRN1000002', area: 'ARE1000001' },
    { username: 'ca.kumar', email: 'ca.kumar@continummicrofinance.in', phone: '9876543218', role: 'collection_agent', fname: 'Kumar', lname: 'R', branch: 'BRN1000002', area: 'ARE1000002' },
    { username: 'ca.devi', email: 'ca.devi@continummicrofinance.in', phone: '9876543219', role: 'collection_agent', fname: 'Devi', lname: 'K', branch: 'BRN1000003', area: 'ARE1000003' },
    // Customers (5)
    { username: 'cust.raman', email: 'raman.k@gmail.com', phone: '9876500001', role: 'customer', fname: 'Raman', lname: 'Kumar', branch: 'BRN1000002', area: 'ARE1000001' },
    { username: 'cust.lakshmi', email: 'lakshmi.s@gmail.com', phone: '9876500002', role: 'customer', fname: 'Lakshmi', lname: 'S', branch: 'BRN1000002', area: 'ARE1000001' },
    { username: 'cust.murugan', email: 'murugan.t@gmail.com', phone: '9876500003', role: 'customer', fname: 'Murugan', lname: 'T', branch: 'BRN1000002', area: 'ARE1000002' },
    { username: 'cust.kala', email: 'kala.r@gmail.com', phone: '9876500004', role: 'customer', fname: 'Kala', lname: 'R', branch: 'BRN1000003', area: 'ARE1000003' },
    { username: 'cust.senthil', email: 'senthil.m@gmail.com', phone: '9876500005', role: 'customer', fname: 'Senthil', lname: 'M', branch: 'BRN1000003', area: 'ARE1000004' },
    // Lenders (2)
    { username: 'lender.rao', email: 'lender.rao@example.com', phone: '9876543220', role: 'lender', fname: 'Rao', lname: 'Investments' },
    { username: 'lender.shetty', email: 'lender.shetty@example.com', phone: '9876543221', role: 'lender', fname: 'Shetty', lname: 'Capital' },
  ];

  console.log('Creating users...');
  for (const u of userData) {
    const res = await client.query(
      'INSERT INTO users (username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified) VALUES ($1, $2, $3, $4, $5, true, true, true, true) RETURNING id, customer_code',
      [u.username, u.email, u.phone, passwordHash, u.role]
    );
    const userId = res.rows[0].id;
    const customerCode = res.rows[0].customer_code;
    users[u.username] = { id: userId, customerCode, ...u };

    // Create profile
    const dob = new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    await client.query(
      'INSERT INTO user_profiles (user_id, first_name, middle_name, last_name, date_of_birth, gender, marital_status, aadhaar_verified, pan_verified, profile_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [userId, u.fname, '', u.lname, dob.toISOString().split('T')[0], 'male', 'married', true, true, true]
    );
  }
  console.log('Created ' + Object.keys(users).length + ' users');

  // ====== 2. APPLICATIONS (5) ======
  const applications = [];
  const custUsers = Object.entries(users).filter(([k, u]) => u.role === 'customer');
  console.log('\nCreating applications...');
  for (let i = 0; i < 5; i++) {
    const [cKey, cust] = custUsers[i];
    const prodCode = i < 2 ? 'PRD1000001' : (i < 4 ? 'PRD1000002' : 'PRD1000003');
    const prodId = products[prodCode];
    const branch = cust.branch || 'BRN1000002';
    const branchId = branches[branch];
    const areaId = cust.area ? areas[cust.area] : null;

    const res = await client.query(
      `INSERT INTO applications (customer_id, product_id, branch_id, area_id, created_by, loan_amount, tenure_months, interest_rate, emi_amount, status, cibil_score, eligibility_score, total_household_income)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id, application_number`,
      [cust.id, prodId, branchId, areaId, users['fo.arun'].id, [25000, 50000, 75000, 100000, 50000][i], [12, 24, 36, 12, 18][i], [14, 15, 13, 16, 14][i], [2380, 2435, 2350, 8742, 3162][i],
       ['submitted', 'in_review', 'approved', 'query_raised', 'disbursed'][i],
       [650, 720, 580, 750, 680][i], [85, 92, 78, 90, 88][i], [35000, 45000, 28000, 50000, 40000][i]]
    );
    const app = res.rows[0];
    applications.push({ id: app.id, application_number: app.application_number, customer: cust });

    // Add topics (16 topics per application)
    const topics = [
      { code: 'applicant_details', name: 'Applicant Details', order: 1, data: { full_name: cust.fname + ' ' + cust.lname, phone: cust.phone } },
      { code: 'basic_details', name: 'Basic Details', order: 2, data: { age: 30 + i, occupation: ['Self Employed', 'Salaried', 'Business'][i % 3] } },
      { code: 'kyc_details', name: 'KYC Details', order: 3, data: { aadhaar_verified: true, pan_verified: true, voter_id: 'YES' + i } },
      { code: 'work_details', name: 'Work Details', order: 4, data: { company: 'ABC Pvt Ltd', designation: 'Manager', years: 3 + i } },
      { code: 'banking_details', name: 'Banking Details', order: 5, data: { bank_name: 'SBI', account_type: 'savings' } },
      { code: 'ratio_analysis', name: 'Ratio Analysis', order: 6, data: { debt_ratio: 0.3 + i * 0.1, dti_ratio: 0.2 + i * 0.05 } },
      { code: 'obligations', name: 'Obligations', order: 7, data: { existing_loans: i, total_emi: [500, 1200, 800, 0, 1500][i] } },
      { code: 'income_details', name: 'Income Details', order: 8, data: { monthly_income: 25000 + i * 5000, annual_income: 300000 + i * 60000 } },
      { code: 'customer_wealth', name: 'Customer Wealth', order: 9, data: { gold_value: 50000 + i * 10000, property_value: 200000 + i * 50000 } },
      { code: 'product_details', name: 'Product Details', order: 10, data: { purpose: ['Business', 'Education', 'Medical', 'Home', 'Vehicle'][i] } },
      { code: 'property_details', name: 'Property Details', order: 11, data: { owned: i % 2 === 0, type: 'Residential' } },
      { code: 'eligibility', name: 'Eligibility Calculation', order: 12, data: { eligible_amount: 75000, eligible_tenure: 24, score: 85 + i } },
      { code: 'documents', name: 'Documents', order: 13, data: { documents_uploaded: true, doc_count: 5 } },
      { code: 'verification_checks', name: 'Verification Checks', order: 14, data: { address_verified: true, income_verified: true } },
      { code: 'notes', name: 'Notes', order: 15, data: { remark: 'Applicant verified successfully' } },
      { code: 'query', name: 'Query', order: 16, data: { has_query: false } }
    ];
    for (const t of topics) {
      await client.query(
        `INSERT INTO application_topics (application_id, topic_code, topic_name, topic_order, topic_data, is_completed, completion_pct)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [app.id, t.code, t.name, t.order, JSON.stringify(t.data), true, 100]
      );
    }
    // Add a stage
    await client.query(
      'INSERT INTO application_stages (application_id, stage_id, assigned_to, status, notes) VALUES ($1, $2, $3, $4, $5)',
      [app.id, stages['field_verification'], users['fo.arun'].id, 'completed', 'Field verification done']
    );
    // Add application notes
    await client.query(
      'INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [app.id, 'general', 'Applicant verified at residence. Documents clear. Good repayment history.', false, true, users['fo.arun'].id]
    );
  }
  console.log('Created ' + applications.length + ' applications with topics');

  // ====== 3. LOANS (3) ======
  console.log('\nCreating loans...');
  const loans = [];
  for (let i = 0; i < 3; i++) {
    const cust = custUsers[i][1];
    const prodCode = i === 0 ? 'PRD1000001' : (i === 1 ? 'PRD1000002' : 'PRD1000003');
    const prodId = products[prodCode];
    const bankId = banks['BNK1000001'];
    const app = applications[i];

    const res = await client.query(
      `INSERT INTO loans (loan_number, application_id, customer_id, product_id, branch_id, area_id, loan_amount, approved_amount, tenure_months, interest_rate, interest_type, emi_amount, total_interest, total_payable, total_charges, principal_paid, interest_paid, emi_paid_count, total_emis, first_emi_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id, loan_number`,
      ['LON' + String(1000001 + i), app.id, cust.id, prodId, branches['BRN1000002'], areas['ARE1000001'], [50000, 75000, 100000][i],
       [50000, 75000, 100000][i], [12, 24, 36][i], [14, 15, 13][i], 'reducing',
       [4505, 3505, 2908][i], [8406, 17238, 29118][i], [58406, 92238, 129118][i], [4500, 6500, 8000][i],
       [4505, 3505, 2908][i], [8406, 17238, 29118][i], [6, 10, 8][i], [12, 24, 36][i],
       '2026-04-01', ['active', 'active', 'disbursed'][i]]
    );
    const loan = res.rows[0];
    loans.push({ id: loan.id, loan_number: loan.loan_number });
  }
  console.log('Created ' + loans.length + ' loans');

  // ====== 4. EMI SCHEDULES ======
  console.log('\nCreating EMI schedules...');
  for (const loan of loans) {
    const loanDetail = await client.query('SELECT * FROM loans WHERE id = $1', [loan.id]);
    const l = loanDetail.rows[0];
    for (let emi = 1; emi <= l.total_emis; emi++) {
      const dueDate = new Date(l.first_emi_date);
      dueDate.setMonth(dueDate.getMonth() + emi - 1);
      const isPaid = emi <= l.emi_paid_count;
      const principal = Math.round((l.loan_amount / l.total_emis) * 100) / 100;
      const remaining = l.loan_amount - principal * (emi - 1);
      const interest = Math.round(remaining * (l.interest_rate / 100 / 12) * 100) / 100;
      const emiAmount = Math.round((principal + interest) * 100) / 100;
      const closingBal = Math.round((remaining - principal) * 100) / 100;

      await client.query(
        `INSERT INTO emi_schedules (loan_id, emi_number, due_date, emi_amount, principal, interest, opening_balance, closing_balance, is_paid, paid_on)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [loan.id, emi, dueDate.toISOString().split('T')[0], emiAmount, principal, interest, remaining, closingBal, isPaid, isPaid ? dueDate.toISOString().split('T')[0] : null]
      );
    }
  }

  // ====== 5. EMI PAYMENTS (2) ======
  console.log('\nCreating EMI payments...');
  for (let i = 0; i < 2; i++) {
    const emi = await client.query('SELECT * FROM emi_schedules WHERE loan_id = $1 AND is_paid = true LIMIT 1 OFFSET $2', [loans[i].id, i]);
    if (emi.rows.length === 0) continue;
    const e = emi.rows[0];
    const receipt = await client.query(
      `INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, payment_method, payment_date, received_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      ['PAY' + String(1000001 + i), loans[i].id, e.id, loans[i].id, e.emi_amount, e.principal, e.interest, 'cash', e.paid_on, users['ca.selva'].id]
    );
    // Receipt
    await client.query(
      `INSERT INTO payment_receipts (emi_payment_id, loan_id, customer_id, receipt_amount, receipt_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [receipt.rows[0].id, loans[i].id, loans[i].id, e.emi_amount, e.paid_on]
    );
  }

  // ====== 6. LEDGER ACCOUNTS ======
  console.log('\nCreating ledger accounts...');
  const ledgerAccounts = {};
  const accountDefs = [
    { code: 'LAC1000001', name: 'Cash', group: 'assets', type: 'direct', balance: 500000 },
    { code: 'LAC1000002', name: 'Bank - SBI', group: 'assets', type: 'direct', balance: 2500000 },
    { code: 'LAC1000003', name: 'Bank - HDFC', group: 'assets', type: 'direct', balance: 1800000 },
    { code: 'LAC1000004', name: 'Loans Disbursed', group: 'assets', type: 'direct', balance: 350000 },
    { code: 'LAC1000005', name: 'Interest Receivable', group: 'assets', type: 'direct', balance: 12000 },
    { code: 'LAC1000006', name: 'Salary Expenses', group: 'expenses', type: 'indirect', balance: 45000 },
    { code: 'LAC1000007', name: 'Rent Expenses', group: 'expenses', type: 'indirect', balance: 15000 },
    { code: 'LAC1000008', name: 'Processing Fee Income', group: 'income', type: 'direct', balance: 8500 },
    { code: 'LAC1000009', name: 'Interest Income', group: 'income', type: 'direct', balance: 22000 },
    { code: 'LAC1000010', name: 'Document Charges Income', group: 'income', type: 'direct', balance: 3000 },
    { code: 'LAC1000011', name: 'Penalty Income', group: 'income', type: 'direct', balance: 500 },
    { code: 'LAC1000012', name: 'EMI Collections', group: 'assets', type: 'direct', balance: 8000 },
  ];
  for (const acc of accountDefs) {
    const r = await client.query(
      'INSERT INTO ledger_accounts (account_code, account_name, account_group, account_type, current_balance) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [acc.code, acc.name, acc.group, acc.type, acc.balance]
    );
    ledgerAccounts[acc.code] = r.rows[0].id;
  }

  // ====== 7. LEDGER ENTRIES (3) ======
  console.log('\nCreating ledger entries...');
  const ledgerEntries = [];
  const entryDefs = [
    { desc: 'Disbursement to Raman Kumar - LON1000001', refType: 'disbursement', debit: 'LAC1000004', credit: 'LAC1000002', debitAmt: 50000, creditAmt: 50000 },
    { desc: 'Office Rent Payment - October 2026', refType: 'expense', debit: 'LAC1000007', credit: 'LAC1000001', debitAmt: 15000, creditAmt: 15000 },
    { desc: 'Salary Payment - September 2026', refType: 'expense', debit: 'LAC1000006', credit: 'LAC1000002', debitAmt: 45000, creditAmt: 45000 },
  ];
  for (const e of entryDefs) {
    const res = await client.query(
      `INSERT INTO ledger_entries (entry_date, description, reference_type, narration) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['2026-10-01', e.desc, e.refType, 'Sample entry for testing']
    );
    const entryId = res.rows[0].id;
    const entryNumber = 'LDG' + String(1000001 + ledgerEntries.length);
    await client.query('UPDATE ledger_entries SET entry_number = $1 WHERE id = $2', [entryNumber, entryId]);

    await client.query('INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, ledgerAccounts[e.debit], e.debitAmt, 0, 1, e.desc]);
    await client.query('INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration) VALUES ($1, $2, $3, $4, $5, $6)',
      [entryId, ledgerAccounts[e.credit], 0, e.creditAmt, 2, e.desc]);
    ledgerEntries.push({ id: entryId, entry_number: entryNumber });
  }

  // ====== 8. DISBURSEMENTS (2) ======
  console.log('\nCreating disbursements...');
  for (let i = 0; i < 2; i++) {
    const prodCode = i === 0 ? 'PRD1000001' : 'PRD1000002';
    const procFee = i === 0 ? 500 : 1000;
    const docCharge = i === 0 ? 200 : 500;
    const totalCharges = procFee + docCharge;
    const loanAmt = [50000, 75000][i];
    const netAmount = loanAmt - totalCharges;

    await client.query(
      `INSERT INTO disbursements (disbursement_number, loan_id, application_id, customer_id, product_id, branch_id, bank_account_id, loan_amount, processing_fee, document_charge, total_charges, net_disbursement_amount, disbursement_mode, utr_number, disbursement_date, status, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      ['DSB' + String(1000001 + i), loans[i].id, applications[i].id, applications[i].customer.id, products[prodCode], branches['BRN1000002'], banks['BNK1000001'],
       loanAmt, procFee, docCharge, totalCharges, netAmount, 'bank_transfer', 'UTR' + Date.now().toString().slice(-10) + i,
       '2026-09-01', 'completed', users['admin.cmf'].id]
    );
  }

  // ====== 9. PENALTIES (2) ======
  console.log('\nCreating penalties...');
  for (let i = 0; i < 2; i++) {
    await client.query(
      `INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type, penalty_amount, final_amount, penalty_date, due_date, is_paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      ['PEN' + String(1000001 + i), loans[i].id, null, loans[i].id, 'late_payment', [100, 150][i], [100, 150][i],
       '2026-08-15', '2026-08-10', true]
    );
  }

  // ====== 10. VERIFICATION TASKS (3) ======
  console.log('\nCreating verification tasks...');
  const taskDefs = [
    { type: 'field_verification', appIdx: 0, assignee: 'fo.arun', priority: 'high' },
    { type: 'document_verification', appIdx: 1, assignee: 'fo.meena', priority: 'medium' },
    { type: 'collection', appIdx: 2, assignee: 'ca.selva', priority: 'medium' },
  ];
  for (const t of taskDefs) {
    await client.query(
      `INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['TSK' + String(1000001 + taskDefs.indexOf(t)), applications[t.appIdx].id, t.type, users[t.assignee].id, users['tl.anna'].id, t.priority, 'assigned', '2026-10-15']
    );
  }

  // ====== 11. REFERRALS (3) ======
  console.log('\nCreating referrals...');
  for (let i = 0; i < 3; i++) {
    await client.query(
      `INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['REF' + String(1000001 + i), custUsers[i][1].id, ['Karthik', 'Vijay', 'Deepa'][i], ['9876500011', '9876500012', '9876500013'][i],
       ['Anna Nagar, Chennai', 'T Nagar, Chennai', 'Adyar, Chennai'][i], ['pending', 'contacted', 'applied'][i]]
    );
  }

  // ====== 12. TRUST SCORES (3) ======
  console.log('\nCreating trust scores...');
  for (let i = 0; i < 3; i++) {
    await client.query(
      `INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, calculated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [custUsers[i][1].id, applications[i].id, [85, 70, 90][i], [80, 65, 88][i], [90, 75, 95][i], [85, 70, 91][i], ['A', 'B', 'A'][i], users['tl.anna'].id]
    );
  }

  // ====== 13. SMS LOGS (3) ======
  console.log('\nCreating SMS logs...');
  const smsTemplate = await client.query("SELECT id FROM sms_templates WHERE template_code = 'EMI_DUE'");
  const smsTplId = smsTemplate.rows[0]?.id;
  for (let i = 0; i < 3; i++) {
    await client.query(
      `INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, template_id, message_text, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['SMS' + String(1000001 + i), ['9876500001', '9876500002', '9876500003'][i], ['Raman', 'Lakshmi', 'Murugan'][i],
       smsTplId, 'Dear Customer, your EMI of Rs.4505 is due on 2026-11-01. Please pay to avoid late fees.', 'sent', '2026-10-01T10:00:00']
    );
  }

  // ====== 14. EMAIL LOGS (2) ======
  console.log('\nCreating email logs...');
  const emailTemplate = await client.query("SELECT id FROM email_templates WHERE template_code = 'EMI_RECEIPT'");
  const emailTplId = emailTemplate.rows[0]?.id;
  for (let i = 0; i < 2; i++) {
    await client.query(
      `INSERT INTO email_logs (email_number, recipient_email, recipient_name, template_id, subject, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['EML' + String(1000001 + i), ['raman.k@gmail.com', 'lakshmi.s@gmail.com'][i], ['Raman', 'Lakshmi'][i],
       emailTplId, 'Your EMI Payment Receipt | CMF', 'sent', '2026-10-01T10:30:00']
    );
  }

  // ====== 15. AUDIT LOGS (3) ======
  console.log('\nCreating audit logs...');
  const auditDefs = [
    { action: 'application.created', entity: 'application', entityId: applications[0].id, entityNum: applications[0].application_number, userId: users['fo.arun'].id },
    { action: 'application.approved', entity: 'application', entityId: applications[0].id, entityNum: applications[0].application_number, userId: users['tl.anna'].id },
    { action: 'loan.disbursed', entity: 'loan', entityId: loans[0].id, entityNum: loans[0].loan_number, userId: users['admin.cmf'].id },
  ];
  for (const a of auditDefs) {
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, entity_number, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [a.userId, a.action, a.entity, a.entityId, a.entityNum, '192.168.1.100']
    );
  }

  // ====== 16. STAGE TRANSITIONS ======
  console.log('\nCreating stage transitions...');
  for (let i = 0; i < 3; i++) {
    await client.query(
      `INSERT INTO stage_transitions (application_id, from_stage_id, to_stage_id, action, performed_by, remarks)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [applications[i].id, stages['new_application'], stages['field_verification'], 'complete', users['fo.arun'].id, 'Moved to field verification']
    );
  }

  // ====== 17. APPROVAL HISTORY ======
  console.log('\nCreating approval history...');
  for (let i = 0; i < 2; i++) {
    await client.query(
      `INSERT INTO approval_history (application_id, level, approver_id, role_at_time, limit_amount, action, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [applications[i].id, 1, users['tl.anna'].id, 'team_leader', [50000, 75000][i], 'approved', 'Verified documents and field visit. Recommending approval.']
    );
  }

  // ====== 18. BANK STATEMENT ENTRIES (3) ======
  console.log('\nCreating bank statement entries...');
  for (let i = 0; i < 3; i++) {
    await client.query(
      `INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, credit_amount, balance, entry_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [banks['BNK1000001'], ['2026-10-01', '2026-10-02', '2026-10-03'][i],
       ['Salary Deposit - CMF', 'EMI Collection - Raman', 'Office Rent Payment'][i],
       ['TXN' + (100000 + i), 'TXN' + (100010 + i), 'TXN' + (100020 + i)],
       [0, 0, 15000][i], [45000, 4505, 0][i], [2950000, 2954505, 2939505][i], 'manual'
    );
  }

  // ====== 19. NPA CLASSIFICATIONS (1) ======
  console.log('\nCreating NPA classification...');
  const npaResult = await client.query(
    `INSERT INTO npa_classifications (npa_number, loan_id, customer_id, classification_date, overdue_days, overdue_amount, npa_category, substandard_days, provision_pct)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    ['NPA1000001', loans[2].id, loans[2].id, '2026-10-01', 90, 2908, 'sub_standard', 90, 15]
  );

  // ====== Final Summary ======
  console.log('\n========== SEEDING COMPLETE ==========');
  const tableCounts = {};
  const tables = ['users', 'user_profiles', 'applications', 'application_topics', 'application_stages', 'application_notes', 'loans', 'emi_schedules', 'emi_payments', 'payment_receipts', 'penalties', 'disbursements', 'disbursement_charges', 'ledger_accounts', 'ledger_entries', 'ledger_entry_lines', 'bank_statement_entries', 'npa_classifications', 'verification_tasks', 'referrals', 'trust_scores', 'sms_logs', 'email_logs', 'audit_logs', 'stage_transitions', 'approval_history', 'bank_reconciliations', 'bank_accounts', 'loan_products', 'product_slabs', 'areas', 'branches', 'roles', 'permissions', 'role_permissions', 'user_areas', 'user_permission_overrides', 'password_reset_tokens', 'jwt_refresh_tokens', 'login_audit', 'stages', 'application_documents'];
  for (const t of tables) {
    const c = await client.query('SELECT COUNT(*) AS cnt FROM ' + t);
    tableCounts[t] = parseInt(c.rows[0].cnt);
  }
  console.log('\nTable records:');
  for (const [t, c] of Object.entries(tableCounts)) {
    if (c > 0) console.log('  ' + t + ': ' + c);
  }

  await client.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
