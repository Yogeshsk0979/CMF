-- ============================================================================
-- CMF Microfinance Platform — Seed Data for Chennai Office
-- Run after migrations.sql and patch_missing_tables.sql
-- Uses generate_id() for 10-digit IDs (CUST1000001, APP1000001, etc.)
-- ============================================================================

-- ============================================================================
-- STEP 1: Seed Roles
-- ============================================================================

INSERT INTO roles (id, name, display_name, description, is_system_role)
SELECT gen_random_uuid(), v.role, v.display, v.desc, true FROM (VALUES
    ('super_admin', 'Super Admin', 'Full system access'),
    ('branch_admin', 'Branch Admin', 'Branch-level management'),
    ('team_leader', 'Team Leader', 'Area and team management'),
    ('field_officer', 'Field Officer', 'Application creation and field verification'),
    ('collection_agent', 'Collection Agent', 'EMI collection'),
    ('customer', 'Customer', 'End user / borrower'),
    ('lender', 'Lender', 'Investor / funder')
) AS v(role, display, desc)
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = v.role);

-- ============================================================================
-- STEP 2: Seed Permissions
-- ============================================================================

INSERT INTO permissions (id, name, display_name, module, description)
SELECT gen_random_uuid(), p.name, p.display, p.module, p.desc FROM (VALUES
    ('dashboard.view', 'View Dashboard', 'dashboard', 'Access to role-specific dashboard'),
    ('branches.view', 'View Branches', 'branches', 'View branch list'),
    ('branches.create', 'Create Branch', 'branches', 'Create new branches'),
    ('branches.edit', 'Edit Branch', 'branches', 'Edit branch details'),
    ('areas.view', 'View Areas', 'areas', 'View area list'),
    ('areas.create', 'Create Area', 'areas', 'Create new areas'),
    ('areas.edit', 'Edit Area', 'areas', 'Edit area details'),
    ('areas.assign', 'Assign Leaders', 'areas', 'Assign area leaders and agents'),
    ('users.view', 'View Users', 'users', 'View user list'),
    ('users.create', 'Create User', 'users', 'Create new users'),
    ('users.edit', 'Edit User', 'users', 'Edit user details'),
    ('products.view', 'View Products', 'products', 'View loan products'),
    ('products.create', 'Create Product', 'products', 'Create loan products'),
    ('products.edit', 'Edit Product', 'products', 'Edit loan products'),
    ('applications.view', 'View Applications', 'applications', 'View applications'),
    ('applications.create', 'Create Application', 'applications', 'Create loan applications'),
    ('applications.review', 'Review Application', 'applications', 'Review applications'),
    ('applications.approve', 'Approve Application', 'applications', 'Approve applications'),
    ('applications.reject', 'Reject Application', 'applications', 'Reject applications'),
    ('disbursements.view', 'View Disbursements', 'disbursements', 'View disbursements'),
    ('disbursements.create', 'Create Disbursement', 'disbursements', 'Initiate disbursement'),
    ('disbursements.approve', 'Approve Disbursement', 'disbursements', 'Approve disbursement'),
    ('emi.view', 'View EMI', 'emi', 'View EMI schedules'),
    ('emi.collect', 'Collect EMI', 'emi', 'Record EMI payments'),
    ('emi.writeoff', 'Write Off Loan', 'emi', 'Write off loans'),
    ('ledger.view', 'View Ledger', 'ledger', 'View ledger entries'),
    ('ledger.create', 'Create Entry', 'ledger', 'Create manual entries'),
    ('banks.view', 'View Bank Accounts', 'banks', 'View bank accounts'),
    ('banks.manage', 'Manage Bank Accounts', 'banks', 'Manage bank accounts'),
    ('tasks.view', 'View Tasks', 'tasks', 'View assigned tasks'),
    ('tasks.assign', 'Assign Tasks', 'tasks', 'Assign tasks'),
    ('sms.send', 'Send SMS', 'sms', 'Send SMS messages'),
    ('sms.templates', 'Manage SMS Templates', 'sms', 'Manage SMS templates'),
    ('email.send', 'Send Email', 'email', 'Send emails'),
    ('email.templates', 'Manage Email Templates', 'email', 'Manage email templates'),
    ('reports.view', 'View Reports', 'reports', 'View all reports'),
    ('settings.manage', 'Manage Settings', 'settings', 'Manage system settings')
) AS p(name, display, module, desc)
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = p.name);

-- ============================================================================
-- STEP 3: Role-Permission Mapping
-- ============================================================================

DO $$
DECLARE
    sa_id UUID; ba_id UUID; tl_id UUID; fo_id UUID; ca_id UUID; cu_id UUID; le_id UUID;
BEGIN
    SELECT id INTO sa_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO ba_id FROM roles WHERE name = 'branch_admin';
    SELECT id INTO tl_id FROM roles WHERE name = 'team_leader';
    SELECT id INTO fo_id FROM roles WHERE name = 'field_officer';
    SELECT id INTO ca_id FROM roles WHERE name = 'collection_agent';
    SELECT id INTO cu_id FROM roles WHERE name = 'customer';
    SELECT id INTO le_id FROM roles WHERE name = 'lender';

    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT sa_id, p.id, true FROM permissions p
    WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = sa_id AND rp.permission_id = p.id);

    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT ba_id, p.id, true FROM permissions p
    WHERE p.name NOT IN ('settings.manage')
      AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = ba_id AND rp.permission_id = p.id);

    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT tl_id, p.id, true FROM permissions p
    WHERE p.name IN ('dashboard.view','areas.view','areas.assign','users.view','applications.view',
        'applications.review','applications.approve','applications.reject','disbursements.view',
        'emi.view','emi.collect','ledger.view','tasks.view','tasks.assign',
        'sms.send','sms.templates','email.send','email.templates','reports.view')
      AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = tl_id AND rp.permission_id = p.id);

    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT fo_id, p.id, true FROM permissions p
    WHERE p.name IN ('dashboard.view','areas.view','applications.view','applications.create',
        'disbursements.view','emi.view','tasks.view','sms.send','sms.templates','reports.view')
      AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = fo_id AND rp.permission_id = p.id);

    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT ca_id, p.id, true FROM permissions p
    WHERE p.name IN ('dashboard.view','areas.view','emi.view','emi.collect','tasks.view','tasks.complete')
      AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = ca_id AND rp.permission_id = p.id);

    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT cu_id, p.id, true FROM permissions p
    WHERE p.name IN ('dashboard.view','applications.view','emi.view')
      AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = cu_id AND rp.permission_id = p.id);

    INSERT INTO role_permissions (role_id, permission_id, is_granted)
    SELECT le_id, p.id, true FROM permissions p
    WHERE p.name IN ('dashboard.view','reports.view','emi.view')
      AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = le_id AND rp.permission_id = p.id);
END $$;

-- ============================================================================
-- STEP 4: Seed Branches (Chennai)
-- ============================================================================

INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email, manager_id)
SELECT 'CHN01', 'T Nagar Branch', 'branch', 'No. 42, Anna Salai, T Nagar', 'Chennai', 'Tamil Nadu', '600017',
    '+91-44-23450001', 'tnagar@cmf.in', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_code = 'CHN01');

INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email, manager_id)
SELECT 'CHN02', 'Adyar Branch', 'branch', 'No. 15, 2nd Avenue, Adyar', 'Chennai', 'Tamil Nadu', '600020',
    '+91-44-23450002', 'adyar@cmf.in', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_code = 'CHN02');

INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email, manager_id)
SELECT 'CHN03', 'Velachery Branch', 'branch', 'No. 88, Velachery Main Road', 'Chennai', 'Tamil Nadu', '600042',
    '+91-44-23450003', 'velachery@cmf.in', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_code = 'CHN03');

