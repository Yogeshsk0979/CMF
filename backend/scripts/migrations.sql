-- ============================================================================
-- CMF Microfinance Platform — Database Migrations
-- Run in order: 001 → 002 → 003
-- ============================================================================


-- ============================================================================
-- MIGRATION 001: Core Schema (tables, functions, extensions)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for text search

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role_enum AS ENUM (
    'super_admin',
    'branch_admin',
    'team_leader',
    'field_officer',
    'collection_agent',
    'customer',
    'lender'
);

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE marital_status_enum AS ENUM ('single', 'married', 'widowed', 'divorced');
CREATE TYPE education_enum AS ENUM ('none', 'primary', 'secondary', 'higher_secondary', 'graduate', 'post_graduate', 'diploma', 'professional');
CREATE TYPE employment_type_enum AS ENUM ('self_employed', 'salaried', 'business', 'agriculture', 'daily_wage', 'retired', 'unemployed');
CREATE TYPE account_type_enum AS ENUM ('savings', 'current', 'salary', 'fixed_deposit');
CREATE TYPE address_type_enum AS ENUM ('permanent', 'current', 'work');

-- ============================================================================
-- 0. ID NUMBERING SYSTEM
-- ============================================================================

CREATE TABLE id_counters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix          VARCHAR(3) UNIQUE NOT NULL,
    entity_name     VARCHAR(50) NOT NULL,
    current_value   BIGINT NOT NULL DEFAULT 0,
    padding_length  INTEGER NOT NULL DEFAULT 7,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

INSERT INTO id_counters (prefix, entity_name, current_value) VALUES
    ('CMF', 'customer', 0),
    ('APP', 'application', 0),
    ('LON', 'loan', 0),
    ('DSB', 'disbursement', 0),
    ('PAY', 'emi_payment', 0),
    ('RCP', 'payment_receipt', 0),
    ('PEN', 'penalty', 0),
    ('LDG', 'ledger_entry', 0),
    ('TSK', 'verification_task', 0),
    ('VER', 'verification_report', 0),
    ('SMS', 'sms_log', 0),
    ('EML', 'email_log', 0),
    ('REF', 'referral', 0),
    ('CHG', 'disbursement_charge', 0),
    ('NPA', 'npa_classification', 0),
    ('REC', 'bank_reconciliation', 0),
    ('AUD', 'audit_log', 0);

-- Atomic ID generation function
-- Usage: SELECT generate_id('APP') → 'APP1000001'
CREATE OR REPLACE FUNCTION generate_id(p_prefix VARCHAR(3))
RETURNS VARCHAR(10) AS $$
DECLARE
    v_new_value BIGINT;
    v_result VARCHAR(10);
BEGIN
    -- Atomically increment and get the new value
    UPDATE id_counters
    SET current_value = current_value + 1,
        updated_at = NOW()
    WHERE prefix = UPPER(p_prefix) AND is_active = true
    RETURNING current_value INTO v_new_value;

    IF v_new_value IS NULL THEN
        RAISE EXCEPTION 'No active counter found for prefix: %', p_prefix;
    END IF;

    -- Format: prefix + zero-padded 7-digit number
    v_result := UPPER(p_prefix) || LPAD(v_new_value::TEXT, 7, '0');

    -- Ensure result is exactly 10 characters
    IF LENGTH(v_result) != 10 THEN
        RAISE EXCEPTION 'Generated ID length invalid: %', v_result;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BRANCHES
-- ============================================================================

CREATE TABLE branches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code     VARCHAR(10) NOT NULL,  -- 10-digit ID (CMF branch code)
    branch_name     VARCHAR(255) NOT NULL,
    branch_type     VARCHAR(50) DEFAULT 'head_office',  -- head_office, regional, branch, unit
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100) DEFAULT 'Tamil Nadu',
    pincode         VARCHAR(10),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    manager_id      UUID,  -- references users.id
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(branch_code)
);

CREATE INDEX idx_branches_code ON branches(branch_code);
CREATE INDEX idx_branches_active ON branches(is_active);

-- ============================================================================
-- AREAS
-- ============================================================================

CREATE TABLE areas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_code       VARCHAR(10) NOT NULL,
    area_name       VARCHAR(255) NOT NULL,
    area_type       VARCHAR(50) DEFAULT 'urban',
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    pincode         VARCHAR(10),
    city            VARCHAR(100),
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    description     TEXT,
    total_customers INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(area_code)
);

CREATE INDEX idx_areas_branch ON areas(branch_id);
CREATE INDEX idx_areas_active ON areas(is_active);

-- ============================================================================
-- LOAN PRODUCTS
-- ============================================================================

CREATE TABLE loan_products (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code            VARCHAR(10) NOT NULL,
    product_name            VARCHAR(255) NOT NULL,
    category                VARCHAR(100),  -- personal, business, agriculture, education, emergency
    description             TEXT,
    min_loan_amount         DECIMAL(14,2) NOT NULL,
    max_loan_amount         DECIMAL(14,2) NOT NULL,
    min_tenure_months       INTEGER NOT NULL,
    max_tenure_months       INTEGER NOT NULL,
    min_interest_rate       DECIMAL(5,2) NOT NULL,  -- annual %
    max_interest_rate       DECIMAL(5,2) NOT NULL,
    interest_type           VARCHAR(20) DEFAULT 'reducing',  -- reducing, flat
    processing_fee_type     VARCHAR(20),  -- percentage, flat
    processing_fee_value    DECIMAL(10,2) DEFAULT 0,
    processing_fee_min      DECIMAL(14,2) DEFAULT 0,
    processing_fee_max      DECIMAL(14,2),
    document_charge_type    VARCHAR(20),
    document_charge_value   DECIMAL(10,2) DEFAULT 0,
    insurance_type          VARCHAR(20),
    insurance_value         DECIMAL(10,2) DEFAULT 0,
    disbursement_mode       VARCHAR(20) DEFAULT 'bank_transfer',  -- bank_transfer, cash, cheque
    prepayment_allowed      BOOLEAN DEFAULT true,
    foreclosure_allowed     BOOLEAN DEFAULT true,
    foreclosure_charge_pct  DECIMAL(5,2) DEFAULT 0,
    late_payment_penalty_type VARCHAR(20),  -- percentage, flat
    late_payment_penalty_value DECIMAL(10,2) DEFAULT 0,
    late_payment_grace_days INTEGER DEFAULT 0,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),

    UNIQUE(product_code)
);

-- ============================================================================
-- PRODUCT SLABS (dynamic interest/charges based on loan amount)
-- ============================================================================

CREATE TABLE product_slabs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES loan_products(id) ON DELETE CASCADE,
    slab_code           VARCHAR(10) NOT NULL,
    slab_name           VARCHAR(255) NOT NULL,
    slab_order          INTEGER NOT NULL,
    min_amount          DECIMAL(14,2) NOT NULL,
    max_amount          DECIMAL(14,2),
    interest_rate       DECIMAL(5,2) NOT NULL,
    processing_fee_pct  DECIMAL(5,2),  -- optional % override
    processing_fee_flat DECIMAL(14,2),  -- optional flat override
    document_charge     DECIMAL(10,2) DEFAULT 0,
    insurance_pct       DECIMAL(5,2) DEFAULT 0,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(product_id, slab_code),
    CHECK (min_amount < COALESCE(max_amount, 9999999999.99))
);

