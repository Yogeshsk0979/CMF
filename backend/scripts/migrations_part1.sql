-- MIGRATION PART 1: Tables only
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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

-- ID Counters
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
    ('AUD', 'audit_log', 0),
    ('ARE', 'area', 0),
    ('BRN', 'branch', 0),
    ('PRD', 'product', 0),
    ('ROF', 'role', 0);

SELECT 'PART 1A (counters + types) OK' AS result;