-- ============================================================================
-- STEP 5: Seed Areas
-- ============================================================================

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'TNA01', 'T Nagar North', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN01'), 'Chennai', '600017', 13.0418, 80.2341
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'TNA01');

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'TNA02', 'T Nagar South', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN01'), 'Chennai', '600018', 13.0308, 80.2204
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'TNA02');

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'ADY01', 'Adyar East', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN02'), 'Chennai', '600020', 13.0067, 80.2570
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'ADY01');

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'ADY02', 'Adyar West', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN02'), 'Chennai', '600041', 13.0056, 80.2433
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'ADY02');

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'VEL01', 'Velachery North', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN03'), 'Chennai', '600042', 12.9815, 80.2180
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'VEL01');

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'VEL02', 'Velachery South', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN03'), 'Chennai', '600044', 12.9700, 80.2207
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'VEL02');

-- ============================================================================
-- STEP 6: Seed Users (Staff)
-- ============================================================================

-- Super Admin
INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified)
SELECT generate_id('CMF'), 'superadmin', 'admin@cmf.in', '+919876543210',
    '$2b$10$abcdefghijklmnopqrstuvwx..Continnum2026!',
    'super_admin', true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Super', 'Administrator', true FROM users WHERE username = 'superadmin'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

-- Branch Admins
INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'admin.tnagar', 'admin.tnagar@cmf.in', '+919876543211',
    '$2b$10$abcdefghijklmnopqrstuvwx..Password123!',
    'branch_admin', true, true, true, true, (SELECT id FROM branches WHERE branch_code = 'CHN01')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin.tnagar');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Rajesh', 'Kumar', true FROM users WHERE username = 'admin.tnagar'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'admin.adyar', 'admin.adyar@cmf.in', '+919876543212',
    '$2b$10$abcdefghijklmnopqrstuvwx..Password123!',
    'branch_admin', true, true, true, true, (SELECT id FROM branches WHERE branch_code = 'CHN02')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin.adyar');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Priya', 'Venkatesh', true FROM users WHERE username = 'admin.adyar'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'admin.velachery', 'admin.velachery@cmf.in', '+919876543213',
    '$2b$10$abcdefghijklmnopqrstuvwx..Password123!',
    'branch_admin', true, true, true, true, (SELECT id FROM branches WHERE branch_code = 'CHN03')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin.velachery');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Arun', 'Murugan', true FROM users WHERE username = 'admin.velachery'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

-- Team Leaders
INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'tl.tnagar', 'tl.tnagar@cmf.in', '+919876550001',
    '$2b$10$abcdefghijklmnopqrstuvwx..Password123!', 'team_leader', true, true, true, true,
    (SELECT id FROM branches WHERE branch_code = 'CHN01')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tl.tnagar');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Karthik', 'Subramanian', true FROM users WHERE username = 'tl.tnagar'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'tl.adyar', 'tl.adyar@cmf.in', '+919876550002',
    '$2b$10$abcdefghijklmnopqrstuvwx..Password123!', 'team_leader', true, true, true, true,
    (SELECT id FROM branches WHERE branch_code = 'CHN02')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tl.adyar');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Senthil', 'Krishnan', true FROM users WHERE username = 'tl.adyar'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'tl.velachery', 'tl.velachery@cmf.in', '+919876550003',
    '$2b$10$abcdefghijklmnopqrstuvwx..Password123!', 'team_leader', true, true, true, true,
    (SELECT id FROM branches WHERE branch_code = 'CHN03')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tl.velachery');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Meena', 'Gopal', true FROM users WHERE username = 'tl.velachery'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

-- Field Officers
DO $$
DECLARE
    v_branch_id UUID; v_user_id UUID;
    i INTEGER;
    names TEXT[] := ARRAY['Vijay,Prakash','Lakshmi,Narayanan','Ramesh,Chandran','Divya,Sekar',
        'Manoj,Kumar','Swetha,Devi','Praveen,Raj','Anitha,Vijay',
        'Suresh,Babu','Kavitha,Ravi','Ganesh,Murthy','Bhavani,Shankar'];
    usernames TEXT[] := ARRAY['fo.tn1','fo.tn2','fo.tn3','fo.tn4','fo.ad1','fo.ad2','fo.ad3','fo.ad4','fo.ve1','fo.ve2','fo.ve3','fo.ve4'];
    phones TEXT[] := ARRAY['+919876551001','+919876551002','+919876551003','+919876551004',
        '+919876551005','+919876551006','+919876551007','+919876551008',
        '+919876551009','+919876551010','+919876551011','+919876551012'];
    bcodes TEXT[] := ARRAY['CHN01','CHN01','CHN01','CHN01','CHN02','CHN02','CHN02','CHN02','CHN03','CHN03','CHN03','CHN03'];
    fn TEXT; ln TEXT;
BEGIN
    FOR i IN 1..12 LOOP
        fn := split_part(names[i], ',', 1); ln := split_part(names[i], ',', 2);
        SELECT id INTO v_branch_id FROM branches WHERE branch_code = bcodes[i];
        INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
        SELECT generate_id('CMF'), usernames[i], usernames[i]||'@cmf.in', phones[i],
            '$2b$10$abcdefghijklmnopqrstuvwx..Password123!', 'field_officer', true, true, true, true, v_branch_id
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = usernames[i])
        RETURNING id INTO v_user_id;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed) VALUES (v_user_id, fn, ln, true);
        END IF;
    END LOOP;
END $$;

-- Collection Agents
DO $$
DECLARE
    v_branch_id UUID; v_user_id UUID;
    i INTEGER;
    names TEXT[] := ARRAY['Murali,Krishnan','Padma,Lakshmi','Balaji,Raman','Shanthi,Devi','Dinesh,Kumar','Revathi,Sankar'];
    usernames TEXT[] := ARRAY['ca.tn1','ca.tn2','ca.ad1','ca.ad2','ca.ve1','ca.ve2'];
    phones TEXT[] := ARRAY['+919876552001','+919876552002','+919876552003','+919876552004','+919876552005','+919876552006'];
    bcodes TEXT[] := ARRAY['CHN01','CHN01','CHN02','CHN02','CHN03','CHN03'];
    fn TEXT; ln TEXT;
BEGIN
    FOR i IN 1..6 LOOP
        fn := split_part(names[i], ',', 1); ln := split_part(names[i], ',', 2);
        SELECT id INTO v_branch_id FROM branches WHERE branch_code = bcodes[i];
        INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
        SELECT generate_id('CMF'), usernames[i], usernames[i]||'@cmf.in', phones[i],
            '$2b$10$abcdefghijklmnopqrstuvwx..Password123!', 'collection_agent', true, true, true, true, v_branch_id
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = usernames[i])
        RETURNING id INTO v_user_id;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed) VALUES (v_user_id, fn, ln, true);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 7: Seed User-Area Assignments
-- ============================================================================

DO $$
DECLARE
    tl RECORD; ar RECORD;
BEGIN
    FOR tl IN SELECT u.id, u.branch_id FROM users u WHERE u.role = 'team_leader' LOOP
        SELECT id INTO ar FROM areas WHERE branch_id = tl.branch_id LIMIT 1;
        IF ar IS NOT NULL THEN
            INSERT INTO user_areas (user_id, area_id, is_primary) VALUES (tl.id, ar.id, true) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    fo RECORD; ar RECORD;
BEGIN
    FOR fo IN SELECT u.id, u.branch_id FROM users u WHERE u.role = 'field_officer' LOOP
        FOR ar IN SELECT id FROM areas WHERE branch_id = fo.branch_id LOOP
            INSERT INTO user_areas (user_id, area_id, is_primary) VALUES (fo.id, ar.id, false) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

DO $$
DECLARE
    ca RECORD; ar RECORD;
