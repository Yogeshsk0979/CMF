-- ============================================================================
-- CMF Microfinance Platform — Chennai Office Seed Data
-- ============================================================================
-- Branch codes: CHN01 (Chennai HQ), CHN02 (T Nagar), CHN03 (Adyar), CHN04 (Velachery)
-- All passwords: crypt('password123', gen_salt('bf'))
-- 12 staff (1 SA + 1 BA + 3 TL + 5 FO + 3 CA) | 50 customers | 5 apps | 3 loans | 24 EMIs each
-- ============================================================================

-- ============================================================================
-- SECTION 1: ROLES
-- ============================================================================

INSERT INTO roles (name, display_name, description, is_system_role)
SELECT 'super_admin',    'Super Admin',     'Full system access',                         true  WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');
INSERT INTO roles (name, display_name, description, is_system_role)
SELECT 'branch_admin',   'Branch Admin',    'Branch-level management',                   true  WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'branch_admin');
INSERT INTO roles (name, display_name, description, is_system_role)
SELECT 'team_leader',    'Team Leader',     'Area and team management',                  true  WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'team_leader');
INSERT INTO roles (name, display_name, description, is_system_role)
SELECT 'field_officer',  'Field Officer',   'Application creation and field verification', true WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'field_officer');
INSERT INTO roles (name, display_name, description, is_system_role)
SELECT 'collection_agent', 'Collection Agent','EMI collection',                           true  WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'collection_agent');
INSERT INTO roles (name, display_name, description, is_system_role)
SELECT 'customer',       'Customer',        'End user / borrower',                       true  WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'customer');
INSERT INTO roles (name, display_name, description, is_system_role)
SELECT 'lender',         'Lender',          'Investor / funder',                         true  WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'lender');

-- ============================================================================
-- SECTION 2: PERMISSIONS
-- ============================================================================

INSERT INTO permissions (name, display_name, module, description)
SELECT 'dashboard.view',         'View Dashboard',           'dashboard', 'Access to role-specific dashboard'               WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'dashboard.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'branches.view',          'View Branches',            'branches', 'View branch list'                                WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'branches.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'branches.create',        'Create Branch',            'branches', 'Create new branches'                             WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'branches.create');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'branches.edit',          'Edit Branch',              'branches', 'Edit branch details'                             WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'branches.edit');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'areas.view',             'View Areas',               'areas',    'View area list'                                  WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'areas.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'areas.create',           'Create Area',              'areas',    'Create new areas'                                WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'areas.create');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'areas.edit',             'Edit Area',                'areas',    'Edit area details'                               WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'areas.edit');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'areas.assign',           'Assign Leaders',           'areas',    'Assign area leaders and agents'                  WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'areas.assign');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'users.view',             'View Users',               'users',    'View user list'                                  WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'users.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'users.create',           'Create User',              'users',    'Create new users'                                WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'users.create');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'users.edit',             'Edit User',                'users',    'Edit user details'                               WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'users.edit');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'products.view',          'View Products',            'products', 'View loan products'                              WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'products.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'products.create',        'Create Product',           'products', 'Create loan products'                            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'products.create');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'products.edit',          'Edit Product',             'products', 'Edit loan products'                              WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'products.edit');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'applications.view',      'View Applications',        'applications', 'View applications'                           WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'applications.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'applications.create',    'Create Application',       'applications', 'Create loan applications'                    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'applications.create');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'applications.review',    'Review Application',       'applications', 'Review applications'                         WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'applications.review');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'applications.approve',   'Approve Application',      'applications', 'Approve applications'                        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'applications.approve');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'applications.reject',    'Reject Application',       'applications', 'Reject applications'                         WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'applications.reject');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'disbursements.view',     'View Disbursements',       'disbursements', 'View disbursements'                         WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'disbursements.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'disbursements.create',   'Create Disbursement',      'disbursements', 'Initiate disbursement'                      WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'disbursements.create');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'disbursements.approve',  'Approve Disbursement',     'disbursements', 'Approve disbursement'                       WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'disbursements.approve');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'emi.view',               'View EMI',                 'emi',      'View EMI schedules'                             WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'emi.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'emi.collect',            'Collect EMI',              'emi',      'Record EMI payments'                            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'emi.collect');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'emi.writeoff',           'Write Off Loan',           'emi',      'Write off loans'                                WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'emi.writeoff');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'ledger.view',            'View Ledger',              'ledger',   'View ledger entries'                            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'ledger.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'ledger.create',          'Create Entry',             'ledger',   'Create manual entries'                          WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'ledger.create');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'banks.view',             'View Bank Accounts',       'banks',    'View bank accounts'                             WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'banks.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'banks.manage',           'Manage Bank Accounts',     'banks',    'Manage bank accounts'                           WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'banks.manage');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'tasks.view',             'View Tasks',               'tasks',    'View assigned tasks'                            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'tasks.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'tasks.assign',           'Assign Tasks',             'tasks',    'Assign tasks'                                   WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'tasks.assign');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'sms.send',               'Send SMS',                 'sms',      'Send SMS messages'                              WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'sms.send');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'sms.templates',          'Manage SMS Templates',     'sms',      'Manage SMS templates'                           WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'sms.templates');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'email.send',             'Send Email',               'email',    'Send emails'                                    WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'email.send');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'email.templates',        'Manage Email Templates',   'email',    'Manage email templates'                         WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'email.templates');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'reports.view',           'View Reports',             'reports',  'View all reports'                               WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'reports.view');
INSERT INTO permissions (name, display_name, module, description)
SELECT 'settings.manage',        'Manage Settings',          'settings', 'Manage system settings'                         WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'settings.manage');

-- ============================================================================
-- SECTION 3: ROLE-PERMISSION MAPPING
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
-- SECTION 4: BRANCHES (Chennai HQ + 3 sub-branches)
-- ============================================================================

INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email, manager_id)
SELECT 'CHN01', 'Chennai HQ', 'head_office', 'No. 1, Anna Salai, Chennai', 'Chennai', 'Tamil Nadu', '600001', '+91-44-10000001', 'hq@cmf.in', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_code = 'CHN01');

INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email, manager_id)
SELECT 'CHN02', 'T Nagar Branch', 'branch', 'No. 42, Anna Salai, T Nagar', 'Chennai', 'Tamil Nadu', '600017', '+91-44-23450001', 'tnagar@cmf.in', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_code = 'CHN02');

INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email, manager_id)
SELECT 'CHN03', 'Adyar Branch', 'branch', 'No. 15, 2nd Avenue, Adyar', 'Chennai', 'Tamil Nadu', '600020', '+91-44-23450002', 'adyar@cmf.in', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_code = 'CHN03');

INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email, manager_id)
SELECT 'CHN04', 'Velachery Branch', 'branch', 'No. 88, Velachery Main Road', 'Chennai', 'Tamil Nadu', '600042', '+91-44-23450003', 'velachery@cmf.in', NULL
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE branch_code = 'CHN04');

-- ============================================================================
-- SECTION 5: AREAS
-- ============================================================================

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'CHN001', 'T Nagar', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN02'), 'Chennai', '600017', 13.0418, 80.2341
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'CHN001');

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'CHN002', 'Adyar', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN03'), 'Chennai', '600020', 13.0067, 80.2570
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'CHN002');

INSERT INTO areas (area_code, area_name, area_type, branch_id, city, pincode, latitude, longitude)
SELECT 'CHN003', 'Velachery', 'urban', (SELECT id FROM branches WHERE branch_code = 'CHN04'), 'Chennai', '600042', 12.9815, 80.2180
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE area_code = 'CHN003');

-- ============================================================================
-- SECTION 6: SUPER ADMIN USER
-- ============================================================================

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified)
SELECT generate_id('CMF'), 'admin', 'admin@cmf.in', '+919876543210',
    crypt('password123', gen_salt('bf')), 'super_admin', true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Super', 'Administrator', true FROM users WHERE username = 'admin'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

-- ============================================================================
-- SECTION 7: 3 TEAM LEADERS
-- ============================================================================

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'tl.tnagar', 'tl.tnagar@cmf.in', '+919876550001', crypt('password123', gen_salt('bf')), 'team_leader', true, true, true, true, (SELECT id FROM branches WHERE branch_code = 'CHN02')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tl.tnagar');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Karthik', 'Subramanian', true FROM users WHERE username = 'tl.tnagar'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'tl.adyar', 'tl.adyar@cmf.in', '+919876550002', crypt('password123', gen_salt('bf')), 'team_leader', true, true, true, true, (SELECT id FROM branches WHERE branch_code = 'CHN03')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tl.adyar');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Senthil', 'Krishnan', true FROM users WHERE username = 'tl.adyar'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
SELECT generate_id('CMF'), 'tl.velachery', 'tl.velachery@cmf.in', '+919876550003', crypt('password123', gen_salt('bf')), 'team_leader', true, true, true, true, (SELECT id FROM branches WHERE branch_code = 'CHN04')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tl.velachery');

INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed)
SELECT id, 'Meena', 'Gopal', true FROM users WHERE username = 'tl.velachery'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = users.id);

-- ============================================================================
-- SECTION 8: 5 FIELD OFFICERS
-- ============================================================================

DO $$
DECLARE
    v_branch_id UUID; v_user_id UUID; i INTEGER;
    names TEXT[] := ARRAY['Vijay,Prakash','Lakshmi,Narayanan','Ramesh,Chandran','Divya,Sekar','Manoj,Kumar'];
    usernames TEXT[] := ARRAY['fo.tn1','fo.ad1','fo.ve1','fo.tn2','fo.ad2'];
    phones TEXT[] := ARRAY['+919876551001','+919876551005','+919876551009','+919876551002','+919876551006'];
    bcodes TEXT[] := ARRAY['CHN02','CHN03','CHN04','CHN02','CHN03'];
    fn TEXT; ln TEXT;
BEGIN
    FOR i IN 1..5 LOOP
        fn := split_part(names[i], ',', 1); ln := split_part(names[i], ',', 2);
        SELECT id INTO v_branch_id FROM branches WHERE branch_code = bcodes[i];
        INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
        SELECT generate_id('CMF'), usernames[i], usernames[i]||'@cmf.in', phones[i],
            crypt('password123', gen_salt('bf')), 'field_officer', true, true, true, true, v_branch_id
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = usernames[i])
        RETURNING id INTO v_user_id;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed) VALUES (v_user_id, fn, ln, true);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 9: 3 COLLECTION AGENTS
-- ============================================================================

DO $$
DECLARE
    v_branch_id UUID; v_user_id UUID; i INTEGER;
    names TEXT[] := ARRAY['Murali,Krishnan','Padma,Lakshmi','Balaji,Raman'];
    usernames TEXT[] := ARRAY['ca.tn1','ca.ad1','ca.ve1'];
    phones TEXT[] := ARRAY['+919876552001','+919876552003','+919876552005'];
    bcodes TEXT[] := ARRAY['CHN02','CHN03','CHN04'];
    fn TEXT; ln TEXT;