CREATE INDEX idx_product_slabs_product ON product_slabs(product_id);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code   VARCHAR(10) UNIQUE,  -- 10-digit ID (CMF1000001)
    username        VARCHAR(100) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(20) UNIQUE NOT NULL,
    alternate_phone VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role_enum NOT NULL DEFAULT 'customer',
    is_active       BOOLEAN DEFAULT true,
    is_verified     BOOLEAN DEFAULT false,
    email_verified  BOOLEAN DEFAULT false,
    phone_verified  BOOLEAN DEFAULT false,
    last_login_at   TIMESTAMP,
    created_by      UUID,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(customer_code)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================================================
-- USER PROFILES
-- ============================================================================

CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name          VARCHAR(100),
    middle_name         VARCHAR(100),
    last_name           VARCHAR(100) NOT NULL,
    date_of_birth       DATE,
    gender              gender_enum,
    marital_status      marital_status_enum,
    blood_group         VARCHAR(10),
    aadhaar_number      VARCHAR(12),
    aadhaar_verified    BOOLEAN DEFAULT false,
    aadhaar_verified_at TIMESTAMP,
    pan_number          VARCHAR(10),
    pan_verified        BOOLEAN DEFAULT false,
    voter_id            VARCHAR(50),
    ckyc_number         VARCHAR(20),
    ckyc_verified       BOOLEAN DEFAULT false,
    photo_url           VARCHAR(500),
    address             JSONB DEFAULT '{}',  -- {permanent: {...}, current: {...}}
    emergency_contact   JSONB DEFAULT '{}',  -- {name, phone, relation}
    profile_completed    BOOLEAN DEFAULT false,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- ROLES
-- ============================================================================

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system_role  BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(name)
);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    display_name    VARCHAR(150) NOT NULL,
    module          VARCHAR(50) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(name)
);

-- ============================================================================
-- ROLE-PERMISSION MAPPING
-- ============================================================================

CREATE TABLE role_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted      BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- ============================================================================
-- USER-PERMISSION OVERRIDES
-- ============================================================================

CREATE TABLE user_permission_overrides (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted      BOOLEAN NOT NULL,
    reason          TEXT,
    granted_by      UUID,
    granted_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, permission_id)
);

-- ============================================================================
-- USER-AREA ASSIGNMENT
-- ============================================================================

CREATE TABLE user_areas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area_id         UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    is_primary      BOOLEAN DEFAULT false,
    assigned_at     TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, area_id)
);

-- ============================================================================
-- PASSWORD RESET TOKENS
-- ============================================================================

CREATE TABLE password_reset_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    used_at         TIMESTAMP,
    ip_address      VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);

-- ============================================================================
-- JWT REFRESH TOKENS
-- ============================================================================

CREATE TABLE jwt_refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(500) UNIQUE NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    revoked_at      TIMESTAMP,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- LOGIN AUDIT
-- ============================================================================

CREATE TABLE login_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_at        TIMESTAMP DEFAULT NOW(),
    logout_at       TIMESTAMP,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    success         BOOLEAN NOT NULL,
    failure_reason  VARCHAR(255)
);

-- ============================================================================
-- BANK ACCOUNTS (managed by company)
-- ============================================================================

CREATE TABLE bank_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code        VARCHAR(10) NOT NULL,
    bank_name           VARCHAR(255) NOT NULL,
    account_number      VARCHAR(50) NOT NULL,
    account_name        VARCHAR(255) NOT NULL,
    account_type        account_type_enum DEFAULT 'savings',
    branch_name         VARCHAR(255),
    ifsc_code           VARCHAR(20),
    micr_code           VARCHAR(20),
    opening_balance     DECIMAL(16,2) DEFAULT 0,
    current_balance     DECIMAL(16,2) DEFAULT 0,
    is_primary          BOOLEAN DEFAULT false,
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(account_code)
);

CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);
CREATE INDEX idx_bank_accounts_bank ON bank_accounts(bank_name);

-- ============================================================================
-- APPLICATIONS
-- ============================================================================

CREATE TABLE applications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number      VARCHAR(10) NOT NULL,
    customer_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id              UUID REFERENCES loan_products(id),
    branch_id               UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    area_id                 UUID REFERENCES areas(id),
    created_by              UUID NOT NULL REFERENCES users(id),
    loan_amount             DECIMAL(14,2),
    tenure_months           INTEGER,
    interest_rate           DECIMAL(5,2),
    emi_amount              DECIMAL(14,2),
    status                  VARCHAR(30) DEFAULT 'draft',
    -- draft, submitted, in_review, query_raised, approved, rejected, disbursed, closed, withdrawn
    current_stage_id        UUID,
    submitted_at            TIMESTAMP,
    approved_at             TIMESTAMP,
    approved_by             UUID REFERENCES users(id),
    reviewed_by             UUID REFERENCES users(id),
    disbursed_at            TIMESTAMP,
    disbursed_by            UUID REFERENCES users(id),
    cibil_score             INTEGER,
    eligibility_score       DECIMAL(5,2),
    total_household_income  DECIMAL(14,2),
    trust_score             INTEGER,
    rejection_reason        TEXT,
    notes                   TEXT,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),

    UNIQUE(application_number),
    CHECK (loan_amount IS NULL OR loan_amount > 0)
);

CREATE INDEX idx_applications_number ON applications(application_number);
CREATE INDEX idx_applications_customer ON applications(customer_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_branch ON applications(branch_id);
CREATE INDEX idx_applications_created ON applications(created_at DESC);
CREATE INDEX idx_applications_customer_status ON applications(customer_id, status);

-- ============================================================================
-- APPLICATION TOPICS (16 topics per application)
-- ============================================================================

CREATE TABLE application_topics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    topic_code          VARCHAR(50) NOT NULL,
    topic_name          VARCHAR(255) NOT NULL,
    topic_order         INTEGER NOT NULL,
    topic_data          JSONB DEFAULT '{}',
    is_completed        BOOLEAN DEFAULT false,
    completion_pct      INTEGER DEFAULT 0,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(application_id, topic_code)
);

-- ============================================================================
-- APPLICATION STAGES
-- ============================================================================

CREATE TABLE stages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    stage_order         INTEGER NOT NULL,
    required_roles      TEXT[],  -- ['reviewer', 'approver']
    sla_hours           INTEGER DEFAULT 0,
    is_mandatory        BOOLEAN DEFAULT true,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Seed standard stages
INSERT INTO stages (code, name, description, stage_order, required_roles, sla_hours) VALUES
    ('new_application', 'New Application', 'Application submitted by field officer', 1, ARRAY['field_officer'], 0),
    ('document_verification', 'Document Verification', 'Verify all submitted documents', 2, ARRAY['field_officer', 'team_leader'], 24),
    ('field_verification', 'Field Verification', 'Physical verification of applicant', 3, ARRAY['field_officer'], 48),
    ('credit_assessment', 'Credit Assessment', 'Evaluate creditworthiness', 4, ARRAY['team_leader', 'branch_admin'], 48),
    ('committee_review', 'Committee Review', 'Review committee assessment', 5, ARRAY['branch_admin', 'super_admin'], 72),
    ('approval', 'Approval', 'Final approval authority', 6, ARRAY['branch_admin', 'super_admin'], 48),
    ('disbursement', 'Disbursement', 'Process disbursement', 7, ARRAY['branch_admin'], 24);