BEGIN
    FOR ca IN SELECT u.id, u.branch_id FROM users u WHERE u.role = 'collection_agent' LOOP
        FOR ar IN SELECT id FROM areas WHERE branch_id = ca.branch_id LOOP
            INSERT INTO user_areas (user_id, area_id, is_primary) VALUES (ca.id, ar.id, false) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 8: Seed Loan Products
-- ============================================================================

INSERT INTO loan_products (product_code, product_name, category, description,
    min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months,
    min_interest_rate, max_interest_rate, interest_type,
    processing_fee_type, processing_fee_value, processing_fee_min, processing_fee_max,
    document_charge_type, document_charge_value, insurance_type, insurance_value,
    disbursement_mode, prepayment_allowed, foreclosure_allowed, foreclosure_charge_pct,
    late_payment_penalty_type, late_payment_penalty_value, late_payment_grace_days, is_active)
SELECT 'PL001', 'Personal Loan', 'personal', 'General purpose personal loan',
    10000, 200000, 3, 36, 16.00, 24.00, 'reducing',
    'percentage', 1.5, 500, 5000, 'percentage', 0.5, 'percentage', 0.5,
    'bank_transfer', true, true, 2.0, 'percentage', 2.0, 7, true
WHERE NOT EXISTS (SELECT 1 FROM loan_products WHERE product_code = 'PL001');

INSERT INTO loan_products (product_code, product_name, category, description,
    min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months,
    min_interest_rate, max_interest_rate, interest_type,
    processing_fee_type, processing_fee_value, processing_fee_min, processing_fee_max,
    document_charge_type, document_charge_value, insurance_type, insurance_value,
    disbursement_mode, prepayment_allowed, foreclosure_allowed, foreclosure_charge_pct,
    late_payment_penalty_type, late_payment_penalty_value, late_payment_grace_days, is_active)
SELECT 'BL001', 'Business Loan', 'business', 'Working capital and business expansion',
    50000, 1000000, 6, 60, 18.00, 28.00, 'reducing',
    'percentage', 2.0, 1000, 10000, 'percentage', 1.0, 'percentage', 1.0,
    'bank_transfer', true, true, 2.0, 'percentage', 2.0, 7, true
WHERE NOT EXISTS (SELECT 1 FROM loan_products WHERE product_code = 'BL001');

INSERT INTO loan_products (product_code, product_name, category, description,
    min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months,
    min_interest_rate, max_interest_rate, interest_type,
    processing_fee_type, processing_fee_value, processing_fee_min, processing_fee_max,
    document_charge_type, document_charge_value, insurance_type, insurance_value,
    disbursement_mode, prepayment_allowed, foreclosure_allowed, foreclosure_charge_pct,
    late_payment_penalty_type, late_payment_penalty_value, late_payment_grace_days, is_active)
SELECT 'GL001', 'Gold Loan', 'gold', 'Loan against gold ornaments',
    5000, 500000, 3, 24, 12.00, 18.00, 'flat',
    'percentage', 1.0, 300, 3000, 'flat', 500, 'percentage', 0.5,
    'bank_transfer', true, true, 1.0, 'percentage', 1.5, 5, true
WHERE NOT EXISTS (SELECT 1 FROM loan_products WHERE product_code = 'GL001');

INSERT INTO loan_products (product_code, product_name, category, description,
    min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months,
    min_interest_rate, max_interest_rate, interest_type,
    processing_fee_type, processing_fee_value, processing_fee_min, processing_fee_max,
    document_charge_type, document_charge_value, insurance_type, insurance_value,
    disbursement_mode, prepayment_allowed, foreclosure_allowed, foreclosure_charge_pct,
    late_payment_penalty_type, late_payment_penalty_value, late_payment_grace_days, is_active)
SELECT 'EL001', 'Emergency Loan', 'emergency', 'Quick disbursement emergency loan',
    5000, 100000, 3, 12, 20.00, 30.00, 'flat',
    'flat', 500, 500, 2000, 'flat', 300, 'flat', 200,
    'bank_transfer', true, true, 3.0, 'flat', 500, 0, true
WHERE NOT EXISTS (SELECT 1 FROM loan_products WHERE product_code = 'EL001');

-- ============================================================================
-- STEP 9: Seed Product Slabs
-- ============================================================================

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'PL001-1', 'Small (10K-50K)', 1, 10000, 50000, 22.00, 1.0, 200, true
FROM loan_products WHERE product_code = 'PL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'PL001-1');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'PL001-2', 'Medium (50K-1L)', 2, 50001, 100000, 20.00, 1.5, 500, true
FROM loan_products WHERE product_code = 'PL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'PL001-2');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'PL001-3', 'Large (1L-2L)', 3, 100001, 200000, 18.00, 2.0, 1000, true
FROM loan_products WHERE product_code = 'PL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'PL001-3');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'BL001-1', 'Small (50K-2L)', 1, 50000, 200000, 24.00, 2.0, 1000, true
FROM loan_products WHERE product_code = 'BL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'BL001-1');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'BL001-2', 'Medium (2L-5L)', 2, 200001, 500000, 22.00, 2.5, 2000, true
FROM loan_products WHERE product_code = 'BL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'BL001-2');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'BL001-3', 'Large (5L-10L)', 3, 500001, 1000000, 20.00, 3.0, 5000, true
FROM loan_products WHERE product_code = 'BL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'BL001-3');

-- ============================================================================
-- STEP 10: Seed Bank Accounts
-- ============================================================================

INSERT INTO bank_accounts (account_code, bank_name, account_number, account_name, account_type, ifsc_code, branch_name, opening_balance, current_balance, is_primary, is_active)
SELECT 'BNK0000001', 'HDFC Bank', '50200012345678', 'Continnum Micro Finance', 'current', 'HDFC0001234', 'T Nagar', 5000000, 5000000, true, true
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_code = 'BNK0000001');

INSERT INTO bank_accounts (account_code, bank_name, account_number, account_name, account_type, ifsc_code, branch_name, opening_balance, current_balance, is_primary, is_active)
SELECT 'BNK0000002', 'ICICI Bank', '62190123456789', 'Continnum Micro Finance', 'current', 'ICIC0001234', 'Adyar', 3000000, 3000000, false, true
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_code = 'BNK0000002');

INSERT INTO bank_accounts (account_code, bank_name, account_number, account_name, account_type, ifsc_code, branch_name, opening_balance, current_balance, is_primary, is_active)
SELECT 'BNK0000003', 'SBI', '32145678901', 'Continnum Micro Finance', 'current', 'SBIN0001234', 'Velachery', 2000000, 2000000, false, true
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_code = 'BNK0000003');

-- ============================================================================
-- STEP 11: Seed Chart of Accounts
-- ============================================================================

INSERT INTO ledger_accounts (account_code, account_name, account_group, account_type, is_system, opening_balance)
VALUES
    ('1001', 'Cash in Hand', 'assets', 'direct', true, 0),
    ('1002', 'HDFC Bank Account', 'assets', 'direct', true, 5000000),
    ('1003', 'ICICI Bank Account', 'assets', 'direct', true, 3000000),
    ('1004', 'SBI Bank Account', 'assets', 'direct', true, 2000000),
    ('1101', 'Loans Receivable', 'assets', 'direct', true, 0),
    ('1102', 'Interest Receivable', 'assets', 'direct', true, 0),
    ('1103', 'Processing Fee Receivable', 'assets', 'direct', true, 0),
    ('1104', 'GST Receivable', 'assets', 'direct', true, 0),
    ('1105', 'Late Fees Receivable', 'assets', 'direct', true, 0),
    ('1201', 'Fixed Assets', 'assets', 'direct', true, 0),
    ('2001', 'Loan Portfolio', 'liabilities', 'indirect', true, 0),
    ('2002', 'GST Payable', 'liabilities', 'indirect', true, 0),
    ('3001', 'Capital Account', 'equity', '', true, 10000000),
    ('4001', 'Interest Income', 'income', 'indirect', true, 0),
    ('4002', 'Processing Fee Income', 'income', 'indirect', true, 0),
    ('4003', 'Document Fee Income', 'income', 'indirect', true, 0),
    ('4004', 'Late Fee Income', 'income', 'indirect', true, 0),
    ('4005', 'Prepayment Charges', 'income', 'indirect', true, 0),
    ('5001', 'Salary Expense', 'expenses', 'indirect', true, 0),
    ('5002', 'Rent Expense', 'expenses', 'indirect', true, 0),
    ('5003', 'Office Expense', 'expenses', 'indirect', true, 0),
    ('5004', 'Marketing Expense', 'expenses', 'indirect', true, 0),
    ('5005', 'Travel Expense', 'expenses', 'indirect', true, 0)