BEGIN
    FOR i IN 1..3 LOOP
        fn := split_part(names[i], ',', 1); ln := split_part(names[i], ',', 2);
        SELECT id INTO v_branch_id FROM branches WHERE branch_code = bcodes[i];
        INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
        SELECT generate_id('CMF'), usernames[i], usernames[i]||'@cmf.in', phones[i],
            crypt('password123', gen_salt('bf')), 'collection_agent', true, true, true, true, v_branch_id
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = usernames[i])
        RETURNING id INTO v_user_id;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO user_profiles (user_id, first_name, last_name, profile_completed) VALUES (v_user_id, fn, ln, true);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 10: USER-AREA ASSIGNMENTS
-- ============================================================================

DO $$
DECLARE tl RECORD; ar RECORD;
BEGIN
    FOR tl IN SELECT u.id, u.branch_id FROM users u WHERE u.role = 'team_leader' LOOP
        SELECT id INTO ar FROM areas WHERE branch_id = tl.branch_id LIMIT 1;
        IF ar IS NOT NULL THEN INSERT INTO user_areas (user_id, area_id, is_primary) VALUES (tl.id, ar.id, true) ON CONFLICT DO NOTHING; END IF;
    END LOOP;
END $$;

DO $$
DECLARE fo RECORD; ar RECORD;
BEGIN
    FOR fo IN SELECT u.id, u.branch_id FROM users u WHERE u.role = 'field_officer' LOOP
        FOR ar IN SELECT id FROM areas WHERE branch_id = fo.branch_id LOOP
            INSERT INTO user_areas (user_id, area_id, is_primary) VALUES (fo.id, ar.id, false) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

DO $$
DECLARE ca RECORD; ar RECORD;
BEGIN
    FOR ca IN SELECT u.id, u.branch_id FROM users u WHERE u.role = 'collection_agent' LOOP
        FOR ar IN SELECT id FROM areas WHERE branch_id = ca.branch_id LOOP
            INSERT INTO user_areas (user_id, area_id, is_primary) VALUES (ca.id, ar.id, false) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 11: LOAN PRODUCTS
-- ============================================================================

INSERT INTO loan_products (product_code, product_name, category, description,
    min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months,
    min_interest_rate, max_interest_rate, interest_type,
    processing_fee_type, processing_fee_value, processing_fee_min, processing_fee_max,
    document_charge_type, document_charge_value, insurance_type, insurance_value,
    disbursement_mode, prepayment_allowed, foreclosure_allowed, foreclosure_charge_pct,
    late_payment_penalty_type, late_payment_penalty_value, late_payment_grace_days, is_active)
SELECT 'IL001', 'Individual Loan', 'personal', 'Individual microfinance loan for personal needs',
    5000, 200000, 6, 36, 18.00, 18.00, 'reducing',
    'percentage', 1.5, 500, 3000, 'flat', 500, 'none', 0,
    'bank_transfer', true, true, 2.0, 'flat', 500, 7, true
WHERE NOT EXISTS (SELECT 1 FROM loan_products WHERE product_code = 'IL001');

INSERT INTO loan_products (product_code, product_name, category, description,
    min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months,
    min_interest_rate, max_interest_rate, interest_type,
    processing_fee_type, processing_fee_value, processing_fee_min, processing_fee_max,
    document_charge_type, document_charge_value, insurance_type, insurance_value,
    disbursement_mode, prepayment_allowed, foreclosure_allowed, foreclosure_charge_pct,
    late_payment_penalty_type, late_payment_penalty_value, late_payment_grace_days, is_active)
SELECT 'GL001', 'Group Loan', 'group', 'Group liability microfinance loan for self-help groups',
    10000, 500000, 12, 60, 16.00, 16.00, 'reducing',
    'percentage', 1.0, 1000, 5000, 'flat', 500, 'none', 0,
    'bank_transfer', true, true, 2.0, 'flat', 500, 7, true
WHERE NOT EXISTS (SELECT 1 FROM loan_products WHERE product_code = 'GL001');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'IL001-1', 'Small (5K-50K)', 1, 5000, 50000, 18.00, 1.5, 500, true FROM loan_products WHERE product_code = 'IL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'IL001-1');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'IL001-2', 'Large (50K-2L)', 2, 50001, 200000, 18.00, 2.0, 1000, true FROM loan_products WHERE product_code = 'IL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'IL001-2');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'GL001-1', 'Standard (10K-2L)', 1, 10000, 200000, 16.00, 1.0, 500, true FROM loan_products WHERE product_code = 'GL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'GL001-1');

INSERT INTO product_slabs (product_id, slab_code, slab_name, slab_order, min_amount, max_amount, interest_rate, processing_fee_pct, document_charge, is_active)
SELECT id, 'GL001-2', 'Premium (2L-5L)', 2, 200001, 500000, 16.00, 1.5, 1000, true FROM loan_products WHERE product_code = 'GL001'
AND NOT EXISTS (SELECT 1 FROM product_slabs WHERE slab_code = 'GL001-2');

-- ============================================================================
-- SECTION 12: BANK ACCOUNTS
-- ============================================================================

INSERT INTO bank_accounts (account_code, bank_name, account_number, account_name, account_type, ifsc_code, branch_name, opening_balance, current_balance, is_primary, is_active)
SELECT 'BNK1000001', 'HDFC Bank', '50200012345678', 'Continnum Micro Finance Pvt Ltd', 'current', 'HDFC0000123', 'T Nagar', 10000000, 10000000, true, true
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_code = 'BNK1000001');

INSERT INTO bank_accounts (account_code, bank_name, account_number, account_name, account_type, ifsc_code, branch_name, opening_balance, current_balance, is_primary, is_active)
SELECT 'BNK1000002', 'ICICI Bank', '62190123456789', 'Continnum Micro Finance Pvt Ltd', 'current', 'ICIC0000456', 'Adyar', 5000000, 5000000, false, true
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_code = 'BNK1000002');

-- ============================================================================
-- SECTION 13: CHART OF ACCOUNTS (15 accounts)
-- ============================================================================

INSERT INTO ledger_accounts (account_code, account_name, account_group, account_type, is_system, opening_balance, current_balance)
VALUES
    ('1001', 'Cash in Hand',          'assets',   'direct',   true, 0,          0),
    ('1002', 'HDFC Bank Account',     'assets',   'direct',   true, 10000000,  10000000),
    ('1003', 'ICICI Bank Account',    'assets',   'direct',   true, 5000000,   5000000),
    ('1101', 'Loans Receivable',      'assets',   'direct',   true, 0,          0),
    ('1201', 'Fixed Assets',          'assets',   'direct',   true, 500000,    500000),
    ('2001', 'Capital Account',       'equity',   '',         true, 15000000,  15000000),
    ('4001', 'Interest Income',       'income',   'indirect', true, 0,          0),
    ('4002', 'Processing Fee Income', 'income',   'indirect', true, 0,          0),
    ('4003', 'Document Fee Income',   'income',   'indirect', true, 0,          0),
    ('4004', 'Late Fee Income',       'income',   'indirect', true, 0,          0),
    ('5001', 'Salary Expense',        'expenses', 'indirect', true, 0,          0),
    ('5002', 'Rent Expense',          'expenses', 'indirect', true, 0,          0),
    ('5003', 'Office Expense',        'expenses', 'indirect', true, 0,          0),
    ('5004', 'Marketing Expense',     'expenses', 'indirect', true, 0,          0),
    ('5005', 'Travel Expense',        'expenses', 'indirect', true, 0,          0)
ON CONFLICT (account_code) DO NOTHING;

-- ============================================================================
-- SECTION 14: STAGES
-- ============================================================================

INSERT INTO stages (code, name, description, stage_order, required_roles, sla_hours, is_mandatory)
VALUES
    ('draft',              'Draft',                    'Application being filled',                 1, ARRAY['field_officer'],               0,  true),
    ('submitted',          'Submitted',                'Submitted for review',                      2, ARRAY['team_leader'],               24,  true),
    ('doc_verification',   'Document Verification',    'Verify submitted documents',                3, ARRAY['field_officer','team_leader'], 24, true),
    ('field_verification', 'Field Verification',       'Physical verification at location',         4, ARRAY['field_officer'],             48,  true),
    ('credit_check',       'Credit Assessment',        'Evaluate creditworthiness',                 5, ARRAY['team_leader'],               48,  true),
    ('manager_review',     'Manager Review',           'Branch manager review',                     6, ARRAY['branch_admin'],              72,  true),
    ('approved',           'Approved',                 'Approved for disbursement',                 7, ARRAY['branch_admin','super_admin'], 24, true),
    ('disbursed',          'Disbursed',                'Loan disbursed',                            8, ARRAY['branch_admin'],              24,  true),
    ('rejected',           'Rejected',                 'Application rejected',                      9, ARRAY['branch_admin','super_admin'], 0,  false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SECTION 15: 50 CUSTOMERS (CUST1000001 – CUST1000050)
-- ============================================================================

DO $$
DECLARE
    i INTEGER; v_user_id UUID;
    first_names TEXT[] := ARRAY[
        'Arun','Bala','Chandra','Deepa','Eswari','Faizal','Ganesh','Harini','Ibrahim','Jayalakshmi',
        'Kumar','Lakshmi','Mohan','Nithya','Prakash','Queen','Rajesh','Saraswati','Tamil','Uma',
        'Venkat','Anita','Baskar','Catherine','Dinesh','Elango','Fathima','Gopal','Hema','Indra',
        'Jagan','Kavitha','Lokesh','Malathi','Nagaraj','Padma','Ravi','Shanthi','Thilak','Vani',
        'Ashok','Bhavani','Chandru','Durga','Ekambaram','Geetha','Hari','Ishwarya','Jeeva','Kala'
    ];
    last_names TEXT[] := ARRAY[
        'Kumar','Murugan','Raman','Devi','Prasad','Begum','Krishnan','Subramanian','Ahmed','Reddy',
        'Sekar','Narayanan','Gopal','Rajan','Venkatesh','Lakshmi','Babu','Shankar','Mani','Pillai',
        'Iyengar','Devi','Subramanian','William','Raj','Kumar','Syed','Ayyar','Menon','Krishnan',
        'Ravi','Sharma','Natarajan','Iyer','Naidu','Lakshmi','Chandran','Devi','Kumar','Sundaram',
        'Patel','Kannan','Muthu','Rao','Gounder','Bai','Varma','Rani','Doss','Ammal'
    ];
    genders TEXT[] := ARRAY[
        'male','female','male','female','male','female','male','female','male','female',
        'male','female','male','female','male','female','male','female','male','female',
        'male','female','male','female','male','male','female','male','female','female',
        'male','female','male','female','male','female','male','female','male','female',
        'male','female','male','female','male','female','male','female','male','female'
    ];
    phones TEXT[] := ARRAY[
        '+919000100001','+919000100002','+919000100003','+919000100004','+919000100005',
        '+919000100006','+919000100007','+919000100008','+919000100009','+919000100010',
        '+919000100011','+919000100012','+919000100013','+919000100014','+919000100015',
        '+919000100016','+919000100017','+919000100018','+919000100019','+919000100020',
        '+919000100021','+919000100022','+919000100023','+919000100024','+919000100025',
        '+919000100026','+919000100027','+919000100028','+919000100029','+919000100030',
        '+919000100031','+919000100032','+919000100033','+919000100034','+919000100035',
        '+919000100036','+919000100037','+919000100038','+919000100039','+919000100040',
        '+919000100041','+919000100042','+919000100043','+919000100044','+919000100045',
        '+919000100046','+919000100047','+919000100048','+919000100049','+919000100050'
    ];
    bcode VARCHAR(10);
BEGIN
    FOR i IN 1..50 LOOP
        IF i <= 17 THEN bcode := 'CHN02';
        ELSIF i <= 34 THEN bcode := 'CHN03';
        ELSE bcode := 'CHN04'; END IF;

        INSERT INTO users (customer_code, username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified, branch_id)
        SELECT generate_id('CMF'),
            'cust.' || LOWER(first_names[i]) || '.' || LOWER(last_names[i]),
            LOWER(first_names[i]) || '.' || LOWER(last_names[i]) || '@gmail.com',
            phones[i], crypt('password123', gen_salt('bf')), 'customer', true, true, true, true,
            (SELECT id FROM branches WHERE branch_code = bcode)
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'cust.' || LOWER(first_names[i]) || '.' || LOWER(last_names[i]))
        RETURNING id INTO v_user_id;

        IF v_user_id IS NOT NULL THEN
            INSERT INTO user_profiles (user_id, first_name, last_name, gender, profile_completed, date_of_birth)
            VALUES (v_user_id, first_names[i], last_names[i], genders[i], true, DATE '1975-01-01' + (i * 730) + (i * 30));
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 16: 5 SAMPLE APPLICATIONS
-- ============================================================================