-- ============================================================================
-- APPLICATION STAGE HISTORY
-- ============================================================================

CREATE TABLE application_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage_id        UUID NOT NULL REFERENCES stages(id),
    assigned_to     UUID REFERENCES users(id),
    assigned_at     TIMESTAMP DEFAULT NOW(),
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'pending',
    -- pending, in_progress, completed, skipped, returned
    notes           TEXT,
    return_reason   TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_application_stages_app ON application_stages(application_id);

-- ============================================================================
-- STAGE TRANSITIONS
-- ============================================================================

CREATE TABLE stage_transitions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_stage_id       UUID REFERENCES stages(id),
    to_stage_id         UUID NOT NULL REFERENCES stages(id),
    action              VARCHAR(30),  -- approve, reject, query, return, assign, complete
    performed_by        UUID REFERENCES users(id),
    remarks             TEXT,
    performed_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stage_transitions_app ON stage_transitions(application_id, performed_at DESC);

-- ============================================================================
-- APPROVAL LIMITS
-- ============================================================================

CREATE TABLE approval_limits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES roles(id),
    max_amount      DECIMAL(14,2) NOT NULL,
    min_amount      DECIMAL(14,2) DEFAULT 0,
    max_tenure      INTEGER,
    product_id      UUID REFERENCES loan_products(id),
    is_active       BOOLEAN DEFAULT true,
    effective_from  DATE DEFAULT CURRENT_DATE,
    effective_to    DATE,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    CHECK (max_amount > min_amount)
);

-- ============================================================================
-- APPROVAL HISTORY
-- ============================================================================

CREATE TABLE approval_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    level           INTEGER NOT NULL,
    approver_id     UUID REFERENCES users(id),
    role_at_time    VARCHAR(50),
    limit_amount    DECIMAL(14,2),
    action          VARCHAR(30),  -- approved, rejected, forwarded, query_raised
    remarks         TEXT,
    acted_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- APPLICATION NOTES
-- ============================================================================

CREATE TABLE application_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    note_type       VARCHAR(30),  -- general, query, remark, document_required
    note_text       TEXT NOT NULL,
    is_internal     BOOLEAN DEFAULT true,
    is_resolved     BOOLEAN DEFAULT false,
    resolved_at     TIMESTAMP,
    added_by        UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- APPLICATION DOCUMENTS
-- ============================================================================

CREATE TABLE application_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type   VARCHAR(100) NOT NULL,
    document_name   VARCHAR(255),
    file_path       VARCHAR(500) NOT NULL,
    file_size       BIGINT,
    mime_type       VARCHAR(100),
    is_verified     BOOLEAN DEFAULT false,
    verified_by     UUID REFERENCES users(id),
    verified_at     TIMESTAMP,
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_app_documents_app ON application_documents(application_id);

-- ============================================================================
-- LOANS
-- ============================================================================

CREATE TABLE loans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_number             VARCHAR(10) NOT NULL,
    application_id          UUID NOT NULL REFERENCES applications(id),
    customer_id             UUID NOT NULL REFERENCES users(id),
    product_id              UUID NOT NULL REFERENCES loan_products(id),
    branch_id               UUID NOT NULL REFERENCES branches(id),
    area_id                 UUID REFERENCES areas(id),
    disbursement_id         UUID REFERENCES disbursements(id),
    loan_amount             DECIMAL(14,2) NOT NULL,
    approved_amount         DECIMAL(14,2),
    tenure_months           INTEGER NOT NULL,
    interest_rate           DECIMAL(5,2) NOT NULL,
    interest_type           VARCHAR(20) DEFAULT 'reducing',
    emi_amount              DECIMAL(14,2) NOT NULL,
    total_interest          DECIMAL(14,2),
    total_payable           DECIMAL(16,2),
    total_charges           DECIMAL(14,2),
    disbursement_net_amount DECIMAL(14,2),
    total_disbursed         DECIMAL(14,2),
    principal_paid          DECIMAL(14,2) DEFAULT 0,
    interest_paid           DECIMAL(14,2) DEFAULT 0,
    charges_paid            DECIMAL(14,2) DEFAULT 0,
    penalty_collected       DECIMAL(14,2) DEFAULT 0,
    outstanding_principal   DECIMAL(14,2),
    outstanding_total       DECIMAL(16,2),
    emi_paid_count          INTEGER DEFAULT 0,
    total_emis              INTEGER NOT NULL,
    overdue_emis            INTEGER DEFAULT 0,
    first_emi_date          DATE,
    last_emi_date           DATE,
    status                  VARCHAR(30) DEFAULT 'disbursed',
    -- disbursed, active, completed, foreclosed, written_off, npa
    foreclosure_date        DATE,
    closure_date            DATE,
    npa_classification      UUID,
    created_by              UUID,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),

    UNIQUE(loan_number),
    CHECK (loan_amount > 0),
    CHECK (emi_amount > 0)
);

CREATE INDEX idx_loans_number ON loans(loan_number);
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_branch ON loans(branch_id);
CREATE INDEX idx_loans_product ON loans(product_id);

-- ============================================================================
-- EMI SCHEDULES
-- ============================================================================

CREATE TABLE emi_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    emi_number      INTEGER NOT NULL,
    due_date        DATE NOT NULL,
    emi_amount      DECIMAL(14,2) NOT NULL,
    principal       DECIMAL(14,2) NOT NULL,
    interest        DECIMAL(14,2) NOT NULL,
    opening_balance DECIMAL(14,2) NOT NULL,
    closing_balance DECIMAL(14,2) NOT NULL,
    is_paid         BOOLEAN DEFAULT false,
    paid_on         DATE,
    paid_amount     DECIMAL(14,2),
    is_overdue      BOOLEAN DEFAULT false,
    penalty_applied DECIMAL(14,2) DEFAULT 0,
    days_overdue    INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(loan_id, emi_number)
);

CREATE INDEX idx_emi_schedules_loan ON emi_schedules(loan_id);
CREATE INDEX idx_emi_schedules_due ON emi_schedules(due_date, is_paid);

-- ============================================================================
-- EMI PAYMENTS
-- ============================================================================

CREATE TABLE emi_payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number      VARCHAR(10) NOT NULL,
    loan_id             UUID NOT NULL REFERENCES loans(id),
    emi_schedule_id     UUID REFERENCES emi_schedules(id),
    customer_id         UUID NOT NULL REFERENCES users(id),
    payment_amount      DECIMAL(14,2) NOT NULL,
    principal_component DECIMAL(14,2) DEFAULT 0,
    interest_component  DECIMAL(14,2) DEFAULT 0,
    penalty_component   DECIMAL(14,2) DEFAULT 0,
    payment_method      VARCHAR(30) DEFAULT 'cash',
    -- cash, bank_transfer, upi, cheque, card
    bank_account_id     UUID REFERENCES bank_accounts(id),
    transaction_ref     VARCHAR(255),
    payment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by         UUID REFERENCES users(id),
    is_verified         BOOLEAN DEFAULT true,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(payment_number)
);

CREATE INDEX idx_emi_payments_loan ON emi_payments(loan_id);
CREATE INDEX idx_emi_payments_customer ON emi_payments(customer_id);
CREATE INDEX idx_emi_payments_date ON emi_payments(payment_date DESC);