ON CONFLICT (account_code) DO NOTHING;

-- ============================================================================
-- STEP 12: Seed Stages
-- ============================================================================

INSERT INTO stages (code, name, description, stage_order, required_roles, sla_hours, is_mandatory)
VALUES
    ('draft', 'Draft', 'Application being filled', 1, ARRAY['field_officer'], 0, true),
    ('submitted', 'Submitted', 'Submitted for review', 2, ARRAY['team_leader'], 24, true),
    ('doc_verification', 'Document Verification', 'Verify submitted documents', 3, ARRAY['field_officer','team_leader'], 24, true),
    ('field_verification', 'Field Verification', 'Physical verification at location', 4, ARRAY['field_officer'], 48, true),
    ('credit_check', 'Credit Assessment', 'Evaluate creditworthiness', 5, ARRAY['team_leader'], 48, true),
    ('manager_review', 'Manager Review', 'Branch manager review', 6, ARRAY['branch_admin'], 72, true),
    ('approved', 'Approved', 'Approved for disbursement', 7, ARRAY['branch_admin','super_admin'], 24, true),
    ('disbursed', 'Disbursed', 'Loan disbursed', 8, ARRAY['branch_admin'], 24, true),
    ('rejected', 'Rejected', 'Application rejected', 9, ARRAY['branch_admin','super_admin'], 0, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 13: Seed SMS Templates
-- ============================================================================

INSERT INTO sms_templates (template_code, template_name, category, template_text, variables, is_active)
VALUES
    ('APP_SUBMITTED', 'Application Submitted', 'application',
        'Dear {customer_name}, loan application {app_number} for Rs.{amount} submitted. Ref: {app_number}. CMF Team',
        ARRAY['{customer_name}','{app_number}','{amount}'], true),
    ('APP_APPROVED', 'Application Approved', 'application',
        'Dear {customer_name}, loan {app_number} APPROVED for Rs.{amount}. Visit branch. CMF Team',
        ARRAY['{customer_name}','{app_number}','{amount}'], true),
    ('APP_REJECTED', 'Application Rejected', 'application',
        'Dear {customer_name}, loan {app_number} not approved. Reason: {reason}. CMF Team',
        ARRAY['{customer_name}','{app_number}','{reason}'], true),
    ('EMI_DUE', 'EMI Due Reminder', 'payment',
        'Dear {customer_name}, EMI Rs.{amount} for {loan_number} due on {due_date}. CMF Team',
        ARRAY['{customer_name}','{amount}','{loan_number}','{due_date}'], true),
    ('EMI_OVERDUE', 'EMI Overdue Alert', 'payment',
        'Dear {customer_name}, EMI Rs.{amount} for {loan_number} is {days} days overdue. Late fee Rs.{fee}. CMF Team',
        ARRAY['{customer_name}','{amount}','{loan_number}','{days}','{fee}'], true),
    ('DISBURSED', 'Disbursement Confirmation', 'disbursement',
        'Dear {customer_name}, loan {loan_number} Rs.{amount} disbursed. EMI from {first_emi}. CMF Team',
        ARRAY['{customer_name}','{loan_number}','{amount}','{first_emi}'], true),
    ('PAYMENT_RECEIVED', 'Payment Received', 'payment',
        'Dear {customer_name}, Rs.{amount} received for {loan_number}. Receipt: {receipt}. Bal: Rs.{balance}. CMF Team',
        ARRAY['{customer_name}','{amount}','{loan_number}','{receipt}','{balance}'], true),
    ('QUERY_RAISED', 'Query Raised', 'application',
        'Dear {customer_name}, query on {app_number}. Submit docs. Query: {query_text}. CMF Team',
        ARRAY['{customer_name}','{app_number}','{query_text}'], true)
ON CONFLICT (template_code) DO NOTHING;

-- ============================================================================
-- STEP 14: Seed Email Templates
-- ============================================================================

INSERT INTO email_templates (template_code, template_name, category, subject, html_body, text_body, variables, is_active)
VALUES
    ('APP_SUBMITTED', 'Application Submitted', 'application',
        'Loan Application Submitted | CMF',
        '<h2>Dear {customer_name},</h2><p>Application <strong>{app_number}</strong> for Rs.{amount} submitted.</p><p>We will review within 2-3 working days.</p><br><p>CMF Team</p>',
        'Dear {customer_name}, loan application {app_number} for Rs.{amount} submitted.',
        ARRAY['{customer_name}','{app_number}','{amount}'], true),
    ('APP_APPROVED', 'Application Approved', 'application',
        'Loan Application {app_number} Approved | CMF',
        '<h2>Dear {customer_name},</h2><p><strong>{app_number}</strong> APPROVED for Rs.{amount}.</p><br><p>CMF Team</p>',
        'Dear {customer_name}, loan application {app_number} approved for Rs.{amount}.',
        ARRAY['{customer_name}','{app_number}','{amount}'], true),
    ('APP_REJECTED', 'Application Rejected', 'application',
        'Loan Application {app_number} Update | CMF',
        '<h2>Dear {customer_name},</h2><p>Application <strong>{app_number}</strong> not approved.</p><p>Reason: {reason}</p><br><p>CMF Team</p>',
        'Dear {customer_name}, loan application {app_number} not approved. Reason: {reason}.',
        ARRAY['{customer_name}','{app_number}','{reason}'], true),
    ('EMI_RECEIPT', 'EMI Payment Receipt', 'payment',
        'EMI Payment Receipt | CMF',
        '<h2>Dear {customer_name},</h2><p>Payment received.</p><p><strong>Loan:</strong> {loan_number}<br><strong>Amount:</strong> Rs.{amount}<br><strong>Receipt:</strong> {receipt_number}</p><br><p>CMF Team</p>',
        'Dear {customer_name}, EMI payment Rs.{amount} received. Receipt: {receipt_number}.',
        ARRAY['{customer_name}','{loan_number}','{amount}','{receipt_number}'], true),
    ('DSB_STATEMENT', 'Disbursement Statement', 'disbursement',
        'Loan Disbursement Statement | CMF',
        '<h2>Dear {customer_name},</h2><p>Loan <strong>{loan_number}</strong> disbursed.</p><p><strong>Amount:</strong> Rs.{loan_amount}<br><strong>Charges:</strong> Rs.{charges}<br><strong>Net:</strong> Rs.{net_amount}</p><br><p>CMF Team</p>',
        'Dear {customer_name}, loan {loan_number} disbursed. Net: Rs.{net_amount}.',
        ARRAY['{customer_name}','{loan_number}','{loan_amount}','{charges}','{net_amount}'], true)
ON CONFLICT (template_code) DO NOTHING;

-- ============================================================================
-- STEP 15: Seed Approval Limits
-- ============================================================================

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 50000, 10000, 12, lp.id, true
FROM roles r, loan_products lp
WHERE r.name = 'team_leader' AND lp.product_code = 'PL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 200000, 50000, 36, lp.id, true
FROM roles r, loan_products lp
WHERE r.name = 'branch_admin' AND lp.product_code = 'PL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 500000, 100000, 60, lp.id, true
FROM roles r, loan_products lp
WHERE r.name = 'branch_admin' AND lp.product_code = 'BL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

-- ============================================================================
-- STEP 16: Seed App Settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    module VARCHAR(50),
    is_editable BOOLEAN DEFAULT true,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO app_settings (setting_key, setting_value, setting_type, description)
VALUES
    ('company_name', 'Continnum Micro Finance', 'string', 'Company display name'),
    ('company_address', 'Chennai, Tamil Nadu, India', 'string', 'Company address'),
    ('company_phone', '+91-44-23450000', 'string', 'Contact number'),
    ('company_email', 'info@cmf.in', 'string', 'Company email'),
    ('gst_number', '33AABCC1234R1Z5', 'string', 'GST number'),
    ('gst_rate', '18', 'number', 'GST rate %'),
    ('emi_reminder_days', '[3,1]', 'json', 'Days before EMI for reminders'),
    ('late_payment_grace_days', '7', 'number', 'Grace period before late fee'),
    ('late_fee_type', 'percentage', 'string', 'Late fee calc type'),
    ('late_fee_value', '2.0', 'number', 'Late fee value'),
    ('portal_url', 'https://cmf.in', 'string', 'Customer portal URL')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================

SELECT 'Seed data loaded successfully!' AS result;

-- ============================================================================
-- 22. APPLICATION STAGES — stage assignments per application
-- ============================================================================
INSERT INTO application_stages (application_id, stage_id, assigned_to, status, notes)
SELECT a.id, s.id, u.id, 'completed', 'Stage completed during seeding'
FROM applications a, stages s, users u
WHERE s.code = 'new_application'
  AND u.role = 'field_officer'
  AND u.username LIKE 'fo.%'
  AND a.status NOT IN ('draft','rejected')
  AND NOT EXISTS (SELECT 1 FROM application_stages ast WHERE ast.application_id = a.id AND ast.stage_id = s.id)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 23. APPLICATION NOTES — notes per application
-- ============================================================================
INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'general', 'Field visit completed. Applicant and documents verified. Good repayment history.', true, true, u.id
FROM applications a, users u
WHERE u.username = 'fo.tnagar.north.1'
  AND a.application_number IN (SELECT application_number FROM applications WHERE status = 'approved' LIMIT 3)
ON CONFLICT DO NOTHING;

INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'document_required', 'Please submit latest salary slip and 6-month bank statement.', false, false, u.id
FROM applications a, users u
WHERE u.username = 'fo.adyar.east.1'
  AND a.status = 'query_raised'
ON CONFLICT DO NOTHING;

INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'general', 'All documents in order. Recommending approval.', false, true, u.id
FROM applications a, users u
WHERE u.username = 'fo.tnagar.north.1'
  AND a.status = 'approved'
LIMIT 2
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 24. APPLICATION DOCUMENTS — sample uploaded documents
-- ============================================================================
INSERT INTO application_documents (application_id, document_type, document_name, file_path, file_size, mime_type, is_verified, verified_by, uploaded_by)
SELECT a.id, 'aadhaar_card', 'Aadhaar Card - ' || up.first_name || ' ' || up.last_name,
       '/uploads/apps/' || a.application_number || '/aadhaar.pdf',
       204800, 'application/pdf', true, u2.id, u2.id
FROM applications a
JOIN user_profiles up ON up.user_id = a.customer_id
JOIN users u2 ON u2.username = 'fo.tnagar.north.1'
WHERE a.status IN ('approved','in_review')
  AND NOT EXISTS (SELECT 1 FROM application_documents ad WHERE ad.application_id = a.id AND ad.document_type = 'aadhaar_card')
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO application_documents (application_id, document_type, document_name, file_path, file_size, mime_type, is_verified, verified_by, uploaded_by)
SELECT a.id, 'pan_card', 'PAN Card - ' || up.first_name || ' ' || up.last_name,
       '/uploads/apps/' || a.application_number || '/pan.pdf',
       102400, 'application/pdf', true, u2.id, u2.id
FROM applications a
JOIN user_profiles up ON up.user_id = a.customer_id
JOIN users u2 ON u2.username = 'fo.tnagar.north.1'
WHERE a.status IN ('approved','in_review')
  AND NOT EXISTS (SELECT 1 FROM application_documents ad WHERE ad.application_id = a.id AND ad.document_type = 'pan_card')
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO application_documents (application_id, document_type, document_name, file_path, file_size, mime_type, is_verified, verified_by, uploaded_by)
SELECT a.id, 'address_proof', 'Address Proof - ' || up.first_name,
       '/uploads/apps/' || a.application_number || '/address.pdf',
       512000, 'application/pdf', true, u2.id, u2.id
FROM applications a
JOIN user_profiles up ON up.user_id = a.customer_id
JOIN users u2 ON u2.username = 'fo.tnagar.north.1'
WHERE a.status IN ('approved','in_review')
  AND NOT EXISTS (SELECT 1 FROM application_documents ad WHERE ad.application_id = a.id AND ad.document_type = 'address_proof')
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 25. VERIFICATION TASKS — sample tasks
-- ============================================================================
INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT 'TSK3000101', a.id, 'field_verification', u1.id, u2.id, 'high', 'completed',
       CURRENT_DATE - INTERVAL '6 days',
       'Field visit completed. Applicant present. Documents verified.'
FROM applications a, users u1, users u2
WHERE a.status = 'approved'
  AND u1.username = 'fo.tnagar.north.1'
  AND u2.username = 'tl.tnagar.north'
LIMIT 1
ON CONFLICT (task_number) DO NOTHING;

INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT 'TSK3000102', a.id, 'document_verification', u1.id, u2.id, 'medium', 'in_progress',
       CURRENT_DATE - INTERVAL '2 days',
       'Checking income and address documents.'
FROM applications a, users u1, users u2
WHERE a.status IN ('in_review','query_raised')
  AND u1.username = 'fo.adyar.east.1'
  AND u2.username = 'tl.adyar.east'
LIMIT 1
ON CONFLICT (task_number) DO NOTHING;

INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT 'TSK3000103', a.id, 'field_verification', u1.id, u2.id, 'high', 'assigned',
       CURRENT_DATE + INTERVAL '3 days',
       'Scheduled field visit for new applicant.'
FROM applications a, users u1, users u2
WHERE a.status = 'submitted'
  AND u1.username = 'fo.tnagar.south.1'
  AND u2.username = 'tl.tnagar.south'
LIMIT 1
ON CONFLICT (task_number) DO NOTHING;

-- ============================================================================
-- 26. VERIFICATIONS — results of verification tasks
-- ============================================================================
INSERT INTO verifications (verification_number, task_id, verification_type, result, applicant_present, address_matches, documents_verified, discrepancies, recommendation, risk_rating, officer_rating, submitted_by, submitted_at)
SELECT 'VER3000101', vt.id, 'field_verification', 'verified', true, true, ARRAY['aadhaar_card','pan_card','voter_id'], 'None', 'approve', 'low', 9, u.id, NOW() - INTERVAL '5 days'
FROM verification_tasks vt, users u
WHERE vt.task_number = 'TSK3000101'
  AND u.username = 'fo.tnagar.north.1'
ON CONFLICT (verification_number) DO NOTHING;

INSERT INTO verifications (verification_number, task_id, verification_type, result, applicant_present, address_matches, documents_verified, discrepancies, recommendation, risk_rating, officer_rating, submitted_by, submitted_at)
SELECT 'VER3000102', vt.id, 'document_verification', 'partial', true, true, ARRAY['aadhaar_card','pan_card'], 'Salary slip missing', 'query_raised', 'medium', 7, u.id, NOW() - INTERVAL '2 days'
FROM verification_tasks vt, users u
WHERE vt.task_number = 'TSK3000102'
  AND u.username = 'fo.adyar.east.1'
ON CONFLICT (verification_number) DO NOTHING;

-- ============================================================================
-- 27. EMI PAYMENTS — sample payment records
-- ============================================================================
INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount,
                           principal_component, interest_component, penalty_component,
                           payment_method, payment_date, received_by, is_verified, notes)