-- APP1000001 – approved (IL001, T Nagar, 50000)
INSERT INTO applications (application_number, customer_id, product_id, branch_id, area_id, created_by,
    loan_amount, tenure_months, interest_rate, emi_amount, status, current_stage_id,
    submitted_at, approved_at, approved_by, cibil_score, eligibility_score,
    total_household_income, trust_score, notes, metadata)
SELECT 'APP1000001',
    (SELECT id FROM users WHERE customer_code = 'CUST1000001'),
    (SELECT id FROM loan_products WHERE product_code = 'IL001'),
    (SELECT id FROM branches WHERE branch_code = 'CHN02'),
    (SELECT id FROM areas WHERE area_code = 'CHN001'),
    (SELECT id FROM users WHERE username = 'fo.tn1'),
    50000, 24, 18.00, 2535.00, 'approved',
    (SELECT id FROM stages WHERE code = 'approved'),
    NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days',
    (SELECT id FROM users WHERE username = 'tl.tnagar'), 720, 85.50, 35000, 82,
    'Good repayment history. Family income stable.',
    '{"source":"walk_in","referral":false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM applications WHERE application_number = 'APP1000001');

-- APP1000002 – approved (GL001, Adyar, 150000)
INSERT INTO applications (application_number, customer_id, product_id, branch_id, area_id, created_by,
    loan_amount, tenure_months, interest_rate, emi_amount, status, current_stage_id,
    submitted_at, approved_at, approved_by, cibil_score, eligibility_score,
    total_household_income, trust_score, notes, metadata)
SELECT 'APP1000002',
    (SELECT id FROM users WHERE customer_code = 'CUST1000002'),
    (SELECT id FROM loan_products WHERE product_code = 'GL001'),
    (SELECT id FROM branches WHERE branch_code = 'CHN03'),
    (SELECT id FROM areas WHERE area_code = 'CHN002'),
    (SELECT id FROM users WHERE username = 'fo.ad1'),
    150000, 36, 16.00, 5148.00, 'approved',
    (SELECT id FROM stages WHERE code = 'approved'),
    NOW() - INTERVAL '100 days', NOW() - INTERVAL '70 days',
    (SELECT id FROM users WHERE username = 'tl.adyar'), 680, 78.00, 55000, 75,
    'Self-employed with stable business. Community recommendation strong.',
    '{"source":"referral","referral":true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM applications WHERE application_number = 'APP1000002');

-- APP1000003 – approved (IL001, Velachery, 75000)
INSERT INTO applications (application_number, customer_id, product_id, branch_id, area_id, created_by,
    loan_amount, tenure_months, interest_rate, emi_amount, status, current_stage_id,
    submitted_at, approved_at, approved_by, cibil_score, eligibility_score,
    total_household_income, trust_score, notes, metadata)
SELECT 'APP1000003',
    (SELECT id FROM users WHERE customer_code = 'CUST1000003'),
    (SELECT id FROM loan_products WHERE product_code = 'IL001'),
    (SELECT id FROM branches WHERE branch_code = 'CHN04'),
    (SELECT id FROM areas WHERE area_code = 'CHN003'),
    (SELECT id FROM users WHERE username = 'fo.ve1'),
    75000, 24, 18.00, 3803.00, 'approved',
    (SELECT id FROM stages WHERE code = 'approved'),
    NOW() - INTERVAL '80 days', NOW() - INTERVAL '50 days',
    (SELECT id FROM users WHERE username = 'tl.velachery'), 750, 80.00, 42000, 78,
    'Salaried employee. Documents verified.',
    '{"source":"digital","referral":false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM applications WHERE application_number = 'APP1000003');

-- APP1000004 – disbursed (IL001, T Nagar, 25000)
INSERT INTO applications (application_number, customer_id, product_id, branch_id, area_id, created_by,
    loan_amount, tenure_months, interest_rate, emi_amount, status, current_stage_id,
    submitted_at, approved_at, approved_by, disbursed_at, disbursed_by,
    cibil_score, eligibility_score, total_household_income, trust_score, notes, metadata)
SELECT 'APP1000004',
    (SELECT id FROM users WHERE customer_code = 'CUST1000004'),
    (SELECT id FROM loan_products WHERE product_code = 'IL001'),
    (SELECT id FROM branches WHERE branch_code = 'CHN02'),
    (SELECT id FROM areas WHERE area_code = 'CHN001'),
    (SELECT id FROM users WHERE username = 'fo.tn1'),
    25000, 12, 18.00, 2274.00, 'disbursed',
    (SELECT id FROM stages WHERE code = 'disbursed'),
    NOW() - INTERVAL '120 days', NOW() - INTERVAL '90 days',
    (SELECT id FROM users WHERE username = 'tl.tnagar'),
    NOW() - INTERVAL '85 days', (SELECT id FROM users WHERE username = 'tl.tnagar'),
    700, 82.00, 28000, 80,
    'First-time borrower. Approved at reduced amount.',
    '{"source":"walk_in","referral":false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM applications WHERE application_number = 'APP1000004');

-- APP1000005 – approved (GL001, Adyar, 250000)
INSERT INTO applications (application_number, customer_id, product_id, branch_id, area_id, created_by,
    loan_amount, tenure_months, interest_rate, emi_amount, status, current_stage_id,
    submitted_at, approved_at, approved_by, cibil_score, eligibility_score,
    total_household_income, trust_score, notes, metadata)
SELECT 'APP1000005',
    (SELECT id FROM users WHERE customer_code = 'CUST1000005'),
    (SELECT id FROM loan_products WHERE product_code = 'GL001'),
    (SELECT id FROM branches WHERE branch_code = 'CHN03'),
    (SELECT id FROM areas WHERE area_code = 'CHN002'),
    (SELECT id FROM users WHERE username = 'fo.ad1'),
    250000, 48, 16.00, 7128.00, 'approved',
    (SELECT id FROM stages WHERE code = 'approved'),
    NOW() - INTERVAL '75 days', NOW() - INTERVAL '45 days',
    (SELECT id FROM users WHERE username = 'tl.adyar'), 650, 76.00, 65000, 72,
    'Business expansion loan. Group guarantee available.',
    '{"source":"field_visit","referral":false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM applications WHERE application_number = 'APP1000005');

-- ============================================================================
-- SECTION 17: APPLICATION NOTES
-- ============================================================================

INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'general', 'Field visit completed. Applicant and documents verified. Good repayment potential.', true, true, u.id
FROM applications a, users u
WHERE a.application_number = 'APP1000001' AND u.username = 'fo.tn1'
ON CONFLICT DO NOTHING;

INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'general', 'Community leader endorsement received. Strong trust score.', true, true, u.id
FROM applications a, users u
WHERE a.application_number = 'APP1000002' AND u.username = 'fo.ad1'
ON CONFLICT DO NOTHING;

INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'general', 'Salaried professional with stable income. All documents verified.', true, true, u.id
FROM applications a, users u
WHERE a.application_number = 'APP1000003' AND u.username = 'fo.ve1'
ON CONFLICT DO NOTHING;

INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'general', 'First loan applicant. Recommended for smaller amount.', true, true, u.id
FROM applications a, users u
WHERE a.application_number = 'APP1000004' AND u.username = 'fo.tn1'
ON CONFLICT DO NOTHING;

INSERT INTO application_notes (application_id, note_type, note_text, is_internal, is_resolved, added_by)
SELECT a.id, 'general', 'Group loan with 4 co-borrowers. All members verified.', true, true, u.id
FROM applications a, users u
WHERE a.application_number = 'APP1000005' AND u.username = 'fo.ad1'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 18: APPLICATION DOCUMENTS
-- ============================================================================

INSERT INTO application_documents (application_id, document_type, document_name, file_path, file_size, mime_type, is_verified, verified_by, uploaded_by)
SELECT a.id, 'aadhaar_card', 'Aadhaar Card',
    '/uploads/apps/' || a.application_number || '/aadhaar.pdf', 204800, 'application/pdf', true, u.id, u.id
FROM applications a, users u
WHERE a.application_number IN ('APP1000001','APP1000002','APP1000003','APP1000004','APP1000005')
  AND u.username IN ('fo.tn1','fo.ad1','fo.ve1')
ON CONFLICT DO NOTHING;

INSERT INTO application_documents (application_id, document_type, document_name, file_path, file_size, mime_type, is_verified, verified_by, uploaded_by)
SELECT a.id, 'pan_card', 'PAN Card',
    '/uploads/apps/' || a.application_number || '/pan.pdf', 102400, 'application/pdf', true, u.id, u.id
FROM applications a, users u
WHERE a.application_number IN ('APP1000001','APP1000002','APP1000003','APP1000004','APP1000005')
  AND u.username IN ('fo.tn1','fo.ad1','fo.ve1')
ON CONFLICT DO NOTHING;

INSERT INTO application_documents (application_id, document_type, document_name, file_path, file_size, mime_type, is_verified, verified_by, uploaded_by)
SELECT a.id, 'address_proof', 'Address Proof',
    '/uploads/apps/' || a.application_number || '/address.pdf', 512000, 'application/pdf', true, u.id, u.id
FROM applications a, users u
WHERE a.application_number IN ('APP1000001','APP1000002','APP1000003','APP1000004','APP1000005')
  AND u.username IN ('fo.tn1','fo.ad1','fo.ve1')
ON CONFLICT DO NOTHING;