-- ============================================================================
-- PAYMENT RECEIPTS
-- ============================================================================

CREATE TABLE payment_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number  VARCHAR(10) NOT NULL,
    emi_payment_id  UUID NOT NULL REFERENCES emi_payments(id),
    loan_id         UUID NOT NULL REFERENCES loans(id),
    customer_id     UUID NOT NULL REFERENCES users(id),
    receipt_amount  DECIMAL(14,2) NOT NULL,
    receipt_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_type    VARCHAR(30) DEFAULT 'emi',  -- emi, penalty, partial, settlement
    pdf_path        VARCHAR(500),
    is_emailed      BOOLEAN DEFAULT false,
    is_sms_sent     BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(receipt_number)
);

CREATE INDEX idx_receipts_payment ON payment_receipts(emi_payment_id);

-- ============================================================================
-- PENALTIES
-- ============================================================================

CREATE TABLE penalties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    penalty_number      VARCHAR(10) NOT NULL,
    loan_id             UUID NOT NULL REFERENCES loans(id),
    emi_schedule_id     UUID REFERENCES emi_schedules(id),
    customer_id         UUID NOT NULL REFERENCES users(id),
    penalty_type        VARCHAR(30) NOT NULL,
    -- late_payment, bounced_cheque, legal
    penalty_amount      DECIMAL(14,2) NOT NULL,
    waived_amount       DECIMAL(14,2) DEFAULT 0,
    final_amount        DECIMAL(14,2) NOT NULL,
    penalty_date        DATE NOT NULL,
    due_date            DATE NOT NULL,
    is_paid             BOOLEAN DEFAULT false,
    paid_on             DATE,
    is_waived           BOOLEAN DEFAULT false,
    waived_by           UUID REFERENCES users(id),
    waiver_reason       TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(penalty_number)
);

CREATE INDEX idx_penalties_loan ON penalties(loan_id);
CREATE INDEX idx_penalties_customer ON penalties(customer_id);
CREATE INDEX idx_penalties_due ON penalties(due_date, is_paid);

-- ============================================================================
-- DISBURSEMENTS
-- ============================================================================

CREATE TABLE disbursements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disbursement_number     VARCHAR(10) NOT NULL,
    loan_id                 UUID NOT NULL REFERENCES loans(id),
    application_id          UUID NOT NULL REFERENCES applications(id),
    customer_id             UUID NOT NULL REFERENCES users(id),
    product_id              UUID NOT NULL REFERENCES loan_products(id),
    branch_id               UUID NOT NULL REFERENCES branches(id),
    bank_account_id         UUID NOT NULL REFERENCES bank_accounts(id),
    loan_amount             DECIMAL(14,2) NOT NULL,
    processing_fee          DECIMAL(14,2) DEFAULT 0,
    document_charge         DECIMAL(14,2) DEFAULT 0,
    insurance_amount        DECIMAL(14,2) DEFAULT 0,
    other_charges           DECIMAL(14,2) DEFAULT 0,
    total_charges           DECIMAL(14,2) NOT NULL,
    net_disbursement_amount DECIMAL(14,2) NOT NULL,
    disbursement_mode       VARCHAR(20) DEFAULT 'bank_transfer',
    utr_number              VARCHAR(100),
    disbursement_date       DATE NOT NULL,
    approved_by             UUID REFERENCES users(id),
    processed_by            UUID REFERENCES users(id),
    status                  VARCHAR(30) DEFAULT 'pending',
    -- pending, approved, processing, completed, failed, cancelled
    status_changed_at       TIMESTAMP,
    failure_reason          TEXT,
    notes                   TEXT,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),

    UNIQUE(disbursement_number)
);

-- ============================================================================
-- DISBURSEMENT CHARGES
-- ============================================================================

CREATE TABLE disbursement_charges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_number       VARCHAR(10) NOT NULL,
    disbursement_id     UUID NOT NULL REFERENCES disbursements(id) ON DELETE CASCADE,
    charge_type         VARCHAR(30) NOT NULL,
    -- processing_fee, document_charge, insurance, other
    charge_head         VARCHAR(255),
    calculation_type    VARCHAR(20),  -- percentage, flat, slab
    base_amount         DECIMAL(14,2),
    rate_pct            DECIMAL(5,2),
    flat_amount         DECIMAL(14,2),
    charge_amount       DECIMAL(14,2) NOT NULL,
    slab_id             UUID,
    cgst_pct            DECIMAL(5,2) DEFAULT 0,
    sgst_pct            DECIMAL(5,2) DEFAULT 0,
    cgst_amount         DECIMAL(10,2) DEFAULT 0,
    sgst_amount         DECIMAL(10,2) DEFAULT 0,
    total_amount        DECIMAL(14,2) NOT NULL,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(charge_number)
);

-- ============================================================================
-- LEDGER ACCOUNTS
-- ============================================================================

CREATE TABLE ledger_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code        VARCHAR(10) NOT NULL,
    account_name        VARCHAR(255) NOT NULL,
    account_group       VARCHAR(100) NOT NULL,
    -- assets, liabilities, income, expenses, equity
    parent_account_id   UUID REFERENCES ledger_accounts(id),
    account_type        VARCHAR(50),  -- direct, indirect, contra
    is_active           BOOLEAN DEFAULT true,
    is_system           BOOLEAN DEFAULT false,
    opening_balance     DECIMAL(16,2) DEFAULT 0,
    current_balance     DECIMAL(16,2) DEFAULT 0,
    description         TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(account_code)
);

CREATE INDEX idx_ledger_accounts_group ON ledger_accounts(account_group);

-- ============================================================================
-- LEDGER ENTRIES
-- ============================================================================

CREATE TABLE ledger_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number        VARCHAR(10) NOT NULL,
    entry_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    description         VARCHAR(500) NOT NULL,
    reference_type      VARCHAR(50),  -- disbursement, emi_payment, penalty, expense
    reference_id        UUID,
    reference_number    VARCHAR(30),
    narration           TEXT,
    created_by          UUID,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(entry_number)
);

CREATE INDEX idx_ledger_entries_date ON ledger_entries(entry_date DESC);
CREATE INDEX idx_ledger_entries_reference ON ledger_entries(reference_type, reference_id);

-- ============================================================================
-- LEDGER ENTRY LINES
-- ============================================================================

CREATE TABLE ledger_entry_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_entry_id     UUID NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES ledger_accounts(id),
    debit_amount        DECIMAL(16,2) DEFAULT 0,
    credit_amount       DECIMAL(16,2) DEFAULT 0,
    line_order          INTEGER NOT NULL,
    narration           TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),

    CHECK (debit_amount >= 0 AND credit_amount >= 0),
    CHECK (NOT (debit_amount > 0 AND credit_amount > 0))
);

-- ============================================================================
-- LEDGER ACCOUNT BALANCES (for quick balance queries)
-- ============================================================================

CREATE TABLE ledger_account_balances (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id          UUID NOT NULL REFERENCES ledger_accounts(id),
    as_of_date          DATE NOT NULL,
    opening_balance     DECIMAL(16,2) NOT NULL,
    total_debit         DECIMAL(16,2) NOT NULL DEFAULT 0,
    total_credit        DECIMAL(16,2) NOT NULL DEFAULT 0,
    closing_balance     DECIMAL(16,2) NOT NULL,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(account_id, as_of_date)
);