SELECT 'PAY3000101', l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00,
       'cash', es.paid_on, u.id, true, 'Cash payment at branch counter'
FROM loans l
JOIN emi_schedules es ON es.loan_id = l.id AND es.is_paid = true AND es.emi_number = 1
JOIN users u ON u.role = 'collection_agent'
WHERE l.status IN ('active','completed')
LIMIT 1
ON CONFLICT (payment_number) DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount,
                           principal_component, interest_component, penalty_component,
                           payment_method, payment_date, received_by, is_verified, notes)
SELECT 'PAY3000102', l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00,
       'bank_transfer', es.paid_on, u.id, true, 'NEFT from customer account'
FROM loans l
JOIN emi_schedules es ON es.loan_id = l.id AND es.is_paid = true AND es.emi_number = 2
JOIN users u ON u.role = 'collection_agent'
WHERE l.status IN ('active','completed')
LIMIT 1
ON CONFLICT (payment_number) DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount,
                           principal_component, interest_component, 500.00,
                           payment_method, payment_date, received_by, is_verified, notes)
SELECT 'PAY3000103', l.id, es.id, l.customer_id, es.emi_amount + 500.00, es.principal, es.interest,
       'cash', es.paid_on, u.id, true, 'Late payment with Rs.500 penalty'