INSERT INTO application_documents (application_id, document_type, document_name, file_path, file_size, mime_type, is_verified, verified_by, uploaded_by)
SELECT a.id, 'income_proof', 'Income Proof',
    '/uploads/apps/' || a.application_number || '/income.pdf', 307200, 'application/pdf', true, u.id, u.id
FROM applications a, users u
WHERE a.application_number IN ('APP1000001','APP1000002','APP1000003','APP1000004','APP1000005')
  AND u.username IN ('fo.tn1','fo.ad1','fo.ve1')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 19: 3 LOANS (LON1000001 – LON1000003)
-- ============================================================================

-- LON1000001: 50000, 24 months, 18%, EMI=2535
INSERT INTO loans (loan_number, application_id, customer_id, product_id, branch_id, area_id,
    loan_amount, approved_amount, tenure_months, interest_rate, interest_type, emi_amount,
    total_interest, total_payable, total_charges, disbursement_net_amount, total_disbursed,
    principal_paid, interest_paid, charges_paid, penalty_collected,
    outstanding_principal, outstanding_total, emi_paid_count, total_emis, overdue_emis,
    first_emi_date, last_emi_date, status, created_by)
SELECT 'LON1000001',
    (SELECT id FROM applications WHERE application_number = 'APP1000001'),
    (SELECT customer_id FROM applications WHERE application_number = 'APP1000001'),
    (SELECT product_id FROM applications WHERE application_number = 'APP1000001'),
    (SELECT branch_id FROM applications WHERE application_number = 'APP1000001'),
    (SELECT area_id FROM applications WHERE application_number = 'APP1000001'),
    50000, 50000, 24, 18.00, 'reducing', 2535.00, 10843.00, 60843.00, 1500.00,
    48500.00, 50000.00, 15150.00, 10430.00, 1500.00, 0.00,
    34850.00, 46780.00, 6, 24, 0,
    DATE '2026-03-01', DATE '2028-02-01', 'active',
    (SELECT id FROM users WHERE username = 'tl.tnagar')
WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LON1000001');

-- LON1000002: 75000, 24 months, 18%, EMI=3803, 1 overdue
INSERT INTO loans (loan_number, application_id, customer_id, product_id, branch_id, area_id,
    loan_amount, approved_amount, tenure_months, interest_rate, interest_type, emi_amount,
    total_interest, total_payable, total_charges, disbursement_net_amount, total_disbursed,
    principal_paid, interest_paid, charges_paid, penalty_collected,
    outstanding_principal, outstanding_total, emi_paid_count, total_emis, overdue_emis,
    first_emi_date, last_emi_date, status, created_by)
SELECT 'LON1000002',
    (SELECT id FROM applications WHERE application_number = 'APP1000003'),
    (SELECT customer_id FROM applications WHERE application_number = 'APP1000003'),
    (SELECT product_id FROM applications WHERE application_number = 'APP1000003'),
    (SELECT branch_id FROM applications WHERE application_number = 'APP1000003'),
    (SELECT area_id FROM applications WHERE application_number = 'APP1000003'),
    75000, 75000, 24, 18.00, 'reducing', 3803.00, 16265.00, 91265.00, 2000.00,
    73000.00, 75000.00, 22725.00, 15645.00, 2000.00, 500.00,
    52275.00, 68320.00, 6, 24, 1,
    DATE '2026-02-01', DATE '2028-01-01', 'active',
    (SELECT id FROM users WHERE username = 'tl.velachery')
WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LON1000002');

-- LON1000003: 30000, 24 months, 18%, EMI=1521, 1 overdue
INSERT INTO loans (loan_number, application_id, customer_id, product_id, branch_id, area_id,
    loan_amount, approved_amount, tenure_months, interest_rate, interest_type, emi_amount,
    total_interest, total_payable, total_charges, disbursement_net_amount, total_disbursed,
    principal_paid, interest_paid, charges_paid, penalty_collected,
    outstanding_principal, outstanding_total, emi_paid_count, total_emis, overdue_emis,
    first_emi_date, last_emi_date, status, created_by)
SELECT 'LON1000003',
    (SELECT id FROM applications WHERE application_number = 'APP1000004'),
    (SELECT customer_id FROM applications WHERE application_number = 'APP1000004'),
    (SELECT product_id FROM applications WHERE application_number = 'APP1000004'),
    (SELECT branch_id FROM applications WHERE application_number = 'APP1000004'),
    (SELECT area_id FROM applications WHERE application_number = 'APP1000004'),
    30000, 30000, 24, 18.00, 'reducing', 1521.00, 6506.00, 36506.00, 1200.00,
    28800.00, 30000.00, 9105.00, 6279.00, 1200.00, 250.00,
    20895.00, 27372.00, 6, 24, 1,
    DATE '2026-04-01', DATE '2028-03-01', 'active',
    (SELECT id FROM users WHERE username = 'tl.tnagar')
WHERE NOT EXISTS (SELECT 1 FROM loans WHERE loan_number = 'LON1000003');

-- ============================================================================
-- SECTION 20: EMI SCHEDULES — 24 EMIs per loan (72 total)
-- ============================================================================

-- Loan 1: LON1000001 — EMIs 1-24 (6 paid, 18 pending)
DO $$
DECLARE
    loan1_id UUID; emi_amt DECIMAL(14,2) := 2535.00;
    opening_bal DECIMAL(14,2) := 50000.00;
    monthly_rate DECIMAL(10,6) := 0.18 / 12;
    principal_part DECIMAL(14,2); interest_part DECIMAL(14,2); closing_bal DECIMAL(14,2);
    i INTEGER; emi_date DATE := DATE '2026-03-01';
BEGIN
    SELECT id INTO loan1_id FROM loans WHERE loan_number = 'LON1000001';
    IF loan1_id IS NULL THEN RETURN; END IF;
    FOR i IN 1..24 LOOP
        interest_part := ROUND(opening_bal * monthly_rate, 2);
        principal_part := emi_amt - interest_part;
        IF i = 24 THEN principal_part := opening_bal; emi_amt := principal_part + interest_part; END IF;
        closing_bal := opening_bal - principal_part;
        IF closing_bal < 0 THEN closing_bal := 0; END IF;
        INSERT INTO emi_schedules (loan_id, emi_number, due_date, emi_amount, principal, interest, opening_balance, closing_balance, is_paid, paid_on)
        SELECT loan1_id, i, emi_date + (i-1) * INTERVAL '1 month', emi_amt, principal_part, interest_part, opening_bal, closing_bal,
            CASE WHEN i <= 6 THEN true ELSE false END,
            CASE WHEN i <= 6 THEN (emi_date + (i-1) * INTERVAL '1 month') ELSE NULL END
        WHERE NOT EXISTS (SELECT 1 FROM emi_schedules WHERE loan_id = loan1_id AND emi_number = i);
        opening_bal := closing_bal;
    END LOOP;
END $$;

-- Loan 2: LON1000002 — EMIs 1-24 (6 paid)
DO $$
DECLARE
    loan2_id UUID; emi_amt DECIMAL(14,2) := 3803.00;
    opening_bal DECIMAL(14,2) := 75000.00;
    monthly_rate DECIMAL(10,6) := 0.18 / 12;
    principal_part DECIMAL(14,2); interest_part DECIMAL(14,2); closing_bal DECIMAL(14,2);
    i INTEGER; emi_date DATE := DATE '2026-02-01';
BEGIN
    SELECT id INTO loan2_id FROM loans WHERE loan_number = 'LON1000002';
    IF loan2_id IS NULL THEN RETURN; END IF;
    FOR i IN 1..24 LOOP
        interest_part := ROUND(opening_bal * monthly_rate, 2);
        principal_part := emi_amt - interest_part;
        IF i = 24 THEN principal_part := opening_bal; emi_amt := principal_part + interest_part; END IF;
        closing_bal := opening_bal - principal_part;
        IF closing_bal < 0 THEN closing_bal := 0; END IF;
        INSERT INTO emi_schedules (loan_id, emi_number, due_date, emi_amount, principal, interest, opening_balance, closing_balance, is_paid, paid_on)
        SELECT loan2_id, i, emi_date + (i-1) * INTERVAL '1 month', emi_amt, principal_part, interest_part, opening_bal, closing_bal,
            CASE WHEN i <= 6 THEN true ELSE false END,
            CASE WHEN i <= 6 THEN (emi_date + (i-1) * INTERVAL '1 month') ELSE NULL END
        WHERE NOT EXISTS (SELECT 1 FROM emi_schedules WHERE loan_id = loan2_id AND emi_number = i);
        opening_bal := closing_bal;
    END LOOP;
END $$;

-- Loan 3: LON1000003 — EMIs 1-24 (6 paid)
DO $$
DECLARE
    loan3_id UUID; emi_amt DECIMAL(14,2) := 1521.00;
    opening_bal DECIMAL(14,2) := 30000.00;
    monthly_rate DECIMAL(10,6) := 0.18 / 12;
    principal_part DECIMAL(14,2); interest_part DECIMAL(14,2); closing_bal DECIMAL(14,2);
    i INTEGER; emi_date DATE := DATE '2026-04-01';
BEGIN
    SELECT id INTO loan3_id FROM loans WHERE loan_number = 'LON1000003';
    IF loan3_id IS NULL THEN RETURN; END IF;
    FOR i IN 1..24 LOOP
        interest_part := ROUND(opening_bal * monthly_rate, 2);
        principal_part := emi_amt - interest_part;
        IF i = 24 THEN principal_part := opening_bal; emi_amt := principal_part + interest_part; END IF;
        closing_bal := opening_bal - principal_part;
        IF closing_bal < 0 THEN closing_bal := 0; END IF;
        INSERT INTO emi_schedules (loan_id, emi_number, due_date, emi_amount, principal, interest, opening_balance, closing_balance, is_paid, paid_on)
        SELECT loan3_id, i, emi_date + (i-1) * INTERVAL '1 month', emi_amt, principal_part, interest_part, opening_bal, closing_bal,
            CASE WHEN i <= 6 THEN true ELSE false END,
            CASE WHEN i <= 6 THEN (emi_date + (i-1) * INTERVAL '1 month') ELSE NULL END
        WHERE NOT EXISTS (SELECT 1 FROM emi_schedules WHERE loan_id = loan3_id AND emi_number = i);
        opening_bal := closing_bal;
    END LOOP;
END $$;

-- ============================================================================
-- SECTION 21: 3 DISBURSEMENTS
-- ============================================================================

INSERT INTO disbursements (disbursement_number, loan_id, application_id, customer_id, product_id,
    branch_id, bank_account_id, loan_amount, processing_fee, document_charge,
    insurance_amount, other_charges, total_charges, net_disbursement_amount,
    disbursement_mode, utr_number, disbursement_date, approved_by, processed_by, status)
SELECT generate_id('DSB'), l.id, l.application_id, l.customer_id, l.product_id, l.branch_id,
    (SELECT id FROM bank_accounts WHERE account_code = 'BNK1000001'),
    50000, 750.00, 500.00, 0, 250.00, 1500.00, 48500.00,
    'bank_transfer', 'UTRNB2821060001', DATE '2026-02-01',
    (SELECT id FROM users WHERE username = 'tl.tnagar'),
    (SELECT id FROM users WHERE username = 'tl.tnagar'), 'completed'