-- ============================================================================
-- BANK STATEMENT ENTRIES
-- ============================================================================

CREATE TABLE bank_statement_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id     UUID NOT NULL REFERENCES bank_accounts(id),
    entry_date          DATE NOT NULL,
    description         VARCHAR(500),
    transaction_ref     VARCHAR(100),
    debit_amount        DECIMAL(16,2) DEFAULT 0,
    credit_amount       DECIMAL(16,2) DEFAULT 0,
    balance             DECIMAL(16,2) NOT NULL,
    entry_type          VARCHAR(20),  -- auto, manual
    is_reconciled       BOOLEAN DEFAULT false,
    reconciled_with_id  UUID,
    reconciled_at       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),

    CHECK (NOT (debit_amount > 0 AND credit_amount > 0))
);

CREATE INDEX idx_bank_statement_account ON bank_statement_entries(bank_account_id, entry_date DESC);

-- ============================================================================
-- BANK RECONCILIATIONS
-- ============================================================================

CREATE TABLE bank_reconciliations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_number VARCHAR(10) NOT NULL,
    bank_account_id     UUID NOT NULL REFERENCES bank_accounts(id),
    from_date           DATE NOT NULL,
    to_date             DATE NOT NULL,
    bank_closing_balance DECIMAL(16,2) NOT NULL,
    book_closing_balance DECIMAL(16,2) NOT NULL,
    difference          DECIMAL(16,2) DEFAULT 0,
    is_completed        BOOLEAN DEFAULT false,
    reconciled_by       UUID,
    completed_at        TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(reconciliation_number)
);

-- ============================================================================
-- NPA CLASSIFICATIONS
-- ============================================================================

CREATE TABLE npa_classifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    npa_number          VARCHAR(10) NOT NULL,
    loan_id             UUID NOT NULL REFERENCES loans(id),
    customer_id         UUID NOT NULL REFERENCES users(id),
    classification_date DATE NOT NULL,
    overdue_days        INTEGER NOT NULL,
    overdue_amount      DECIMAL(14,2) NOT NULL,
    npa_category        VARCHAR(20) NOT NULL,
    -- sub_standard, doubtful, loss
    substandard_days    INTEGER,
    doubtful_days       INTEGER,
    provision_amount    DECIMAL(14,2) DEFAULT 0,
    provision_pct       DECIMAL(5,2) DEFAULT 0,
    action_taken        TEXT,
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(npa_number),
    UNIQUE(loan_id)  -- one NPA record per loan
);

CREATE INDEX idx_npa_loan ON npa_classifications(loan_id);
CREATE INDEX idx_npa_date ON npa_classifications(classification_date DESC);

-- ============================================================================
-- REFERRALS
-- ============================================================================

CREATE TABLE referrals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_number     VARCHAR(10) NOT NULL,
    referrer_id         UUID NOT NULL REFERENCES users(id),
    referred_name       VARCHAR(255) NOT NULL,
    referred_phone      VARCHAR(20) NOT NULL,
    referred_address    TEXT,
    status              VARCHAR(30) DEFAULT 'pending',
    -- pending, contacted, applied, converted, not_interested
    converted_customer_id UUID REFERENCES users(id),
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(referral_number)
);

-- ============================================================================
-- TRUST SCORES
-- ============================================================================

CREATE TABLE trust_scores (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID NOT NULL REFERENCES users(id),
    application_id      UUID REFERENCES applications(id),
    team_score          INTEGER,
    community_score      INTEGER,
    repayment_history   INTEGER,
    overall_score       INTEGER,
    grade               VARCHAR(5),  -- A, B, C, D, E
    factors             JSONB DEFAULT '{}',
    calculated_by       UUID,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- VERIFICATION TASKS
-- ============================================================================

CREATE TABLE verification_tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number         VARCHAR(10) NOT NULL,
    application_id      UUID NOT NULL REFERENCES applications(id),
    task_type           VARCHAR(30) NOT NULL,
    -- field_verification, document_verification, collection, address_verification
    assigned_to         UUID NOT NULL REFERENCES users(id),
    assigned_by         UUID NOT NULL REFERENCES users(id),
    priority            VARCHAR(20) DEFAULT 'medium',
    -- low, medium, high, urgent
    scheduled_date      DATE,
    completed_date      DATE,
    status              VARCHAR(30) DEFAULT 'assigned',
    -- assigned, in_progress, completed, cancelled, overdue
    verification_data   JSONB DEFAULT '{}',
    photos              TEXT[],
    gps_latitude        DECIMAL(10,8),
    gps_longitude       DECIMAL(11,8),
    gps_accuracy        DECIMAL(10,2),
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(task_number)
);

CREATE INDEX idx_verification_tasks_assigned ON verification_tasks(assigned_to, status);

-- ============================================================================
-- VERIFICATIONS (results of verification tasks)
-- ============================================================================

CREATE TABLE verifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_number VARCHAR(10) NOT NULL,
    task_id             UUID NOT NULL REFERENCES verification_tasks(id),
    verification_type   VARCHAR(50) NOT NULL,
    result              VARCHAR(30) NOT NULL,
    -- verified, not_verified, partial, discrepancy_found
    applicant_present   BOOLEAN,
    address_matches     BOOLEAN,
    documents_verified  TEXT[],
    discrepancies       TEXT,
    recommendation      VARCHAR(30),
    risk_rating         VARCHAR(20),
    officer_rating      INTEGER,
    submitted_by        UUID NOT NULL REFERENCES users(id),
    submitted_at        TIMESTAMP DEFAULT NOW(),
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMP,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(verification_number)
);

-- ============================================================================
-- SMS TEMPLATES
-- ============================================================================

CREATE TABLE sms_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code   VARCHAR(10) NOT NULL,
    template_name   VARCHAR(255) NOT NULL,
    category        VARCHAR(50),  -- application, payment, reminder, disbursement
    language        VARCHAR(10) DEFAULT 'en',
    template_text   TEXT NOT NULL,
    variables       TEXT[],  -- ['{name}', '{amount}', '{date}']
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(template_code)
);

-- ============================================================================
-- SMS LOGS
-- ============================================================================

CREATE TABLE sms_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_number      VARCHAR(10) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_name  VARCHAR(255),
    template_id     UUID REFERENCES sms_templates(id),
    message_text    TEXT NOT NULL,
    template_vars   JSONB DEFAULT '{}',
    status          VARCHAR(30) DEFAULT 'pending',
    -- pending, sent, delivered, failed, bounced
    gateway_ref     VARCHAR(255),
    error_message   TEXT,
    sent_at         TIMESTAMP,
    delivered_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(sms_number)
);

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================

CREATE TABLE email_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code   VARCHAR(10) NOT NULL,
    template_name   VARCHAR(255) NOT NULL,
    category        VARCHAR(50),
    subject         VARCHAR(500) NOT NULL,
    html_body       TEXT NOT NULL,
    text_body       TEXT,
    variables       TEXT[],
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(template_code)
);

-- ============================================================================
-- EMAIL LOGS
-- ============================================================================