FROM loans l
JOIN emi_schedules es ON es.loan_id = l.id AND es.is_paid = true
JOIN users u ON u.role = 'collection_agent'
WHERE l.status = 'active'
LIMIT 1
ON CONFLICT (payment_number) DO NOTHING;

-- ============================================================================
-- 28. PAYMENT RECEIPTS — receipts for payments
-- ============================================================================
INSERT INTO payment_receipts (receipt_number, emi_payment_id, loan_id, customer_id, receipt_amount, receipt_date, receipt_type, is_emailed, is_sms_sent)
SELECT 'RCP3000101', ep.id, ep.loan_id, ep.customer_id, ep.payment_amount, ep.payment_date, 'emi', true, true
FROM emi_payments ep WHERE ep.payment_number = 'PAY3000101'
ON CONFLICT (receipt_number) DO NOTHING;

INSERT INTO payment_receipts (receipt_number, emi_payment_id, loan_id, customer_id, receipt_amount, receipt_date, receipt_type, is_emailed, is_sms_sent)
SELECT 'RCP3000102', ep.id, ep.loan_id, ep.customer_id, ep.payment_amount, ep.payment_date, 'emi', true, true
FROM emi_payments ep WHERE ep.payment_number = 'PAY3000102'
ON CONFLICT (receipt_number) DO NOTHING;

INSERT INTO payment_receipts (receipt_number, emi_payment_id, loan_id, customer_id, receipt_amount, receipt_date, receipt_type, is_emailed, is_sms_sent)
SELECT 'RCP3000103', ep.id, ep.loan_id, ep.customer_id, ep.payment_amount, ep.payment_date, 'partial', true, true
FROM emi_payments ep WHERE ep.payment_number = 'PAY3000103'
ON CONFLICT (receipt_number) DO NOTHING;

-- ============================================================================
-- 29. PENALTIES — sample penalty records
-- ============================================================================
INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type,
                        penalty_amount, waived_amount, final_amount, penalty_date, due_date, is_paid)
SELECT 'PEN3000101', l.id, es.id, l.customer_id, 'late_payment', 500.00, 0.00, 500.00,
       es.due_date + INTERVAL '5 days', es.due_date, true
FROM loans l
JOIN emi_schedules es ON es.loan_id = l.id AND es.is_paid = true AND es.emi_number = 4
WHERE l.status = 'active'
LIMIT 1
ON CONFLICT (penalty_number) DO NOTHING;

INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type,
                        penalty_amount, waived_amount, final_amount, penalty_date, due_date, is_paid)
SELECT 'PEN3000102', l.id, es.id, l.customer_id, 'late_payment', 200.00, 0.00, 200.00,
       es.due_date + INTERVAL '3 days', es.due_date, true
FROM loans l
JOIN emi_schedules es ON es.loan_id = l.id AND es.is_paid = true AND es.emi_number = 3
WHERE l.status = 'active'
LIMIT 1
ON CONFLICT (penalty_number) DO NOTHING;

-- ============================================================================
-- 30. DISBURSEMENT CHARGES — line items for each disbursement
-- ============================================================================
INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head,
                                   calculation_type, base_amount, rate_pct, flat_amount,
                                   charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT 'CHG3000101', d.id, 'processing_fee', 'Loan Processing Fee', 'percentage',
       d.loan_amount, 2.00, NULL,
       ROUND(d.loan_amount * 0.02, 2),
       9.00, ROUND(d.loan_amount * 0.02 * 0.09, 2), 9.00, ROUND(d.loan_amount * 0.02 * 0.09, 2),
       ROUND(d.loan_amount * 0.02 * 1.18, 2)
FROM disbursements d
WHERE d.status = 'completed'
LIMIT 1
ON CONFLICT (charge_number) DO NOTHING;

INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head,
                                   calculation_type, base_amount, rate_pct, flat_amount,
                                   charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT 'CHG3000102', d.id, 'document_charge', 'Document Charge', 'flat',
       d.loan_amount, NULL, 250.00,
       250.00, 0.00, 0.00, 0.00, 0.00, 250.00
FROM disbursements d
WHERE d.status = 'completed'
LIMIT 1
ON CONFLICT (charge_number) DO NOTHING;

-- ============================================================================
-- 31. STAGE TRANSITIONS — application stage movement records
-- ============================================================================
INSERT INTO stage_transitions (application_id, from_stage_id, to_stage_id, action, performed_by, remarks)
SELECT a.id, s1.id, s2.id, 'complete', u.id, 'Moved to document verification'
FROM applications a, stages s1, stages s2, users u
WHERE a.status IN ('submitted','in_review','approved')
  AND s1.code = 'new_application'
  AND s2.code = 'document_verification'
  AND u.role = 'field_officer'
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO stage_transitions (application_id, from_stage_id, to_stage_id, action, performed_by, remarks)
SELECT a.id, s1.id, s2.id, 'complete', u.id, 'Moved to credit assessment'
FROM applications a, stages s1, stages s2, users u
WHERE a.status IN ('in_review','approved')
  AND s1.code = 'document_verification'
  AND s2.code = 'credit_assessment'
  AND u.role = 'team_leader'
LIMIT 3
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 32. APPROVAL HISTORY — sample approval records
-- ============================================================================
INSERT INTO approval_history (application_id, level, approver_id, role_at_time, limit_amount, action, remarks)
SELECT a.id, 1, u.id, 'team_leader', 100000.00, 'approved',
       'Field visit completed. Applicant verified. Good repayment history. Recommending approval.'
FROM applications a, users u
WHERE a.status = 'approved'
  AND u.role = 'team_leader'
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO approval_history (application_id, level, approver_id, role_at_time, limit_amount, action, remarks)
SELECT a.id, 2, u.id, 'branch_admin', 500000.00, 'approved', 'Documents in order. Approved within branch limit.'
FROM applications a, users u
WHERE a.status = 'approved'
  AND u.role = 'branch_admin'
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO approval_history (application_id, level, approver_id, role_at_time, limit_amount, action, remarks)
SELECT a.id, 1, u.id, 'branch_admin', 500000.00, 'rejected',
       'Low CIBIL score and insufficient household income for requested amount.'
FROM applications a, users u
WHERE a.status = 'rejected'
  AND u.role = 'branch_admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 33. REFERRALS — sample referral records