FROM loans l WHERE l.loan_number = 'LON1000001'
  AND NOT EXISTS (SELECT 1 FROM disbursements WHERE loan_id = l.id);

INSERT INTO disbursements (disbursement_number, loan_id, application_id, customer_id, product_id,
    branch_id, bank_account_id, loan_amount, processing_fee, document_charge,
    insurance_amount, other_charges, total_charges, net_disbursement_amount,
    disbursement_mode, utr_number, disbursement_date, approved_by, processed_by, status)
SELECT generate_id('DSB'), l.id, l.application_id, l.customer_id, l.product_id, l.branch_id,
    (SELECT id FROM bank_accounts WHERE account_code = 'BNK1000001'),
    75000, 1125.00, 500.00, 0, 375.00, 2000.00, 73000.00,
    'bank_transfer', 'UTRNB2821060002', DATE '2026-01-01',
    (SELECT id FROM users WHERE username = 'tl.velachery'),
    (SELECT id FROM users WHERE username = 'tl.velachery'), 'completed'
FROM loans l WHERE l.loan_number = 'LON1000002'
  AND NOT EXISTS (SELECT 1 FROM disbursements WHERE loan_id = l.id);

INSERT INTO disbursements (disbursement_number, loan_id, application_id, customer_id, product_id,
    branch_id, bank_account_id, loan_amount, processing_fee, document_charge,
    insurance_amount, other_charges, total_charges, net_disbursement_amount,
    disbursement_mode, utr_number, disbursement_date, approved_by, processed_by, status)
SELECT generate_id('DSB'), l.id, l.application_id, l.customer_id, l.product_id, l.branch_id,
    (SELECT id FROM bank_accounts WHERE account_code = 'BNK1000001'),
    30000, 450.00, 500.00, 0, 250.00, 1200.00, 28800.00,
    'bank_transfer', 'UTRNB2821060003', DATE '2026-03-01',
    (SELECT id FROM users WHERE username = 'tl.tnagar'),
    (SELECT id FROM users WHERE username = 'tl.tnagar'), 'completed'
FROM loans l WHERE l.loan_number = 'LON1000003'
  AND NOT EXISTS (SELECT 1 FROM disbursements WHERE loan_id = l.id);

-- ============================================================================
-- SECTION 22: 10 EMI PAYMENTS
-- ============================================================================

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'cash', es.paid_on, u.id, true, 'Cash payment at branch'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 1 AND l.loan_number = 'LON1000001'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'bank_transfer', es.paid_on, u.id, true, 'NEFT from customer account'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 2 AND l.loan_number = 'LON1000001'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount + 500.00, es.principal, es.interest, 500.00, 'cash', es.paid_on + INTERVAL '3 days', u.id, true, 'Late payment with Rs.500 penalty'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 3 AND l.loan_number = 'LON1000002'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'upi', es.paid_on, u.id, true, 'UPI payment'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 4 AND l.loan_number = 'LON1000002'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'bank_transfer', es.paid_on, u.id, true, 'Auto-debit'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 5 AND l.loan_number = 'LON1000002'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'cash', es.paid_on, u.id, true, 'Cash payment'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 6 AND l.loan_number = 'LON1000002'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'cash', es.paid_on, u.id, true, 'Cash payment at branch'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 1 AND l.loan_number = 'LON1000003'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'upi', es.paid_on, u.id, true, 'UPI payment'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 2 AND l.loan_number = 'LON1000003'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount + 250.00, es.principal, es.interest, 250.00, 'cash', es.paid_on + INTERVAL '5 days', u.id, true, 'Late payment with Rs.250 penalty'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 3 AND l.loan_number = 'LON1000003'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO emi_payments (payment_number, loan_id, emi_schedule_id, customer_id, payment_amount, principal_component, interest_component, penalty_component, payment_method, payment_date, received_by, is_verified, notes)
SELECT generate_id('PAY'), l.id, es.id, l.customer_id, es.emi_amount, es.principal, es.interest, 0.00, 'bank_transfer', es.paid_on, u.id, true, 'NEFT transfer'
FROM loans l JOIN emi_schedules es ON es.loan_id = l.id AND es.emi_number = 4 AND l.loan_number = 'LON1000003'
JOIN users u ON u.role = 'collection_agent' AND u.branch_id = l.branch_id LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 23: 2 OVERDUE EMIs
-- ============================================================================

UPDATE emi_schedules SET is_overdue = true, days_overdue = 63
WHERE loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000002') AND emi_number = 7;

UPDATE emi_schedules SET is_overdue = true, days_overdue = 2
WHERE loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000003') AND emi_number = 7;

-- ============================================================================
-- SECTION 24: 5 PENALTIES
-- ============================================================================

INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type, penalty_amount, waived_amount, final_amount, penalty_date, due_date, is_paid, paid_on)
SELECT generate_id('PEN'), l2.id,
    (SELECT id FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3),
    l2.customer_id, 'late_payment', 500.00, 0.00, 500.00,
    (SELECT due_date + INTERVAL '3 days' FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3),
    (SELECT due_date FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3),
    true, (SELECT due_date + INTERVAL '3 days' FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3)
FROM loans l2 WHERE l2.loan_number = 'LON1000002'
ON CONFLICT DO NOTHING;

INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type, penalty_amount, waived_amount, final_amount, penalty_date, due_date, is_paid, paid_on)
SELECT generate_id('PEN'), l2.id,
    (SELECT id FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3),
    l2.customer_id, 'late_payment', 250.00, 0.00, 250.00,
    (SELECT due_date + INTERVAL '5 days' FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3),
    (SELECT due_date FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3),
    true, (SELECT due_date + INTERVAL '5 days' FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 3)
FROM loans l2 WHERE l2.loan_number = 'LON1000003'
ON CONFLICT DO NOTHING;

INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type, penalty_amount, waived_amount, final_amount, penalty_date, due_date, is_paid)
SELECT generate_id('PEN'), l2.id,
    (SELECT id FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 7),
    l2.customer_id, 'late_payment', 750.00, 0.00, 750.00, CURRENT_DATE, CURRENT_DATE, false
FROM loans l2 WHERE l2.loan_number = 'LON1000002'
ON CONFLICT DO NOTHING;

INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type, penalty_amount, waived_amount, final_amount, penalty_date, due_date, is_paid)
SELECT generate_id('PEN'), l2.id,
    (SELECT id FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 7),
    l2.customer_id, 'late_payment', 250.00, 0.00, 250.00, CURRENT_DATE, CURRENT_DATE, false
FROM loans l2 WHERE l2.loan_number = 'LON1000003'
ON CONFLICT DO NOTHING;

INSERT INTO penalties (penalty_number, loan_id, emi_schedule_id, customer_id, penalty_type, penalty_amount, waived_amount, final_amount, penalty_date, due_date, is_paid, paid_on)
SELECT generate_id('PEN'), l2.id,
    (SELECT id FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 2),
    l2.customer_id, 'bounced_cheque', 500.00, 0.00, 500.00,
    (SELECT due_date + INTERVAL '2 days' FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 2),
    (SELECT due_date FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 2),
    true, (SELECT due_date + INTERVAL '5 days' FROM emi_schedules WHERE loan_id = l2.id AND emi_number = 2)
FROM loans l2 WHERE l2.loan_number = 'LON1000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 25: 5 LEDGER ENTRIES (balanced double-entry)
-- ============================================================================

-- Entry 1: Loan disbursement
INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_number, narration, created_by)
SELECT generate_id('LDG'), DATE '2026-02-01', 'Disbursement - LON1000001', 'disbursement', 'LON1000001', 'Loan disbursement of Rs.50000 to Arun Kumar', u.id
FROM users u WHERE u.username = 'tl.tnagar'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 50000.00, 0.00, 1, 'Loans Receivable'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '1101'
  AND le.reference_number = 'LON1000001' AND le.reference_type = 'disbursement'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 0.00, 48500.00, 2, 'HDFC Bank - Net disbursement'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '1002'
  AND le.reference_number = 'LON1000001' AND le.reference_type = 'disbursement'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 0.00, 1500.00, 3, 'Processing Fee Income'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '4002'
  AND le.reference_number = 'LON1000001' AND le.reference_type = 'disbursement'
ON CONFLICT DO NOTHING;

-- Entry 2: EMI collection
INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_number, narration, created_by)
SELECT generate_id('LDG'), DATE '2026-03-01', 'EMI Collection - LON1000001', 'emi_payment', 'LON1000001', 'EMI received from Arun Kumar', u.id
FROM users u WHERE u.username = 'ca.tn1'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 2535.00, 0.00, 1, 'Cash in Hand'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '1001'
  AND le.description = 'EMI Collection - LON1000001'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 0.00, 1900.00, 2, 'Interest Income'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '4001'
  AND le.description = 'EMI Collection - LON1000001'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 0.00, 635.00, 3, 'Loans Receivable'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '1101'
  AND le.description = 'EMI Collection - LON1000001'
ON CONFLICT DO NOTHING;

-- Entry 3: Late fee collection
INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_number, narration, created_by)
SELECT generate_id('LDG'), DATE '2026-07-15', 'Late Fee Collection - LON1000002', 'penalty', 'LON1000002', 'Late fee from Lakshmi Narayanan', u.id
FROM users u WHERE u.username = 'ca.ad1'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 500.00, 0.00, 1, 'Cash in Hand - Late fee'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '1001'
  AND le.description = 'Late Fee Collection - LON1000002'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 0.00, 500.00, 2, 'Late Fee Income'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '4004'
  AND le.description = 'Late Fee Collection - LON1000002'
ON CONFLICT DO NOTHING;

-- Entry 4: September salary
INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_number, narration, created_by)
SELECT generate_id('LDG'), DATE '2026-09-30', 'September Salary - Staff', 'expense', NULL, 'Monthly salary for field officers and agents', u.id
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 125000.00, 0.00, 1, 'Salary Expense'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '5001'
  AND le.description = 'September Salary - Staff'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 0.00, 125000.00, 2, 'HDFC Bank Account'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '1002'
  AND le.description = 'September Salary - Staff'
ON CONFLICT DO NOTHING;

-- Entry 5: Office rent
INSERT INTO ledger_entries (entry_number, entry_date, description, reference_type, reference_number, narration, created_by)
SELECT generate_id('LDG'), DATE '2026-09-01', 'Office Rent - T Nagar', 'expense', NULL, 'Monthly office rent T Nagar branch', u.id
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 25000.00, 0.00, 1, 'Rent Expense'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '5002'
  AND le.description = 'Office Rent - T Nagar'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entry_lines (ledger_entry_id, account_id, debit_amount, credit_amount, line_order, narration)
SELECT le.id, la.id, 0.00, 25000.00, 2, 'HDFC Bank Account'
FROM ledger_entries le, ledger_accounts la WHERE la.account_code = '1002'
  AND le.description = 'Office Rent - T Nagar'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 26: LEDGER ACCOUNT BALANCES
-- ============================================================================

