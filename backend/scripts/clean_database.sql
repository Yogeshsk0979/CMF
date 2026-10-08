-- Drop all tables, functions, and types in the public schema
-- Run this first to clean the database before applying migrations

-- Drop all tables (order matters for foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS trust_scores CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS verification_tasks CASCADE;
DROP TABLE IF EXISTS application_documents CASCADE;
DROP TABLE IF EXISTS application_notes CASCADE;
DROP TABLE IF EXISTS stage_transitions CASCADE;
DROP TABLE IF EXISTS application_stages CASCADE;
DROP TABLE IF EXISTS application_topics CASCADE;
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS approval_limits CASCADE;
DROP TABLE IF EXISTS stages CASCADE;
DROP TABLE IF EXISTS disbursement_charges CASCADE;
DROP TABLE IF EXISTS disbursements CASCADE;
DROP TABLE IF EXISTS npa_classifications CASCADE;
DROP TABLE IF EXISTS penalties CASCADE;
DROP TABLE IF EXISTS emi_payments CASCADE;
DROP TABLE IF EXISTS payment_receipts CASCADE;
DROP TABLE IF EXISTS emi_schedules CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS bank_statement_entries CASCADE;
DROP TABLE IF EXISTS bank_reconciliations CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS ledger_entry_lines CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS ledger_accounts CASCADE;
DROP TABLE IF EXISTS ledger_account_balances CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS product_slabs CASCADE;
DROP TABLE IF EXISTS loan_products CASCADE;
DROP TABLE IF EXISTS user_permission_overrides CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_areas CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS login_audit CASCADE;
DROP TABLE IF EXISTS jwt_refresh_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS areas CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS id_counters CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_id(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS calculate_emi(DECIMAL, DECIMAL, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_loan_outstanding(UUID) CASCADE;
DROP FUNCTION IF EXISTS classify_npa() CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS application_number_seq CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role_enum CASCADE;

SELECT 'All tables dropped successfully' AS result;