-- ============================================================================
INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT 'REF3000101', u.id, 'Karthik Bala', '9500000101', 'Anna Nagar Chennai', 'pending',
       'Referred by existing customer. Interested in personal loan.'
FROM users u WHERE u.username = 'cust.murugan.r'
ON CONFLICT (referral_number) DO NOTHING;

INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT 'REF3000102', u.id, 'Vijay Anand', '9500000102', 'T Nagar Chennai', 'contacted',
       'Contacted via phone. Scheduled for field visit.'
FROM users u WHERE u.username = 'cust.lakshmi.s'
ON CONFLICT (referral_number) DO NOTHING;

INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT 'REF3000103', u.id, 'Deepa Raman', '9500000103', 'Adyar Chennai', 'applied',
       'Has applied for business loan. Documents under review.'
FROM users u WHERE u.username = 'cust.geetha.r'
ON CONFLICT (referral_number) DO NOTHING;

-- ============================================================================
-- 34. TRUST SCORES — sample trust score records
-- ============================================================================
INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, factors, calculated_by, notes)
SELECT u.id, a.id, 85, 78, 90, 85, 'A',
       "{"occupation_stability":20,"neighbourhood_reputation":18,"repayment_history":30}"::jsonb,
       tl.id, 'Excellent repayment history. Good community standing.'
FROM users u, applications a, users tl
WHERE u.username = 'cust.murugan.r'
  AND a.customer_id = u.id
  AND tl.username = 'tl.tnagar.north'
ON CONFLICT DO NOTHING;

INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, factors, calculated_by, notes)
SELECT u.id, a.id, 72, 65, 80, 72, 'B',
       "{"occupation_stability":15,"neighbourhood_reputation":14,"repayment_history":25}"::jsonb,
       tl.id, 'Good history. Minor concern about income volatility.'
FROM users u, applications a, users tl
WHERE u.username = 'cust.geetha.r'
  AND a.customer_id = u.id
  AND tl.username = 'tl.tnagar.north'
ON CONFLICT DO NOTHING;

INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, factors, calculated_by, notes)
SELECT u.id, a.id, 88, 82, 95, 88, 'A',
       "{"occupation_stability":22,"neighbourhood_reputation":20,"repayment_history":30}"::jsonb,
       tl.id, 'Strong endorsements from community.'
FROM users u, applications a, users tl
WHERE u.username = 'cust.pooja.s'
  AND a.customer_id = u.id
  AND tl.username = 'tl.adyar.east'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 35. SMS LOGS — sample SMS records
-- ============================================================================
INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT 'SMS3000101', u.phone, up.first_name || ' ' || up.last_name,
       'Dear ' || up.first_name || ', your loan EMI is due on ' || TO_CHAR(es.due_date, 'YYYY-MM-DD') || '. Please pay to avoid late fees.',
       'delivered', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '30 seconds'
FROM emi_schedules es
JOIN loans l ON l.id = es.loan_id
JOIN users u ON u.id = l.customer_id
JOIN user_profiles up ON up.user_id = u.id
WHERE es.is_paid = true AND es.emi_number = 1
LIMIT 1
ON CONFLICT (sms_number) DO NOTHING;

INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT 'SMS3000102', u.phone, up.first_name || ' ' || up.last_name,
       'Dear ' || up.first_name || ', your application ' || a.application_number || ' has been APPROVED.',
       'delivered', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '45 seconds'
FROM applications a
JOIN users u ON u.id = a.customer_id
JOIN user_profiles up ON up.user_id = u.id
WHERE a.status = 'approved'
LIMIT 1
ON CONFLICT (sms_number) DO NOTHING;

INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT 'SMS3000103', u.phone, up.first_name || ' ' || up.last_name,
       'Dear ' || up.first_name || ', your EMI is OVERDUE. Please pay immediately to avoid penalties.',
       'sent', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '20 seconds'
FROM loans l
JOIN emi_schedules es ON es.loan_id = l.id AND es.is_overdue = true
JOIN users u ON u.id = l.customer_id
JOIN user_profiles up ON up.user_id = u.id
LIMIT 1
ON CONFLICT (sms_number) DO NOTHING;

-- ============================================================================
-- 36. EMAIL LOGS — sample email records
-- ============================================================================
INSERT INTO email_logs (email_number, recipient_email, recipient_name, subject, body_html, body_text, status, sent_at, opened_at)
SELECT 'EML3000101', u.email, up.first_name || ' ' || up.last_name,
       'Your Loan Disbursement Statement | CMF',
       '<h2>Dear ' || up.first_name || ',</h2><p>Your loan has been disbursed.</p><p>Your EMI schedule is attached.</p><br><p>Regards,<br>CMF Team</p>',
       'Dear ' || up.first_name || ', your loan has been disbursed.',
       'sent', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '60 days' + INTERVAL '2 hours'
FROM loans l
JOIN users u ON u.id = l.customer_id
JOIN user_profiles up ON up.user_id = u.id
WHERE l.status IN ('active','completed')
LIMIT 1
ON CONFLICT (email_number) DO NOTHING;

INSERT INTO email_logs (email_number, recipient_email, recipient_name, subject, body_html, body_text, status, sent_at, opened_at)
SELECT 'EML3000102', u.email, up.first_name || ' ' || up.last_name,
       'Your EMI Payment Receipt | CMF',
       '<h2>Dear ' || up.first_name || ',</h2><p>Thank you for your EMI payment.</p><br><p>Regards,<br>CMF Team</p>',
       'Dear ' || up.first_name || ', thank you for your EMI payment.',
       'sent', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days' + INTERVAL '3 hours'
FROM emi_payments ep
JOIN users u ON u.id = ep.customer_id
JOIN user_profiles up ON up.user_id = u.id
LIMIT 1
ON CONFLICT (email_number) DO NOTHING;

-- ============================================================================
-- 37. AUDIT LOGS — sample audit records
-- ============================================================================
INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT 'AUD3000101', u.id, 'application.created', 'application', a.id, a.application_number,
       '10.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
FROM applications a, users u
WHERE u.username = 'fo.tnagar.north.1'
  AND a.status = 'approved'
LIMIT 1
ON CONFLICT (audit_number) DO NOTHING;

INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT 'AUD3000102', u.id, 'application.approved', 'application', a.id, a.application_number,
       '10.0.1.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
FROM applications a, users u
WHERE u.username = 'branch.tnagar'
  AND a.status = 'approved'
LIMIT 1
ON CONFLICT (audit_number) DO NOTHING;

INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT 'AUD3000103', u.id, 'loan.disbursed', 'loan', l.id, l.loan_number,
       '10.0.1.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
FROM loans l, users u
WHERE u.username = 'branch.tnagar'
  AND l.status IN ('active','completed')
LIMIT 1
ON CONFLICT (audit_number) DO NOTHING;

-- ============================================================================
-- 38. BANK STATEMENT ENTRIES — sample bank transactions
-- ============================================================================
INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref,
                                     debit_amount, credit_amount, balance, entry_type)
SELECT b.id, v.dt, v.desc, v.ref, v.debit, v.credit, v.bal, 'manual'
FROM bank_accounts b
CROSS JOIN (VALUES
    (CURRENT_DATE,             'Salary Deposit - CMF Payroll',    'TXN20261001001', 45000.00, 0.00,     b.current_balance + 45000.00),
    (CURRENT_DATE - INTERVAL '1 day', 'EMI Collection',               'TXN20261001002', 0.00,    7202.00,  b.current_balance + 45000.00 + 7202.00),
    (CURRENT_DATE - INTERVAL '2 days','Office Rent Payment',           'TXN20261002001', 15000.00, 0.00,     b.current_balance + 45000.00 + 7202.00 - 15000.00),
    (CURRENT_DATE - INTERVAL '3 days','Late Fee Received',             'TXN20261002002', 0.00,    500.00,   b.current_balance + 45000.00 + 7202.00 - 15000.00 + 500.00),
    (CURRENT_DATE - INTERVAL '4 days','NEFT Disbursement',             'TXN20261003001', 98500.00, 0.00,     b.current_balance + 45000.00 + 7202.00 - 15000.00 + 500.00 - 98500.00)
) AS v(dt, desc, ref, debit, credit, bal)
WHERE b.account_code = 'BNK1000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 39. BANK RECONCILIATIONS — sample reconciliation
-- ============================================================================
INSERT INTO bank_reconciliations (reconciliation_number, bank_account_id, from_date, to_date,
                                   bank_closing_balance, book_closing_balance, difference,
                                   is_completed, reconciled_by, notes)