INSERT INTO ledger_account_balances (account_id, as_of_date, opening_balance, total_debit, total_credit, closing_balance)
SELECT la.id, CURRENT_DATE, la.opening_balance, 0, 0, la.current_balance
FROM ledger_accounts la
WHERE NOT EXISTS (SELECT 1 FROM ledger_account_balances lab WHERE lab.account_id = la.id AND lab.as_of_date = CURRENT_DATE);

-- ============================================================================
-- SECTION 27: 5 VERIFICATION TASKS
-- ============================================================================

INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT generate_id('TSK'), a.id, 'field_verification', u1.id, u2.id, 'high', 'completed', CURRENT_DATE - INTERVAL '6 days', 'Field visit completed. Applicant present. Documents verified.'
FROM applications a, users u1, users u2
WHERE a.application_number = 'APP1000001' AND u1.username = 'fo.tn1' AND u2.username = 'tl.tnagar'
ON CONFLICT DO NOTHING;

INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT generate_id('TSK'), a.id, 'document_verification', u1.id, u2.id, 'medium', 'completed', CURRENT_DATE - INTERVAL '5 days', 'All documents verified and in order.'
FROM applications a, users u1, users u2
WHERE a.application_number = 'APP1000002' AND u1.username = 'fo.ad1' AND u2.username = 'tl.adyar'
ON CONFLICT DO NOTHING;

INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT generate_id('TSK'), a.id, 'field_verification', u1.id, u2.id, 'high', 'completed', CURRENT_DATE - INTERVAL '4 days', 'Field visit completed. Income source verified.'
FROM applications a, users u1, users u2
WHERE a.application_number = 'APP1000003' AND u1.username = 'fo.ve1' AND u2.username = 'tl.velachery'
ON CONFLICT DO NOTHING;

INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT generate_id('TSK'), a.id, 'document_verification', u1.id, u2.id, 'medium', 'in_progress', CURRENT_DATE - INTERVAL '2 days', 'Verifying income documents and address proof.'
FROM applications a, users u1, users u2
WHERE a.application_number = 'APP1000005' AND u1.username = 'fo.ad1' AND u2.username = 'tl.adyar'
ON CONFLICT DO NOTHING;

INSERT INTO verification_tasks (task_number, application_id, task_type, assigned_to, assigned_by, priority, status, scheduled_date, notes)
SELECT generate_id('TSK'), a.id, 'field_verification', u1.id, u2.id, 'low', 'assigned', CURRENT_DATE + INTERVAL '3 days', 'Scheduled field visit for new applicant.'
FROM applications a, users u1, users u2
WHERE a.application_number = 'APP1000001' AND u1.username = 'fo.tn2' AND u2.username = 'tl.tnagar'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 28: 3 NPA CLASSIFICATIONS
-- ============================================================================

INSERT INTO npa_classifications (npa_number, loan_id, customer_id, classification_date, overdue_days, overdue_amount, npa_category, substandard_days, provision_amount, provision_pct, action_taken, is_active)
SELECT generate_id('NPA'), l.id, l.customer_id, CURRENT_DATE, 63,
    (SELECT emi_amount FROM emi_schedules WHERE loan_id = l.id AND emi_number = 7),
    'sub_standard', 63, ROUND(l.outstanding_principal * 0.15, 2), 15.00,
    'Personal call and field visit completed. Recovery officer assigned.', true
FROM loans l WHERE l.loan_number = 'LON1000002'
ON CONFLICT DO NOTHING;

INSERT INTO npa_classifications (npa_number, loan_id, customer_id, classification_date, overdue_days, overdue_amount, npa_category, substandard_days, provision_amount, provision_pct, action_taken, is_active)
SELECT generate_id('NPA'), l.id, l.customer_id, CURRENT_DATE, 2,
    (SELECT emi_amount FROM emi_schedules WHERE loan_id = l.id AND emi_number = 7),
    'sub_standard', 2, ROUND(l.outstanding_principal * 0.15, 2), 15.00,
    'Initial overdue notice sent. Follow-up call scheduled.', true
FROM loans l WHERE l.loan_number = 'LON1000003'
ON CONFLICT DO NOTHING;

INSERT INTO npa_classifications (npa_number, loan_id, customer_id, classification_date, overdue_days, overdue_amount, npa_category, substandard_days, provision_amount, provision_pct, action_taken, is_active)
SELECT generate_id('NPA'), l.id, l.customer_id, CURRENT_DATE, 0, 0.00, 'sub_standard', 0, ROUND(l.outstanding_principal * 0.05, 2), 5.00,
    'Preventive watch. No overdue EMIs. Good repayment history.', true
FROM loans l WHERE l.loan_number = 'LON1000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 29: 5 SMS TEMPLATES
-- ============================================================================

INSERT INTO sms_templates (template_code, template_name, category, template_text, variables, is_active)
SELECT 'EMI_DUE_REMINDER', 'EMI Due Reminder', 'payment',
    'Dear {customer_name}, EMI of Rs.{amount} for loan {loan_number} is due on {due_date}. Please pay to avoid late fees. -CMF',
    ARRAY['{customer_name}','{amount}','{loan_number}','{due_date}'], true
WHERE NOT EXISTS (SELECT 1 FROM sms_templates WHERE template_code = 'EMI_DUE_REMINDER');

INSERT INTO sms_templates (template_code, template_name, category, template_text, variables, is_active)
SELECT 'EMI_OVERDUE_ALERT', 'EMI Overdue Alert', 'payment',
    'Dear {customer_name}, EMI Rs.{amount} for loan {loan_number} is {days} days overdue. Late fee Rs.{fee} applicable. Pay immediately. -CMF',
    ARRAY['{customer_name}','{amount}','{loan_number}','{days}','{fee}'], true
WHERE NOT EXISTS (SELECT 1 FROM sms_templates WHERE template_code = 'EMI_OVERDUE_ALERT');

INSERT INTO sms_templates (template_code, template_name, category, template_text, variables, is_active)
SELECT 'APP_APPROVAL_SMS', 'Application Approval', 'application',
    'Dear {customer_name}, your loan application {app_number} for Rs.{amount} has been APPROVED. Visit branch for disbursement. -CMF',
    ARRAY['{customer_name}','{app_number}','{amount}'], true
WHERE NOT EXISTS (SELECT 1 FROM sms_templates WHERE template_code = 'APP_APPROVAL_SMS');

INSERT INTO sms_templates (template_code, template_name, category, template_text, variables, is_active)
SELECT 'DISBURSEMENT_SMS', 'Disbursement Notification', 'disbursement',
    'Dear {customer_name}, loan {loan_number} of Rs.{amount} disbursed. EMI starts from {first_emi_date}. -CMF',
    ARRAY['{customer_name}','{loan_number}','{amount}','{first_emi_date}'], true
WHERE NOT EXISTS (SELECT 1 FROM sms_templates WHERE template_code = 'DISBURSEMENT_SMS');

INSERT INTO sms_templates (template_code, template_name, category, template_text, variables, is_active)
SELECT 'PAYMENT_CONFIRM', 'Payment Confirmation', 'payment',
    'Dear {customer_name}, Rs.{amount} received for loan {loan_number}. Receipt: {receipt_number}. Balance: Rs.{balance}. -CMF',
    ARRAY['{customer_name}','{amount}','{loan_number}','{receipt_number}','{balance}'], true
WHERE NOT EXISTS (SELECT 1 FROM sms_templates WHERE template_code = 'PAYMENT_CONFIRM');

-- ============================================================================
-- SECTION 30: 3 EMAIL TEMPLATES
-- ============================================================================

INSERT INTO email_templates (template_code, template_name, category, subject, html_body, text_body, variables, is_active)
SELECT 'APPROVAL_EMAIL', 'Loan Approval Email', 'application',
    'Congratulations! Your Loan Application {app_number} is Approved | CMF',
    '<h2>Dear {customer_name},</h2><p>We are pleased to inform you that your loan application <strong>{app_number}</strong> for <strong>Rs.{amount}</strong> has been <span style="color:green">APPROVED</span>.</p><p>Please visit your branch with the required documents for disbursement.</p><br><p>Regards,<br><strong>Continnum Micro Finance Team</strong><br>Chennai, Tamil Nadu</p>',
    'Dear {customer_name}, your loan application {app_number} for Rs.{amount} has been approved.',
    ARRAY['{customer_name}','{app_number}','{amount}'], true
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_code = 'APPROVAL_EMAIL');

INSERT INTO email_templates (template_code, template_name, category, subject, html_body, text_body, variables, is_active)
SELECT 'EMI_RECEIPT_EMAIL', 'EMI Payment Receipt', 'payment',
    'Your EMI Payment Receipt | CMF',
    '<h2>Dear {customer_name},</h2><p>Thank you for your EMI payment.</p><p><strong>Loan Number:</strong> {loan_number}<br><strong>Amount Paid:</strong> Rs.{amount}<br><strong>Receipt No:</strong> {receipt_number}<br><strong>Date:</strong> {payment_date}</p><p>Your outstanding balance is Rs.{balance}.</p><br><p>Regards,<br><strong>Continnum Micro Finance Team</strong></p>',
    'Dear {customer_name}, EMI payment of Rs.{amount} received for loan {loan_number}. Receipt: {receipt_number}. Balance: Rs.{balance}.',
    ARRAY['{customer_name}','{loan_number}','{amount}','{receipt_number}','{payment_date}','{balance}'], true
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_code = 'EMI_RECEIPT_EMAIL');

INSERT INTO email_templates (template_code, template_name, category, subject, html_body, text_body, variables, is_active)
SELECT 'DISBURSEMENT_STMT', 'Disbursement Statement', 'disbursement',
    'Loan Disbursement Statement | CMF',
    '<h2>Dear {customer_name},</h2><p>Your loan <strong>{loan_number}</strong> has been disbursed.</p><table border="1" cellpadding="5"><tr><td>Loan Amount</td><td>Rs.{loan_amount}</td></tr><tr><td>Charges</td><td>Rs.{charges}</td></tr><tr><td>Net Disbursed</td><td>Rs.{net_amount}</td></tr><tr><td>Date</td><td>{disbursement_date}</td></tr></table><p>Your EMI schedule is attached.</p><br><p>Regards,<br><strong>Continnum Micro Finance Team</strong></p>',
    'Dear {customer_name}, loan {loan_number} disbursed. Amount: Rs.{loan_amount}, Charges: Rs.{charges}, Net: Rs.{net_amount}.',
    ARRAY['{customer_name}','{loan_number}','{loan_amount}','{charges}','{net_amount}','{disbursement_date}'], true
WHERE NOT EXISTS (SELECT 1 FROM email_templates WHERE template_code = 'DISBURSEMENT_STMT');

-- ============================================================================
-- SECTION 31: 10 NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'EMI Due - LON1000001', 'Your EMI of Rs.2535 for loan LON1000001 is due on 2026-09-01. Please pay on time.',
    'emi_due', 'loan', l.id, true, false, '/loans/' || l.id, NOW() - INTERVAL '5 days'