CREATE TABLE email_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_number    VARCHAR(10) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name  VARCHAR(255),
    template_id     UUID REFERENCES email_templates(id),
    subject         VARCHAR(500),
    body_html       TEXT,
    body_text       TEXT,
    status          VARCHAR(30) DEFAULT 'pending',
    gateway_ref     VARCHAR(255),
    error_message   TEXT,
    sent_at         TIMESTAMP,
    opened_at       TIMESTAMP,
    clicked_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(email_number)
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_number    VARCHAR(10) NOT NULL,
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50),  -- application, loan, disbursement, payment
    entity_id       UUID,
    entity_number   VARCHAR(30),
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(audit_number)
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- APP SETTINGS
-- ============================================================================

CREATE TABLE app_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key     VARCHAR(100) UNIQUE NOT NULL,
    setting_value   TEXT,
    setting_type    VARCHAR(20) DEFAULT 'string',  -- string, number, boolean, json
    description     TEXT,
    module          VARCHAR(50),
    is_editable     BOOLEAN DEFAULT true,
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_app_settings_key ON app_settings(setting_key);

-- ============================================================================
-- MIGRATION 002: Functions, Triggers, Indexes
-- ============================================================================

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I; CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl, tbl, tbl, tbl);
    END LOOP;
END;
$$;

-- Trigger to auto-generate 10-digit IDs on insert
CREATE OR REPLACE FUNCTION auto_generate_id()
RETURNS TRIGGER AS $$
DECLARE
    v_prefix VARCHAR(3);
    v_id_field VARCHAR(50);
BEGIN
    -- Determine which table and ID field we're dealing with
    IF TG_TABLE_NAME = 'users' AND NEW.customer_code IS NULL THEN
        SELECT generate_id('CMF') INTO NEW.customer_code;
    ELSIF TG_TABLE_NAME = 'applications' AND NEW.application_number IS NULL THEN
        SELECT generate_id('APP') INTO NEW.application_number;
    ELSIF TG_TABLE_NAME = 'loans' AND NEW.loan_number IS NULL THEN
        SELECT generate_id('LON') INTO NEW.loan_number;
    ELSIF TG_TABLE_NAME = 'disbursements' AND NEW.disbursement_number IS NULL THEN
        SELECT generate_id('DSB') INTO NEW.disbursement_number;
    ELSIF TG_TABLE_NAME = 'emi_payments' AND NEW.payment_number IS NULL THEN
        SELECT generate_id('PAY') INTO NEW.payment_number;
    ELSIF TG_TABLE_NAME = 'payment_receipts' AND NEW.receipt_number IS NULL THEN
        SELECT generate_id('RCP') INTO NEW.receipt_number;
    ELSIF TG_TABLE_NAME = 'penalties' AND NEW.penalty_number IS NULL THEN
        SELECT generate_id('PEN') INTO NEW.penalty_number;
    ELSIF TG_TABLE_NAME = 'ledger_entries' AND NEW.entry_number IS NULL THEN
        SELECT generate_id('LDG') INTO NEW.entry_number;
    ELSIF TG_TABLE_NAME = 'verification_tasks' AND NEW.task_number IS NULL THEN
        SELECT generate_id('TSK') INTO NEW.task_number;
    ELSIF TG_TABLE_NAME = 'verifications' AND NEW.verification_number IS NULL THEN
        SELECT generate_id('VER') INTO NEW.verification_number;
    ELSIF TG_TABLE_NAME = 'sms_logs' AND NEW.sms_number IS NULL THEN
        SELECT generate_id('SMS') INTO NEW.sms_number;
    ELSIF TG_TABLE_NAME = 'email_logs' AND NEW.email_number IS NULL THEN
        SELECT generate_id('EML') INTO NEW.email_number;
    ELSIF TG_TABLE_NAME = 'referrals' AND NEW.referral_number IS NULL THEN
        SELECT generate_id('REF') INTO NEW.referral_number;
    ELSIF TG_TABLE_NAME = 'disbursement_charges' AND NEW.charge_number IS NULL THEN
        SELECT generate_id('CHG') INTO NEW.charge_number;
    ELSIF TG_TABLE_NAME = 'npa_classifications' AND NEW.npa_number IS NULL THEN
        SELECT generate_id('NPA') INTO NEW.npa_number;
    ELSIF TG_TABLE_NAME = 'bank_reconciliations' AND NEW.reconciliation_number IS NULL THEN
        SELECT generate_id('REC') INTO NEW.reconciliation_number;
    ELSIF TG_TABLE_NAME = 'audit_logs' AND NEW.audit_number IS NULL THEN
        SELECT generate_id('AUD') INTO NEW.audit_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-generate trigger
CREATE TRIGGER auto_generate_users_code BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_apps_number BEFORE INSERT ON applications FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_loans_number BEFORE INSERT ON loans FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_disb_number BEFORE INSERT ON disbursements FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_payments_number BEFORE INSERT ON emi_payments FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_receipts_number BEFORE INSERT ON payment_receipts FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_penalties_number BEFORE INSERT ON penalties FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_ledger_number BEFORE INSERT ON ledger_entries FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_tasks_number BEFORE INSERT ON verification_tasks FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_verifs_number BEFORE INSERT ON verifications FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_sms_number BEFORE INSERT ON sms_logs FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_email_number BEFORE INSERT ON email_logs FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_referrals_number BEFORE INSERT ON referrals FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_charges_number BEFORE INSERT ON disbursement_charges FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_npa_number BEFORE INSERT ON npa_classifications FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_recon_number BEFORE INSERT ON bank_reconciliations FOR EACH ROW EXECUTE FUNCTION auto_generate_id();
CREATE TRIGGER auto_generate_audit_number BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION auto_generate_id();

-- Update trigger for branch_code and area_code too
CREATE OR REPLACE FUNCTION auto_generate_area_branch_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.area_code IS NULL THEN
        SELECT generate_id('AREA') INTO NEW.area_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- EMI schedule: auto-calculate overdue status
CREATE OR REPLACE FUNCTION update_emi_overdue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.due_date < CURRENT_DATE AND NOT NEW.is_paid THEN
        NEW.is_overdue = true;
        NEW.days_overdue = (CURRENT_DATE - NEW.due_date);
    ELSE
        NEW.is_overdue = false;
        NEW.days_overdue = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_emi_overdue BEFORE INSERT OR UPDATE ON emi_schedules FOR EACH ROW EXECUTE FUNCTION update_emi_overdue();

-- Update ledger balance on entry
CREATE OR REPLACE FUNCTION update_ledger_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_account_id UUID;
    v_debit DECIMAL(16,2);
    v_credit DECIMAL(16,2);
BEGIN
    v_account_id := NEW.account_id;
    v_debit := COALESCE(NEW.debit_amount, 0);
    v_credit := COALESCE(NEW.credit_amount, 0);

    UPDATE ledger_accounts
    SET current_balance = current_balance + v_debit - v_credit
    WHERE id = v_account_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ledger_balance AFTER INSERT ON ledger_entry_lines FOR EACH ROW EXECUTE FUNCTION update_ledger_balance();