SELECT 'REC3000101', b.id, DATE_TRUNC('month', CURRENT_DATE)::date,
       (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
       b.current_balance, b.current_balance + 3500.00, -3500.00, false, u.id,
       'Pending: cheque not yet cleared in bank'
FROM bank_accounts b, users u
WHERE b.account_code = 'BNK1000001'
  AND u.username = 'branch.tnagar'
ON CONFLICT (reconciliation_number) DO NOTHING;

-- ============================================================================
-- 40. LEDGER ACCOUNT BALANCES — populate for current date
-- ============================================================================
INSERT INTO ledger_account_balances (account_id, as_of_date, opening_balance, total_debit, total_credit, closing_balance)
SELECT la.id, CURRENT_DATE, la.opening_balance, 0, 0, la.current_balance
FROM ledger_accounts la
WHERE NOT EXISTS (
    SELECT 1 FROM ledger_account_balances lab
    WHERE lab.account_id = la.id AND lab.as_of_date = CURRENT_DATE
);

-- ============================================================================
-- 41. LOGIN AUDIT — sample login records
-- ============================================================================
INSERT INTO login_audit (user_id, login_at, logout_at, ip_address, user_agent, success)
SELECT u.id, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days' + INTERVAL '8 hours',
       '10.0.0.12', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', true
FROM users u WHERE u.username = 'branch.tnagar'
ON CONFLICT DO NOTHING;

INSERT INTO login_audit (user_id, login_at, ip_address, user_agent, success, failure_reason)
SELECT u.id, CURRENT_DATE - INTERVAL '1 day', '10.0.0.20',
       'Mozilla/5.0 (iPhone; CPU iPhone OS)', false, 'Invalid password'
FROM users u WHERE u.username = 'fo.velachery.south.2'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 42. USER PERMISSION OVERRIDES — sample granular override
-- ============================================================================
INSERT INTO user_permission_overrides (user_id, permission_id, is_granted, reason, granted_by, granted_at)
SELECT u.id, p.id, false, 'Restricted: field officers cannot delete branches', u2.id, NOW()
FROM users u, permissions p, users u2
WHERE u.username = 'fo.tnagar.north.1'
  AND p.name = 'branches.delete'
  AND u2.username = 'branch.tnagar'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 43. NPA CLASSIFICATIONS — sample NPA record
-- ============================================================================
INSERT INTO npa_classifications (npa_number, loan_id, customer_id, classification_date,
                                   overdue_days, overdue_amount, npa_category,
                                   substandard_days, provision_amount, provision_pct, action_taken, is_active)
SELECT 'NPA3000101', l.id, l.customer_id, CURRENT_DATE, 90, l.outstanding_principal,
       'sub_standard', 90, ROUND(l.outstanding_principal * 0.15, 2), 15.00,
       'Personal call and field visit completed. Awaiting recovery.', true
FROM loans l
WHERE l.status = 'active'
ORDER BY l.outstanding_principal DESC
LIMIT 1
ON CONFLICT (npa_number) DO NOTHING;

-- ============================================================================
-- 44. PASSWORD RESET TOKENS — sample tokens
-- ============================================================================
INSERT INTO password_reset_tokens (user_id, token, expires_at, used_at, ip_address)
SELECT u.id, 'prt_' || SUBSTRING(MD5(u.email || NOW()::text), 1, 32),
       NOW() + INTERVAL '10 minutes', NOW(), '10.0.0.5'
FROM users u
WHERE u.username IN ('cust.murugan.r', 'cust.lakshmi.s')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================
DO $$
DECLARE
    v INT;
BEGIN
    SELECT COUNT(*) INTO v FROM branches;                RAISE NOTICE 'Branches: %', v;
    SELECT COUNT(*) INTO v FROM areas;                    RAISE NOTICE 'Areas: %', v;
    SELECT COUNT(*) INTO v FROM roles;                    RAISE NOTICE 'Roles: %', v;
    SELECT COUNT(*) INTO v FROM permissions;              RAISE NOTICE 'Permissions: %', v;
    SELECT COUNT(*) INTO v FROM role_permissions;         RAISE NOTICE 'Role-Permissions: %', v;
    SELECT COUNT(*) INTO v FROM users WHERE is_active;    RAISE NOTICE 'Active Users: %', v;
    SELECT COUNT(*) INTO v FROM user_profiles;            RAISE NOTICE 'User Profiles: %', v;
    SELECT COUNT(*) INTO v FROM user_areas;               RAISE NOTICE 'User-Area Assignments: %', v;
    SELECT COUNT(*) INTO v FROM loan_products;            RAISE NOTICE 'Loan Products: %', v;
    SELECT COUNT(*) INTO v FROM product_slabs;            RAISE NOTICE 'Product Slabs: %', v;
    SELECT COUNT(*) INTO v FROM bank_accounts;            RAISE NOTICE 'Bank Accounts: %', v;
    SELECT COUNT(*) INTO v FROM ledger_accounts;          RAISE NOTICE 'Ledger Accounts: %', v;
    SELECT COUNT(*) INTO v FROM applications;             RAISE NOTICE 'Applications: %', v;
    SELECT COUNT(*) INTO v FROM application_topics;       RAISE NOTICE 'Application Topics: %', v;
    SELECT COUNT(*) INTO v FROM loans;                    RAISE NOTICE 'Loans: %', v;
    SELECT COUNT(*) INTO v FROM emi_schedules;            RAISE NOTICE 'EMI Schedules: %', v;
    SELECT COUNT(*) INTO v FROM disbursements;            RAISE NOTICE 'Disbursements: %', v;
    SELECT COUNT(*) INTO v FROM emi_payments;             RAISE NOTICE 'EMI Payments: %', v;
    SELECT COUNT(*) INTO v FROM penalties;                RAISE NOTICE 'Penalties: %', v;
    SELECT COUNT(*) INTO v FROM sms_templates;            RAISE NOTICE 'SMS Templates: %', v;
    SELECT COUNT(*) INTO v FROM email_templates;          RAISE NOTICE 'Email Templates: %', v;
    SELECT COUNT(*) INTO v FROM approval_limits;          RAISE NOTICE 'Approval Limits: %', v;
    SELECT COUNT(*) INTO v FROM verification_tasks;       RAISE NOTICE 'Verification Tasks: %', v;
    SELECT COUNT(*) INTO v FROM referrals;                RAISE NOTICE 'Referrals: %', v;
    SELECT COUNT(*) INTO v FROM trust_scores;             RAISE NOTICE 'Trust Scores: %', v;
    SELECT COUNT(*) INTO v FROM ledger_entries;           RAISE NOTICE 'Ledger Entries: %', v;
    SELECT COUNT(*) INTO v FROM bank_statement_entries;   RAISE NOTICE 'Bank Statement Entries: %', v;
    SELECT COUNT(*) INTO v FROM sms_logs;                 RAISE NOTICE 'SMS Logs: %', v;
    SELECT COUNT(*) INTO v FROM email_logs;               RAISE NOTICE 'Email Logs: %', v;
    SELECT COUNT(*) INTO v FROM audit_logs;               RAISE NOTICE 'Audit Logs: %', v;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  SEED DATA COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
END $$;