FROM loans l, users u WHERE l.loan_number = 'LON1000001' AND u.id = l.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'EMI Overdue - LON1000002', 'Your EMI of Rs.3803 for loan LON1000002 is overdue by 63 days. Late fee Rs.750 applicable.',
    'warning', 'loan', l.id, false, true, '/loans/' || l.id, NOW() - INTERVAL '3 days'
FROM loans l, users u WHERE l.loan_number = 'LON1000002' AND u.id = l.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'Application Approved - APP1000001', 'Your loan application APP1000001 for Rs.50000 has been approved.',
    'success', 'application', a.id, true, true, '/applications/' || a.id, NOW() - INTERVAL '60 days'
FROM applications a, users u WHERE a.application_number = 'APP1000001' AND u.id = a.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'Loan Disbursed - LON1000001', 'Your loan LON1000001 of Rs.50000 has been disbursed to your account.',
    'success', 'loan', l.id, true, true, '/loans/' || l.id, NOW() - INTERVAL '85 days'
FROM loans l, users u WHERE l.loan_number = 'LON1000001' AND u.id = l.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'Penalty Applied - LON1000002', 'A late payment penalty of Rs.500 has been applied to your loan LON1000002.',
    'warning', 'loan', l.id, false, true, '/loans/' || l.id, NOW() - INTERVAL '10 days'
FROM loans l, users u WHERE l.loan_number = 'LON1000002' AND u.id = l.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'EMI Payment Received', 'Your EMI payment of Rs.2535 for loan LON1000001 has been received. Receipt: RCP1000001.',
    'payment_received', 'loan', l.id, true, false, '/loans/' || l.id, NOW() - INTERVAL '20 days'
FROM loans l, users u WHERE l.loan_number = 'LON1000001' AND u.id = l.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'Application Under Review', 'Your loan application APP1000002 is currently under review. We will update you soon.',
    'info', 'application', a.id, true, false, '/applications/' || a.id, NOW() - INTERVAL '15 days'
FROM applications a, users u WHERE a.application_number = 'APP1000002' AND u.id = a.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'Document Required', 'Please submit your latest salary slip for application APP1000005.',
    'application_status', 'application', a.id, false, true, '/applications/' || a.id, NOW() - INTERVAL '2 days'
FROM applications a, users u WHERE a.application_number = 'APP1000005' AND u.id = a.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, created_at)
SELECT u.id, 'New EMI Schedule Available', 'Your EMI schedule for loan LON1000001 is now available. 24 EMIs of Rs.2535 each.',
    'loan_update', 'loan', l.id, true, false, '/loans/' || l.id, NOW() - INTERVAL '86 days'
FROM loans l, users u WHERE l.loan_number = 'LON1000001' AND u.id = l.customer_id
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, is_action_required, action_url, expires_at, created_at)
SELECT u.id, 'Field Visit Scheduled', 'A field verification visit is scheduled for your application APP1000001. Please be available.',
    'info', 'application', a.id, false, true, '/applications/' || a.id, NOW() + INTERVAL '7 days', NOW() - INTERVAL '1 day'
FROM applications a, users u WHERE a.application_number = 'APP1000001' AND u.id = a.customer_id
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 32: 5 REFERRALS
-- ============================================================================

INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT generate_id('REF'), u.id, 'Karthik Bala', '+919500000101', 'Anna Nagar, Chennai', 'pending', 'Referred by existing customer. Interested in personal loan.'
FROM users u WHERE u.username = 'cust.arun.kumar'
ON CONFLICT DO NOTHING;

INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT generate_id('REF'), u.id, 'Vijay Anand', '+919500000102', 'T Nagar, Chennai', 'contacted', 'Contacted via phone. Interested in group loan. Scheduled for field visit.'
FROM users u WHERE u.username = 'cust.bala.murugan'
ON CONFLICT DO NOTHING;

INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT generate_id('REF'), u.id, 'Deepa Raman', '+919500000103', 'Adyar, Chennai', 'applied', 'Has applied for individual loan. Documents under review.'
FROM users u WHERE u.username = 'cust.chandra.devi'
ON CONFLICT DO NOTHING;

INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT generate_id('REF'), u.id, 'Suresh Babu', '+919500000104', 'Velachery, Chennai', 'converted', 'Successfully converted. Loan LON1000003 approved and disbursed.'
FROM users u WHERE u.username = 'cust.deepa.eshwari'
ON CONFLICT DO NOTHING;

INSERT INTO referrals (referral_number, referrer_id, referred_name, referred_phone, referred_address, status, notes)
SELECT generate_id('REF'), u.id, 'Meena Lakshmi', '+919500000105', 'Kodambakkam, Chennai', 'pending', 'Friend referral. Interested in business loan. Will visit branch next week.'
FROM users u WHERE u.username = 'cust.faizal.begum'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 33: 3 TRUST SCORES
-- ============================================================================

INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, factors, calculated_by, notes)
SELECT u.id, a.id, 88, 82, 92, 87, 'A', '{"occupation_stability":22,"neighbourhood_reputation":20,"repayment_history":30,"group_endorsement":15}'::jsonb, tl.id, 'Excellent repayment history. Strong community standing. Highly recommended.'
FROM users u, applications a, users tl
WHERE u.username = 'cust.arun.kumar' AND a.application_number = 'APP1000001' AND tl.username = 'tl.tnagar'
ON CONFLICT DO NOTHING;

INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, factors, calculated_by, notes)
SELECT u.id, a.id, 72, 68, 78, 73, 'B', '{"occupation_stability":18,"neighbourhood_reputation":15,"repayment_history":25,"group_endorsement":15}'::jsonb, tl.id, 'Good repayment track record. Community references positive.'
FROM users u, applications a, users tl
WHERE u.username = 'cust.bala.murugan' AND a.application_number = 'APP1000002' AND tl.username = 'tl.adyar'
ON CONFLICT DO NOTHING;

INSERT INTO trust_scores (customer_id, application_id, team_score, community_score, repayment_history, overall_score, grade, factors, calculated_by, notes)
SELECT u.id, a.id, 80, 75, 85, 80, 'A', '{"occupation_stability":20,"neighbourhood_reputation":18,"repayment_history":25,"group_endorsement":17}'::jsonb, tl.id, 'Salaried professional with stable job. Strong community references.'
FROM users u, applications a, users tl
WHERE u.username = 'cust.chandra.devi' AND a.application_number = 'APP1000003' AND tl.username = 'tl.velachery'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 34: 5 APPROVAL LIMITS
-- ============================================================================

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 50000, 5000, 24, lp.id, true FROM roles r, loan_products lp
WHERE r.name = 'field_officer' AND lp.product_code = 'IL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 200000, 10000, 36, lp.id, true FROM roles r, loan_products lp
WHERE r.name = 'team_leader' AND lp.product_code = 'IL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 500000, 50000, 60, lp.id, true FROM roles r, loan_products lp
WHERE r.name = 'branch_admin' AND lp.product_code = 'IL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 100000, 10000, 36, lp.id, true FROM roles r, loan_products lp
WHERE r.name = 'team_leader' AND lp.product_code = 'GL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

INSERT INTO approval_limits (role_id, max_amount, min_amount, max_tenure, product_id, is_active)
SELECT r.id, 500000, 10000, 60, lp.id, true FROM roles r, loan_products lp
WHERE r.name = 'branch_admin' AND lp.product_code = 'GL001'
AND NOT EXISTS (SELECT 1 FROM approval_limits WHERE role_id = r.id AND product_id = lp.id);

-- ============================================================================
-- SECTION 35: APP SETTINGS
-- ============================================================================

INSERT INTO app_settings (setting_key, setting_value, setting_type, description)
VALUES
    ('company_name', 'Continnum Micro Finance Pvt Ltd', 'string', 'Company display name'),
    ('company_address', 'No. 1, Anna Salai, Chennai - 600001, Tamil Nadu, India', 'string', 'Company address'),
    ('company_phone', '+91-44-10000000', 'string', 'Contact number'),
    ('company_email', 'info@cmf.in', 'string', 'Company email'),
    ('gst_number', '33AABCC1234R1Z5', 'string', 'GST number'),
    ('gst_rate', '18', 'number', 'GST rate percentage'),
    ('emi_reminder_days', '[3,1]', 'json', 'Days before EMI for reminders'),
    ('late_payment_grace_days', '7', 'number', 'Grace period before late fee'),
    ('late_fee_type', 'flat', 'string', 'Late fee calculation type'),
    ('late_fee_value', '500', 'number', 'Late fee flat amount'),
    ('portal_url', 'https://cmf.in', 'string', 'Customer portal URL'),
    ('financial_year_start', '04-01', 'string', 'Financial year start month-day'),
    ('currency', 'INR', 'string', 'Default currency')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- SECTION 36: DISBURSEMENT CHARGES (2 per loan = 6 total)
-- ============================================================================

INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, calculation_type, base_amount, rate_pct, flat_amount, charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT generate_id('CHG'), d.id, 'processing_fee', 'Loan Processing Fee', 'percentage', d.loan_amount, 1.50, NULL,
    ROUND(d.loan_amount * 0.015, 2), 9.00, ROUND(d.loan_amount * 0.015 * 0.09, 2), 9.00, ROUND(d.loan_amount * 0.015 * 0.09, 2), ROUND(d.loan_amount * 0.015 * 1.18, 2)
FROM disbursements d WHERE d.loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000001')
ON CONFLICT DO NOTHING;

INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, calculation_type, base_amount, rate_pct, flat_amount, charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT generate_id('CHG'), d.id, 'document_charge', 'Document Processing Charge', 'flat', d.loan_amount, NULL, 500.00, 500.00, 0.00, 0.00, 0.00, 0.00, 500.00
FROM disbursements d WHERE d.loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000001')
ON CONFLICT DO NOTHING;

INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, calculation_type, base_amount, rate_pct, flat_amount, charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT generate_id('CHG'), d.id, 'processing_fee', 'Loan Processing Fee', 'percentage', d.loan_amount, 1.50, NULL,
    ROUND(d.loan_amount * 0.015, 2), 9.00, ROUND(d.loan_amount * 0.015 * 0.09, 2), 9.00, ROUND(d.loan_amount * 0.015 * 0.09, 2), ROUND(d.loan_amount * 0.015 * 1.18, 2)
FROM disbursements d WHERE d.loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000002')
ON CONFLICT DO NOTHING;

INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, calculation_type, base_amount, rate_pct, flat_amount, charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT generate_id('CHG'), d.id, 'document_charge', 'Document Processing Charge', 'flat', d.loan_amount, NULL, 500.00, 500.00, 0.00, 0.00, 0.00, 0.00, 500.00
FROM disbursements d WHERE d.loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000002')
ON CONFLICT DO NOTHING;

INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, calculation_type, base_amount, rate_pct, flat_amount, charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT generate_id('CHG'), d.id, 'processing_fee', 'Loan Processing Fee', 'percentage', d.loan_amount, 1.50, NULL,
    ROUND(d.loan_amount * 0.015, 2), 9.00, ROUND(d.loan_amount * 0.015 * 0.09, 2), 9.00, ROUND(d.loan_amount * 0.015 * 0.09, 2), ROUND(d.loan_amount * 0.015 * 1.18, 2)