-- Auto-update area customer count
CREATE OR REPLACE FUNCTION update_area_customer_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'users' THEN
        UPDATE areas SET total_customers = total_customers + 1 WHERE id IN (
            SELECT area_id FROM user_areas WHERE user_id = NEW.id
        );
    ELSIF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'users' THEN
        UPDATE areas SET total_customers = total_customers - 1 WHERE id IN (
            SELECT area_id FROM user_areas WHERE user_id = OLD.id
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 003: Seed Data
-- ============================================================================

-- Seed Roles
INSERT INTO roles (id, name, display_name, description, is_system_role) VALUES
    (gen_random_uuid(), 'super_admin', 'Super Admin', 'Full system access', true),
    (gen_random_uuid(), 'branch_admin', 'Branch Admin', 'Branch-level management', true),
    (gen_random_uuid(), 'team_leader', 'Team Leader', 'Area & team management', true),
    (gen_random_uuid(), 'field_officer', 'Field Officer', 'Application creation & field verification', true),
    (gen_random_uuid(), 'collection_agent', 'Collection Agent', 'EMI collection', true),
    (gen_random_uuid(), 'customer', 'Customer', 'End user / borrower', true),
    (gen_random_uuid(), 'lender', 'Lender', 'Investor / funder', true);

-- Seed Permissions
INSERT INTO permissions (id, name, display_name, module, description) VALUES
    -- Dashboard
    (gen_random_uuid(), 'dashboard.view', 'View Dashboard', 'dashboard', 'Access to role-specific dashboard'),
    -- Branches
    (gen_random_uuid(), 'branches.view', 'View Branches', 'branches', 'View branch list'),
    (gen_random_uuid(), 'branches.create', 'Create Branch', 'branches', 'Create new branches'),
    (gen_random_uuid(), 'branches.edit', 'Edit Branch', 'branches', 'Edit branch details'),
    (gen_random_uuid(), 'branches.delete', 'Delete Branch', 'branches', 'Delete branches'),
    -- Areas
    (gen_random_uuid(), 'areas.view', 'View Areas', 'areas', 'View area list'),
    (gen_random_uuid(), 'areas.create', 'Create Area', 'areas', 'Create new areas'),
    (gen_random_uuid(), 'areas.edit', 'Edit Area', 'areas', 'Edit area details'),
    (gen_random_uuid(), 'areas.assign', 'Assign Leaders/Agents', 'areas', 'Assign area leaders and agents'),
    -- Users
    (gen_random_uuid(), 'users.view', 'View Users', 'users', 'View user list'),
    (gen_random_uuid(), 'users.create', 'Create User', 'users', 'Create new users'),
    (gen_random_uuid(), 'users.edit', 'Edit User', 'users', 'Edit user details'),
    (gen_random_uuid(), 'users.delete', 'Delete User', 'users', 'Delete users'),
    -- Products
    (gen_random_uuid(), 'products.view', 'View Products', 'products', 'View loan products'),
    (gen_random_uuid(), 'products.create', 'Create Product', 'products', 'Create loan products'),
    (gen_random_uuid(), 'products.edit', 'Edit Product', 'products', 'Edit loan products'),
    -- Applications
    (gen_random_uuid(), 'applications.view', 'View Applications', 'applications', 'View applications'),
    (gen_random_uuid(), 'applications.create', 'Create Application', 'applications', 'Create loan applications'),
    (gen_random_uuid(), 'applications.edit', 'Edit Application', 'applications', 'Edit applications (draft only)'),
    (gen_random_uuid(), 'applications.review', 'Review Application', 'applications', 'Review applications'),
    (gen_random_uuid(), 'applications.approve', 'Approve Application', 'applications', 'Approve applications'),
    (gen_random_uuid(), 'applications.reject', 'Reject Application', 'applications', 'Reject applications'),
    -- Disbursements
    (gen_random_uuid(), 'disbursements.view', 'View Disbursements', 'disbursements', 'View disbursements'),
    (gen_random_uuid(), 'disbursements.create', 'Create Disbursement', 'disbursements', 'Initiate disbursement'),
    (gen_random_uuid(), 'disbursements.approve', 'Approve Disbursement', 'disbursements', 'Approve disbursement'),
    -- EMI & Collection
    (gen_random_uuid(), 'emi.view', 'View EMI', 'emi', 'View EMI schedules and payments'),
    (gen_random_uuid(), 'emi.collect', 'Collect EMI', 'emi', 'Record EMI payments'),
    (gen_random_uuid(), 'emi.writeoff', 'Write Off Loan', 'emi', 'Write off loans'),
    -- Ledger
    (gen_random_uuid(), 'ledger.view', 'View Ledger', 'ledger', 'View ledger entries'),
    (gen_random_uuid(), 'ledger.create', 'Create Entry', 'ledger', 'Create manual ledger entries'),
    (gen_random_uuid(), 'ledger.journal', 'Journal Entry', 'ledger', 'Create journal entries'),
    -- Bank
    (gen_random_uuid(), 'banks.view', 'View Bank Accounts', 'banks', 'View bank accounts'),
    (gen_random_uuid(), 'banks.manage', 'Manage Bank Accounts', 'banks', 'Create/edit bank accounts'),
    (gen_random_uuid(), 'reconciliation.view', 'View Reconciliation', 'reconciliation', 'View reconciliations'),
    (gen_random_uuid(), 'reconciliation.perform', 'Perform Reconciliation', 'reconciliation', 'Perform bank reconciliation'),
    -- Tasks
    (gen_random_uuid(), 'tasks.view', 'View Tasks', 'tasks', 'View assigned tasks'),
    (gen_random_uuid(), 'tasks.assign', 'Assign Tasks', 'tasks', 'Assign tasks to field officers'),
    (gen_random_uuid(), 'tasks.complete', 'Complete Tasks', 'tasks', 'Complete tasks'),
    -- Communications
    (gen_random_uuid(), 'sms.view', 'View SMS', 'sms', 'View SMS logs'),
    (gen_random_uuid(), 'sms.send', 'Send SMS', 'sms', 'Send SMS messages'),
    (gen_random_uuid(), 'sms.templates', 'Manage SMS Templates', 'sms', 'Manage SMS templates'),
    (gen_random_uuid(), 'email.view', 'View Emails', 'email', 'View email logs'),
    (gen_random_uuid(), 'email.send', 'Send Email', 'email', 'Send email messages'),
    (gen_random_uuid(), 'email.templates', 'Manage Email Templates', 'email', 'Manage email templates'),
    -- Reports
    (gen_random_uuid(), 'reports.dashboard', 'Dashboard Reports', 'reports', 'View dashboard reports'),
    (gen_random_uuid(), 'reports.emi', 'EMI Reports', 'reports', 'View EMI reports'),
    (gen_random_uuid(), 'reports.collection', 'Collection Reports', 'reports', 'View collection reports'),
    (gen_random_uuid(), 'reports.loan', 'Loan Reports', 'reports', 'View loan portfolio reports'),
    (gen_random_uuid(), 'reports.ledger', 'Ledger Reports', 'reports', 'View ledger reports'),
    (gen_random_uuid(), 'reports.npa', 'NPA Reports', 'reports', 'View NPA reports'),
    (gen_random_uuid(), 'reports.audit', 'Audit Reports', 'reports', 'View audit logs'),
    -- Settings
    (gen_random_uuid(), 'settings.view', 'View Settings', 'settings', 'View settings pages'),
    (gen_random_uuid(), 'settings.roles', 'Manage Roles', 'settings', 'Manage roles and permissions'),
    (gen_random_uuid(), 'settings.system', 'System Settings', 'settings', 'System-level settings');

-- Seed Role-Permission mappings
INSERT INTO role_permissions (role_id, permission_id, is_granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name IN ('super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent', 'customer', 'lender');

-- (All roles get all permissions for now — backend will restrict by role logic)

-- Seed SMS Templates
INSERT INTO sms_templates (template_code, template_name, category, template_text, variables) VALUES
    ('APP_SUBMITTED', 'Application Submitted', 'application',
     'Dear {customer_name}, your loan application {app_number} for Rs.{amount} has been submitted successfully. Track at {url}.',
     ARRAY['{customer_name}', '{app_number}', '{amount}', '{url}']),
    ('APP_APPROVED', 'Application Approved', 'application',
     'Dear {customer_name}, your application {app_number} has been APPROVED for Rs.{amount}. Our team will contact you for disbursement.',
     ARRAY['{customer_name}', '{app_number}', '{amount}']),
    ('APP_REJECTED', 'Application Rejected', 'application',
     'Dear {customer_name}, we regret to inform that your application {app_number} was not approved. Reason: {reason}.',
     ARRAY['{customer_name}', '{app_number}', '{reason}']),
    ('EMI_DUE', 'EMI Due Reminder', 'payment',
     'Dear {customer_name}, your EMI of Rs.{amount} for loan {loan_number} is due on {due_date}. Please pay to avoid late fees.',
     ARRAY['{customer_name}', '{amount}', '{loan_number}', '{due_date}']),
    ('EMI_OVERDUE', 'EMI Overdue Alert', 'payment',
     'Dear {customer_name}, your EMI of Rs.{amount} for loan {loan_number} was due on {due_date} and is now {days} days overdue. Please pay immediately.',
     ARRAY['{customer_name}', '{amount}', '{loan_number}', '{due_date}', '{days}']),
    ('EMI_PAID', 'EMI Payment Confirmation', 'payment',
     'Dear {customer_name}, we have received your EMI payment of Rs.{amount} for loan {loan_number}. Receipt: {receipt_number}.',
     ARRAY['{customer_name}', '{amount}', '{loan_number}', '{receipt_number}']),
    ('DSB_COMPLETED', 'Disbursement Completed', 'disbursement',
     'Dear {customer_name}, your loan {loan_number} of Rs.{amount} has been disbursed to your account. Thank you for choosing CMF.',
     ARRAY['{customer_name}', '{loan_number}', '{amount}']),
    ('PENALTY_APPLIED', 'Penalty Applied', 'payment',
     'Dear {customer_name}, a late payment penalty of Rs.{penalty_amount} has been applied to your loan {loan_number} for EMI {emi_number}.',
     ARRAY['{customer_name}', '{penalty_amount}', '{loan_number}', '{emi_number}']),
    ('QUERY_RAISED', 'Query Raised on Application', 'application',
     'Dear {customer_name}, a query has been raised on your application {app_number}. Please submit the required documents. Query: {query_text}',
     ARRAY['{customer_name}', '{app_number}', '{query_text}']),
    ('PASSWORD_RESET', 'Password Reset', 'application',
     'Your password reset OTP is {otp}. Valid for 10 minutes. Do not share with anyone.',
     ARRAY['{otp}']);

-- Seed Email Templates
INSERT INTO email_templates (template_code, template_name, category, subject, html_body) VALUES
    ('APP_SUBMITTED', 'Application Submitted', 'application',
     'Your Loan Application Has Been Submitted | CMF',
     '<h2>Dear {customer_name},</h2><p>Your loan application <strong>{app_number}</strong> for Rs.{amount} has been submitted successfully.</p><p>We will review and get back to you within 2-3 working days.</p><p>Track your application at: <a href="{url}">{url}</a></p><br><p>Regards,<br>Continnum Micro Finance Team</p>'),
    ('APP_APPROVED', 'Application Approved', 'application',
     'Congratulations! Your Loan Application {app_number} is Approved | CMF',
     '<h2>Dear {customer_name},</h2><p>Congratulations! Your loan application <strong>{app_number}</strong> has been <strong>APPROVED</strong> for Rs.{amount}.</p><p>Our team will contact you soon for disbursement formalities.</p><br><p>Regards,<br>Continnum Micro Finance Team</p>'),
    ('APP_REJECTED', 'Application Rejected', 'application',
     'Loan Application {app_number} Update | CMF',
     '<h2>Dear {customer_name},</h2><p>We regret to inform you that your loan application <strong>{app_number}</strong> was not approved.</p><p><strong>Reason:</strong> {reason}</p><p>You can reapply after 30 days. Contact your branch for more details.</p><br><p>Regards,<br>Continnum Micro Finance Team</p>'),
    ('EMI_RECEIPT', 'EMI Payment Receipt', 'payment',
     'Your EMI Payment Receipt | CMF',
     '<h2>Dear {customer_name},</h2><p>Thank you for your payment.</p><p><strong>Loan:</strong> {loan_number}<br><strong>Amount:</strong> Rs.{amount}<br><strong>Date:</strong> {payment_date}<br><strong>Receipt:</strong> {receipt_number}</p><p>Download your receipt: <a href="{receipt_url}">Click here</a></p><br><p>Regards,<br>Continnum Micro Finance Team</p>'),
    ('DSB_STATEMENT', 'Disbursement Statement', 'disbursement',
     'Your Loan Disbursement Statement | CMF',
     '<h2>Dear {customer_name},</h2><p>Your loan <strong>{loan_number}</strong> has been disbursed.</p><p><strong>Loan Amount:</strong> Rs.{loan_amount}<br><strong>Charges:</strong> Rs.{charges}<br><strong>Net Disbursed:</strong> Rs.{net_amount}<br><strong>Date:</strong> {disbursement_date}</p><p>Your EMI schedule is attached.</p><br><p>Regards,<br>Continnum Micro Finance Team</p>'),
    ('PASSWORD_RESET', 'Password Reset', 'application',
     'Reset Your Password | CMF',
     '<h2>Dear User,</h2><p>You requested to reset your password. Click the link below to reset:</p><p><a href="{reset_url}">Reset Password</a></p><p>This link is valid for 10 minutes.</p><br><p>If you did not request this, please ignore this email.</p><br><p>Regards,<br>Continnum Micro Finance Team</p>');

-- ============================================================================
-- CREATE INDEXES for frequently queried columns
-- ============================================================================

CREATE INDEX idx_users_branch ON user_profiles(branch_id) WHERE branch_id IS NOT NULL;

-- Partial index for active applications
CREATE INDEX idx_applications_active ON applications(status, branch_id) WHERE status IN ('submitted', 'in_review', 'query_raised', 'approved');

-- Partial index for unpaid penalties
CREATE INDEX idx_penalties_unpaid ON penalties(is_paid = false, due_date);

-- Partial index for overdue EMIs
CREATE INDEX idx_emi_overdue ON emi_schedules(is_paid = false, due_date) WHERE due_date < CURRENT_DATE;

-- GIN index for JSONB columns
CREATE INDEX idx_application_topics_data ON application_topics USING GIN (topic_data);
CREATE INDEX idx_applications_metadata ON applications USING GIN (metadata);
CREATE INDEX idx_users_address ON user_profiles USING GIN (address);
CREATE INDEX idx_trust_scores_factors ON trust_scores USING GIN (factors);

SELECT 'All migrations completed successfully' AS result;