FROM disbursements d WHERE d.loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000003')
ON CONFLICT DO NOTHING;

INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head, calculation_type, base_amount, rate_pct, flat_amount, charge_amount, cgst_pct, cgst_amount, sgst_pct, sgst_amount, total_amount)
SELECT generate_id('CHG'), d.id, 'document_charge', 'Document Processing Charge', 'flat', d.loan_amount, NULL, 500.00, 500.00, 0.00, 0.00, 0.00, 0.00, 500.00
FROM disbursements d WHERE d.loan_id = (SELECT id FROM loans WHERE loan_number = 'LON1000003')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 37: BANK STATEMENT ENTRIES
-- ============================================================================

INSERT INTO bank_statement_entries (bank_account_id, entry_date, description, transaction_ref, debit_amount, credit_amount, balance, entry_type)
SELECT b.id, v.dt, v.desc, v.ref, v.debit, v.credit, v.bal, 'manual'
FROM bank_accounts b
CROSS JOIN (VALUES
    (CURRENT_DATE, 'Salary Deposit - CMF Payroll', 'TXN1000001', 0.00, 180000.00, 10018000.00),
    (CURRENT_DATE - 1, 'EMI Collection - LON1000001', 'TXN1000002', 0.00, 2535.00, 10020535.00),
    (CURRENT_DATE - 1, 'EMI Collection - LON1000002', 'TXN1000003', 0.00, 3803.00, 10024338.00),
    (CURRENT_DATE - 2, 'Office Rent - T Nagar', 'TXN1000004', 25000.00, 0.00, 9999338.00),
    (CURRENT_DATE - 3, 'Late Fee Received', 'TXN1000005', 0.00, 500.00, 9999838.00),
    (CURRENT_DATE - 5, 'NEFT Disbursement - LON1000001', 'TXN1000006', 48500.00, 0.00, 9951338.00),
    (CURRENT_DATE - 10, 'Office Supplies', 'TXN1000007', 3500.00, 0.00, 9947838.00),
    (CURRENT_DATE - 15, 'EMI Collection - LON1000003', 'TXN1000008', 0.00, 1521.00, 9949359.00)
) AS v(dt, desc, ref, debit, credit, bal)
WHERE b.account_code = 'BNK1000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 38: AUDIT LOGS
-- ============================================================================

INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT generate_id('AUD'), u.id, 'application.created', 'application', a.id, a.application_number, '10.0.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
FROM applications a, users u WHERE a.application_number = 'APP1000001' AND u.username = 'fo.tn1'
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT generate_id('AUD'), u.id, 'application.approved', 'application', a.id, a.application_number, '10.0.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
FROM applications a, users u WHERE a.application_number = 'APP1000001' AND u.username = 'tl.tnagar'
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT generate_id('AUD'), u.id, 'loan.disbursed', 'loan', l.id, l.loan_number, '10.0.1.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
FROM loans l, users u WHERE l.loan_number = 'LON1000001' AND u.username = 'tl.tnagar'
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT generate_id('AUD'), u.id, 'emi.payment', 'emi_payment', l.id, l.loan_number, '10.0.1.30', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
FROM loans l, users u WHERE l.loan_number = 'LON1000001' AND u.username = 'ca.tn1'
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (audit_number, user_id, action, entity_type, entity_id, entity_number, ip_address, user_agent)
SELECT generate_id('AUD'), u.id, 'npa.classified', 'npa_classification', l.id, l.loan_number, '10.0.1.20', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'
FROM loans l, users u WHERE l.loan_number = 'LON1000002' AND u.username = 'tl.adyar'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 39: SMS LOGS
-- ============================================================================

INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT generate_id('SMS'), u.phone, up.first_name || ' ' || up.last_name,
    'Dear ' || up.first_name || ', your EMI of Rs.2535 for loan LON1000001 is due on 2026-09-01. Please pay to avoid late fees. -CMF',
    'delivered', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '30 seconds'
FROM loans l JOIN users u ON u.id = l.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE l.loan_number = 'LON1000001'
ON CONFLICT DO NOTHING;

INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT generate_id('SMS'), u.phone, up.first_name || ' ' || up.last_name,
    'Dear ' || up.first_name || ', your application APP1000001 has been APPROVED for Rs.50000. Visit branch for disbursement. -CMF',
    'delivered', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '45 seconds'
FROM applications a JOIN users u ON u.id = a.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE a.application_number = 'APP1000001'
ON CONFLICT DO NOTHING;

INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT generate_id('SMS'), u.phone, up.first_name || ' ' || up.last_name,
    'Dear ' || up.first_name || ', your EMI of Rs.3803 for loan LON1000002 is 63 days overdue. Late fee Rs.750 applicable. Pay immediately. -CMF',
    'sent', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '20 seconds'
FROM loans l JOIN users u ON u.id = l.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE l.loan_number = 'LON1000002'
ON CONFLICT DO NOTHING;

INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT generate_id('SMS'), u.phone, up.first_name || ' ' || up.last_name,
    'Dear ' || up.first_name || ', your loan LON1000001 of Rs.50000 has been disbursed. EMI starts from 2026-03-01. -CMF',
    'delivered', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days' + INTERVAL '40 seconds'
FROM loans l JOIN users u ON u.id = l.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE l.loan_number = 'LON1000001'
ON CONFLICT DO NOTHING;

INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, message_text, status, sent_at, delivered_at)
SELECT generate_id('SMS'), u.phone, up.first_name || ' ' || up.last_name,
    'Dear ' || up.first_name || ', Rs.2535 received for loan LON1000001. Receipt: RCP1000001. Balance: Rs.34850. -CMF',
    'delivered', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '35 seconds'
FROM loans l JOIN users u ON u.id = l.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE l.loan_number = 'LON1000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 40: EMAIL LOGS
-- ============================================================================

INSERT INTO email_logs (email_number, recipient_email, recipient_name, subject, body_html, body_text, status, sent_at, opened_at)
SELECT generate_id('EML'), u.email, up.first_name || ' ' || up.last_name,
    'Loan Disbursement Statement | CMF',
    '<h2>Dear ' || up.first_name || ',</h2><p>Your loan <strong>LON1000001</strong> has been disbursed.</p><p>Amount: Rs.50000, Net: Rs.48500.</p><br><p>Regards,<br>CMF Team</p>',
    'Dear ' || up.first_name || ', your loan LON1000001 has been disbursed. Net: Rs.48500.',
    'sent', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days' + INTERVAL '2 hours'
FROM loans l JOIN users u ON u.id = l.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE l.loan_number = 'LON1000001'
ON CONFLICT DO NOTHING;

INSERT INTO email_logs (email_number, recipient_email, recipient_name, subject, body_html, body_text, status, sent_at, opened_at)
SELECT generate_id('EML'), u.email, up.first_name || ' ' || up.last_name,
    'Your EMI Payment Receipt | CMF',
    '<h2>Dear ' || up.first_name || ',</h2><p>Thank you for your EMI payment of Rs.2535.</p><br><p>Regards,<br>CMF Team</p>',
    'Dear ' || up.first_name || ', EMI payment Rs.2535 received. Balance: Rs.34850.',
    'sent', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '3 hours'
FROM loans l JOIN users u ON u.id = l.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE l.loan_number = 'LON1000001'
ON CONFLICT DO NOTHING;

INSERT INTO email_logs (email_number, recipient_email, recipient_name, subject, body_html, body_text, status, sent_at, opened_at)
SELECT generate_id('EML'), u.email, up.first_name || ' ' || up.last_name,
    'Congratulations! Your Loan Application APP1000001 is Approved | CMF',
    '<h2>Dear ' || up.first_name || ',</h2><p>Your loan application <strong>APP1000001</strong> has been <strong>APPROVED</strong> for Rs.50000.</p><br><p>Regards,<br>CMF Team</p>',
    'Dear ' || up.first_name || ', your loan application APP1000001 has been approved.',
    'sent', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '1 hour'
FROM applications a JOIN users u ON u.id = a.customer_id JOIN user_profiles up ON up.user_id = u.id
WHERE a.application_number = 'APP1000001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================

DO $$
DECLARE v INT;
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
    SELECT COUNT(*) INTO v FROM application_notes;        RAISE NOTICE 'Application Notes: %', v;
    SELECT COUNT(*) INTO v FROM application_documents;    RAISE NOTICE 'Application Documents: %', v;
    SELECT COUNT(*) INTO v FROM loans;                    RAISE NOTICE 'Loans: %', v;
    SELECT COUNT(*) INTO v FROM emi_schedules;            RAISE NOTICE 'EMI Schedules: %', v;
    SELECT COUNT(*) INTO v FROM disbursements;            RAISE NOTICE 'Disbursements: %', v;
    SELECT COUNT(*) INTO v FROM emi_payments;             RAISE NOTICE 'EMI Payments: %', v;
    SELECT COUNT(*) INTO v FROM penalties;                RAISE NOTICE 'Penalties: %', v;
    SELECT COUNT(*) INTO v FROM sms_templates;            RAISE NOTICE 'SMS Templates: %', v;
    SELECT COUNT(*) INTO v FROM email_templates;        RAISE NOTICE 'Email Templates: %', v;
    SELECT COUNT(*) INTO v FROM notifications;            RAISE NOTICE 'Notifications: %', v;
    SELECT COUNT(*) INTO v FROM referrals;                RAISE NOTICE 'Referrals: %', v;
    SELECT COUNT(*) INTO v FROM trust_scores;             RAISE NOTICE 'Trust Scores: %', v;
    SELECT COUNT(*) INTO v FROM verification_tasks;       RAISE NOTICE 'Verification Tasks: %', v;
    SELECT COUNT(*) INTO v FROM npa_classifications;      RAISE NOTICE 'NPA Classifications: %', v;
    SELECT COUNT(*) INTO v FROM ledger_entries;           RAISE NOTICE 'Ledger Entries: %', v;
    SELECT COUNT(*) INTO v FROM ledger_entry_lines;       RAISE NOTICE 'Ledger Entry Lines: %', v;
    SELECT COUNT(*) INTO v FROM approval_limits;          RAISE NOTICE 'Approval Limits: %', v;
    SELECT COUNT(*) INTO v FROM disbursement_charges;     RAISE NOTICE 'Disbursement Charges: %', v;
    SELECT COUNT(*) INTO v FROM bank_statement_entries;   RAISE NOTICE 'Bank Statement Entries: %', v;
    SELECT COUNT(*) INTO v FROM audit_logs;               RAISE NOTICE 'Audit Logs: %', v;
    SELECT COUNT(*) INTO v FROM sms_logs;                 RAISE NOTICE 'SMS Logs: %', v;
    SELECT COUNT(*) INTO v FROM email_logs;               RAISE NOTICE 'Email Logs: %', v;
    SELECT COUNT(*) INTO v FROM app_settings;             RAISE NOTICE 'App Settings: %', v;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  CHENNAI SEED DATA COMPLETED!';
    RAISE NOTICE '========================================';
END $$;





