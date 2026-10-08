# CMF — Database Design
**Chennai Microfinance Platform — Complete DB Schema**

**Database Connection:**
```
postgres://postgres:Continnum@2026@db.kwkdpkewxldxcekeaaoh.supabase.co:5432/postgres
```

---

## 1. ID Numbering System

All business entities use a **10-digit alphanumeric ID** generated automatically by the `generate_id()` PostgreSQL function. The system uses an `id_counters` table for atomic, race-condition-safe ID generation.

### 1.1 ID Counter Table

```sql
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
```

### 1.2 ID Generation Function

```sql
CREATE OR REPLACE FUNCTION generate_id(p_prefix VARCHAR(3))
RETURNS VARCHAR(10) AS $$
DECLARE
    v_new_value BIGINT;
    v_result VARCHAR(10);
BEGIN
    UPDATE id_counters
    SET current_value = current_value + 1, updated_at = NOW()
    WHERE prefix = UPPER(p_prefix) AND is_active = true
    RETURNING current_value INTO v_new_value;

    IF v_new_value IS NULL THEN
        RAISE EXCEPTION 'No active counter found for prefix: %', p_prefix;
    END IF;

    v_result := UPPER(p_prefix) || LPAD(v_new_value::TEXT, 7, '0');

    IF LENGTH(v_result) != 10 THEN
        RAISE EXCEPTION 'Generated ID length invalid: %', v_result;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 ID Prefix Map

| Prefix | Entity | Table | Example |
|--------|--------|-------|---------|
| CMF | Customer (user_code) | users | CMF1000001 |
| APP | Applications | applications | APP1000001 |
| LON | Loans | loans | LON1000001 |
| DSB | Disbursements | disbursements | DSB1000001 |
| PAY | EMI Payments | emi_payments | PAY1000001 |
| RCP | Payment Receipts | payment_receipts | RCP1000001 |
| PEN | Penalties | penalties | PEN1000001 |
| LDG | Ledger Entries | ledger_entries | LDG1000001 |
| TSK | Verification Tasks | verification_tasks | TSK1000001 |
| VER | Verification Reports | verifications | VER1000001 |
| SMS | SMS Logs | sms_logs | SMS1000001 |
| EML | Email Logs | email_logs | EML1000001 |
| REF | Referrals | referrals | REF1000001 |
| CHG | Disbursement Charges | disbursement_charges | CHG1000001 |
| NPA | NPA Classifications | npa_classifications | NPA1000001 |
| REC | Bank Reconciliations | bank_reconciliations | REC1000001 |
| AUD | Audit Logs | audit_logs | AUD1000001 |

### 1.4 Auto-Generate Trigger

A single trigger function `auto_generate_id()` fires BEFORE INSERT on each table. If the ID field is NULL, it calls `generate_id()` with the appropriate prefix:

```sql
CREATE OR REPLACE FUNCTION auto_generate_id()
RETURNS TRIGGER AS $$
DECLARE
    v_prefix VARCHAR(3);
    v_id_field VARCHAR(50);
BEGIN
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
```

---

## 2. Module Grouping

| # | Module | Tables | Purpose |
|---|--------|--------|---------|
| 1 | **Authentication & Users** | users, user_profiles, roles, permissions, role_permissions, user_permission_overrides, user_areas, password_reset_tokens, jwt_refresh_tokens, login_audit | User identity, RBAC, auth tokens |
| 2 | **Geography & Branches** | branches, areas, loan_products, product_slabs | Branch management, areas, product catalog |
| 3 | **Applications** | applications, application_topics, application_documents, application_notes, application_queries, approval_history, stages, stage_transitions, approval_limits | Loan application lifecycle |
| 4 | **Loans & EMI** | loans, emi_schedules, emi_payments, payment_receipts, penalties | Active loans, EMI collection |
| 5 | **Disbursements** | disbursements, disbursement_charges | Fund release |
| 6 | **Ledger & Accounting** | ledger_accounts, ledger_entries, ledger_entry_lines, ledger_account_balances, bank_accounts, bank_statement_entries, bank_reconciliations | Double-entry bookkeeping |
| 7 | **Communication** | sms_templates, sms_logs, email_templates, email_logs | SMS & Email |
| 8 | **Verification** | verification_tasks, verifications | Field verification |
| 9 | **Reports & Audit** | audit_logs, trust_scores, referrals, npa_classifications, app_settings, id_counters | Analytics & system config |

---

## 3. Authentication & Users Module

### 3.1 `users`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
customer_code   VARCHAR(10) UNIQUE,           -- Auto: CMF1000001 (10-digit ID)
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
updated_at      TIMESTAMP DEFAULT NOW()
```

Indexes: `idx_users_role(role)`, `idx_users_active(is_active)`, `idx_users_email(email)`, `idx_users_phone(phone)`

Trigger: `auto_generate_users_code` — sets `customer_code` via `generate_id('CMF')`

### 3.2 `user_profiles`

```sql
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
address             JSONB DEFAULT '{}',      -- {permanent: {...}, current: {...}}
emergency_contact   JSONB DEFAULT '{}',      -- {name, phone, relation}
profile_completed    BOOLEAN DEFAULT false,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 3.3 `roles`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name            VARCHAR(50) NOT NULL,         -- super_admin|branch_admin|team_leader|
                                              -- field_officer|collection_agent|customer|lender
display_name    VARCHAR(100) NOT NULL,
description     TEXT,
is_system_role  BOOLEAN DEFAULT false,
is_active       BOOLEAN DEFAULT true,
created_at      TIMESTAMP DEFAULT NOW(),
updated_at      TIMESTAMP DEFAULT NOW()
```

### 3.4 `permissions`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name            VARCHAR(100) NOT NULL,        -- e.g., 'dashboard.view', 'applications.create'
display_name    VARCHAR(150) NOT NULL,
module          VARCHAR(50) NOT NULL,         -- dashboard, branches, areas, users, products,
                                              -- applications, disbursements, emi, ledger,
                                              -- banks, reconciliation, tasks, sms, email,
                                              -- reports, settings
description     TEXT,
created_at      TIMESTAMP DEFAULT NOW()
```

### 3.5 `role_permissions`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
is_granted      BOOLEAN DEFAULT true,
created_at      TIMESTAMP DEFAULT NOW()
```

### 3.6 `user_permission_overrides`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
is_granted      BOOLEAN NOT NULL,
reason          TEXT,
granted_by      UUID,
granted_at      TIMESTAMP DEFAULT NOW()
```

### 3.7 `user_areas`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
area_id         UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
is_primary      BOOLEAN DEFAULT false,
assigned_at     TIMESTAMP DEFAULT NOW()
```

### 3.8 `password_reset_tokens`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
token           VARCHAR(255) UNIQUE NOT NULL,
expires_at      TIMESTAMP NOT NULL,
used_at         TIMESTAMP,
ip_address      VARCHAR(50),
created_at      TIMESTAMP DEFAULT NOW()
```

### 3.9 `jwt_refresh_tokens`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
token           VARCHAR(500) UNIQUE NOT NULL,
expires_at      TIMESTAMP NOT NULL,
revoked_at      TIMESTAMP,
ip_address      VARCHAR(50),
user_agent      TEXT,
created_at      TIMESTAMP DEFAULT NOW()
```

### 3.10 `login_audit`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
login_at        TIMESTAMP DEFAULT NOW(),
logout_at       TIMESTAMP,
ip_address      VARCHAR(50),
user_agent      TEXT,
success         BOOLEAN NOT NULL,
failure_reason  VARCHAR(255)
```

---

## 4. Branches, Areas & Products Module

### 4.1 `branches`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
branch_code     VARCHAR(10) NOT NULL,           -- Branch identifier code
branch_name     VARCHAR(255) NOT NULL,
branch_type     VARCHAR(50) DEFAULT 'head_office', -- head_office|regional|branch|unit
address         TEXT,
city            VARCHAR(100),
state           VARCHAR(100) DEFAULT 'Tamil Nadu',
pincode         VARCHAR(10),
phone           VARCHAR(20),
email           VARCHAR(255),
manager_id      UUID,
is_active       BOOLEAN DEFAULT true,
created_at      TIMESTAMP DEFAULT NOW(),
updated_at      TIMESTAMP DEFAULT NOW()
```

### 4.2 `areas`

```sql
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
updated_at      TIMESTAMP DEFAULT NOW()
```

### 4.3 `loan_products`

```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
product_code            VARCHAR(10) NOT NULL,
product_name            VARCHAR(255) NOT NULL,
category                VARCHAR(100),           -- personal|business|agriculture|education|emergency
description             TEXT,
min_loan_amount         DECIMAL(14,2) NOT NULL,
max_loan_amount         DECIMAL(14,2) NOT NULL,
min_tenure_months       INTEGER NOT NULL,
max_tenure_months       INTEGER NOT NULL,
min_interest_rate       DECIMAL(5,2) NOT NULL,  -- annual %
max_interest_rate       DECIMAL(5,2) NOT NULL,
interest_type           VARCHAR(20) DEFAULT 'reducing', -- reducing|flat
processing_fee_type     VARCHAR(20),            -- percentage|flat
processing_fee_value    DECIMAL(10,2) DEFAULT 0,
processing_fee_min      DECIMAL(14,2) DEFAULT 0,
processing_fee_max      DECIMAL(14,2),
document_charge_type    VARCHAR(20),
document_charge_value   DECIMAL(10,2) DEFAULT 0,
insurance_type          VARCHAR(20),
insurance_value         DECIMAL(10,2) DEFAULT 0,
disbursement_mode       VARCHAR(20) DEFAULT 'bank_transfer', -- bank_transfer|cash|cheque
prepayment_allowed      BOOLEAN DEFAULT true,
foreclosure_allowed     BOOLEAN DEFAULT true,
foreclosure_charge_pct  DECIMAL(5,2) DEFAULT 0,
late_payment_penalty_type VARCHAR(20),          -- percentage|flat
late_payment_penalty_value DECIMAL(10,2) DEFAULT 0,
late_payment_grace_days INTEGER DEFAULT 0,
is_active               BOOLEAN DEFAULT true,
created_at              TIMESTAMP DEFAULT NOW(),
updated_at              TIMESTAMP DEFAULT NOW()
```

### 4.4 `product_slabs`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
product_id          UUID NOT NULL REFERENCES loan_products(id) ON DELETE CASCADE,
slab_code           VARCHAR(10) NOT NULL,
slab_name           VARCHAR(255) NOT NULL,
slab_order          INTEGER NOT NULL,
min_amount          DECIMAL(14,2) NOT NULL,
max_amount          DECIMAL(14,2),
interest_rate       DECIMAL(5,2) NOT NULL,
processing_fee_pct  DECIMAL(5,2),
processing_fee_flat DECIMAL(14,2),
document_charge     DECIMAL(10,2) DEFAULT 0,
insurance_pct       DECIMAL(5,2) DEFAULT 0,
is_active           BOOLEAN DEFAULT true,
created_at          TIMESTAMP DEFAULT NOW()
```

---

## 5. Applications Module

### 5.1 `applications`

```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
application_number      VARCHAR(10) NOT NULL,   -- Auto: APP1000001 (10-digit ID)
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
                        -- draft|submitted|in_review|query_raised|approved|
                        -- rejected|disbursed|closed|withdrawn
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
updated_at              TIMESTAMP DEFAULT NOW()
```

### 5.2 `application_topics`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
topic_code          VARCHAR(50) NOT NULL,        -- e.g., 'applicant_details', 'basic_details',
                                                -- 'kyc_details', 'work_details', 'banking_details',
                                                -- 'ratio_analysis', 'obligations', 'income_details',
                                                -- 'customer_wealth', 'product_details', 'property_details',
                                                -- 'eligibility_calculation', 'documents',
                                                -- 'verification_checks', 'review_notes', 'queries'
topic_name          VARCHAR(255) NOT NULL,
topic_order         INTEGER NOT NULL,
topic_data          JSONB DEFAULT '{}',
is_completed        BOOLEAN DEFAULT false,
completion_pct      INTEGER DEFAULT 0,
completed_at        TIMESTAMP,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 5.3 `application_documents`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
document_type       VARCHAR(100) NOT NULL,       -- aadhaar|pan|income_proof|address_proof|
                                                -- photo|bank_statement|property_doc
document_name       VARCHAR(255),
file_path           VARCHAR(500) NOT NULL,
file_size           BIGINT,
mime_type           VARCHAR(100),
is_verified         BOOLEAN DEFAULT false,
verified_by         UUID REFERENCES users(id),
verified_at         TIMESTAMP,
uploaded_by         UUID REFERENCES users(id),
created_at          TIMESTAMP DEFAULT NOW()
```

### 5.4 `application_notes`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
note_type           VARCHAR(30),                 -- general|query|remark|document_required
note_text           TEXT NOT NULL,
is_internal         BOOLEAN DEFAULT true,
is_resolved         BOOLEAN DEFAULT false,
resolved_at         TIMESTAMP,
added_by            UUID NOT NULL REFERENCES users(id),
created_at          TIMESTAMP DEFAULT NOW()
```

### 5.5 `application_queries`

```sql
-- (This table does not exist in migrations.sql; queries are tracked via application_notes
-- with note_type = 'query'. If a separate query tracking table is needed, add here.)
```

### 5.6 `stages`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
code                VARCHAR(50) NOT NULL,        -- e.g., 'new_application', 'document_verification'
name                VARCHAR(255) NOT NULL,
description         TEXT,
stage_order         INTEGER NOT NULL,
required_roles      TEXT[],                      -- ['reviewer', 'approver']
sla_hours           INTEGER DEFAULT 0,
is_mandatory        BOOLEAN DEFAULT true,
is_active           BOOLEAN DEFAULT true,
created_at          TIMESTAMP DEFAULT NOW()
```

### 5.7 `stage_transitions`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
from_stage_id       UUID REFERENCES stages(id),
to_stage_id         UUID NOT NULL REFERENCES stages(id),
action              VARCHAR(30),                 -- approve|reject|query|return|assign|complete
performed_by        UUID REFERENCES users(id),
remarks             TEXT,
performed_at        TIMESTAMP DEFAULT NOW()
```

### 5.8 `approval_history`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
level               INTEGER NOT NULL,
approver_id         UUID REFERENCES users(id),
role_at_time        VARCHAR(50),
limit_amount        DECIMAL(14,2),
action              VARCHAR(30),                 -- approved|rejected|forwarded|query_raised
remarks             TEXT,
acted_at            TIMESTAMP DEFAULT NOW()
```

### 5.9 `approval_limits`

```sql
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
updated_at      TIMESTAMP DEFAULT NOW()
```

---

## 6. Loans & EMI Module

### 6.1 `loans`

```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
loan_number             VARCHAR(10) NOT NULL,      -- Auto: LON1000001 (10-digit ID)
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
                        -- disbursed|active|completed|foreclosed|written_off|npa
foreclosure_date        DATE,
closure_date            DATE,
npa_classification      UUID,
created_by              UUID,
created_at              TIMESTAMP DEFAULT NOW(),
updated_at              TIMESTAMP DEFAULT NOW()
```

### 6.2 `emi_schedules`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
loan_id         UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
emi_number      INTEGER NOT NULL,                -- 1, 2, 3, ...
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
created_at      TIMESTAMP DEFAULT NOW()
```

### 6.3 `emi_payments`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
payment_number      VARCHAR(10) NOT NULL,        -- Auto: PAY1000001
loan_id             UUID NOT NULL REFERENCES loans(id),
emi_schedule_id     UUID REFERENCES emi_schedules(id),
customer_id         UUID NOT NULL REFERENCES users(id),
payment_amount      DECIMAL(14,2) NOT NULL,
principal_component DECIMAL(14,2) DEFAULT 0,
interest_component  DECIMAL(14,2) DEFAULT 0,
penalty_component   DECIMAL(14,2) DEFAULT 0,
payment_method      VARCHAR(30) DEFAULT 'cash',  -- cash|bank_transfer|upi|cheque|card
bank_account_id     UUID REFERENCES bank_accounts(id),
transaction_ref     VARCHAR(255),
payment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
received_by         UUID REFERENCES users(id),
is_verified         BOOLEAN DEFAULT true,
notes               TEXT,
created_at          TIMESTAMP DEFAULT NOW()
```

### 6.4 `payment_receipts`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
receipt_number  VARCHAR(10) NOT NULL,            -- Auto: RCP1000001
emi_payment_id  UUID NOT NULL REFERENCES emi_payments(id),
loan_id         UUID NOT NULL REFERENCES loans(id),
customer_id     UUID NOT NULL REFERENCES users(id),
receipt_amount  DECIMAL(14,2) NOT NULL,
receipt_date    DATE NOT NULL DEFAULT CURRENT_DATE,
receipt_type    VARCHAR(30) DEFAULT 'emi',       -- emi|penalty|partial|settlement
pdf_path        VARCHAR(500),
is_emailed      BOOLEAN DEFAULT false,
is_sms_sent     BOOLEAN DEFAULT false,
created_at      TIMESTAMP DEFAULT NOW()
```

### 6.5 `penalties`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
penalty_number      VARCHAR(10) NOT NULL,        -- Auto: PEN1000001
loan_id             UUID NOT NULL REFERENCES loans(id),
emi_schedule_id     UUID REFERENCES emi_schedules(id),
customer_id         UUID NOT NULL REFERENCES users(id),
penalty_type        VARCHAR(30) NOT NULL,        -- late_payment|bounced_cheque|legal
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
created_at          TIMESTAMP DEFAULT NOW()
```

---

## 7. Disbursements Module

### 7.1 `disbursements`

```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
disbursement_number     VARCHAR(10) NOT NULL,      -- Auto: DSB1000001
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
                        -- pending|approved|processing|completed|failed|cancelled
status_changed_at       TIMESTAMP,
failure_reason          TEXT,
notes                   TEXT,
metadata                JSONB DEFAULT '{}',
created_at              TIMESTAMP DEFAULT NOW(),
updated_at              TIMESTAMP DEFAULT NOW()
```

### 7.2 `disbursement_charges`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
charge_number       VARCHAR(10) NOT NULL,        -- Auto: CHG1000001
disbursement_id     UUID NOT NULL REFERENCES disbursements(id) ON DELETE CASCADE,
charge_type         VARCHAR(30) NOT NULL,        -- processing_fee|document_charge|insurance|other
charge_head         VARCHAR(255),
calculation_type    VARCHAR(20),                 -- percentage|flat|slab
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
created_at          TIMESTAMP DEFAULT NOW()
```

---

## 8. Ledger & Accounting Module

### 8.1 `ledger_accounts`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_code        VARCHAR(10) NOT NULL,        -- e.g., "1001", "4001"
account_name        VARCHAR(255) NOT NULL,
account_group       VARCHAR(100) NOT NULL,       -- assets|liabilities|income|expenses|equity
parent_account_id   UUID REFERENCES ledger_accounts(id),
account_type        VARCHAR(50),                 -- direct|indirect|contra
is_active           BOOLEAN DEFAULT true,
is_system           BOOLEAN DEFAULT false,
opening_balance     DECIMAL(16,2) DEFAULT 0,
current_balance     DECIMAL(16,2) DEFAULT 0,
description         TEXT,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 8.2 `ledger_entries`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
entry_number        VARCHAR(10) NOT NULL,        -- Auto: LDG1000001
entry_date          DATE NOT NULL DEFAULT CURRENT_DATE,
description         VARCHAR(500) NOT NULL,
reference_type      VARCHAR(50),                 -- disbursement|emi_payment|penalty|expense
reference_id        UUID,
reference_number    VARCHAR(30),
narration           TEXT,
created_by          UUID,
created_at          TIMESTAMP DEFAULT NOW()
```

### 8.3 `ledger_entry_lines`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ledger_entry_id     UUID NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
account_id          UUID NOT NULL REFERENCES ledger_accounts(id),
debit_amount        DECIMAL(16,2) DEFAULT 0,
credit_amount       DECIMAL(16,2) DEFAULT 0,
line_order          INTEGER NOT NULL,
narration           TEXT,
created_at          TIMESTAMP DEFAULT NOW()
```

### 8.4 `ledger_account_balances`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_id          UUID NOT NULL REFERENCES ledger_accounts(id),
as_of_date          DATE NOT NULL,
opening_balance     DECIMAL(16,2) NOT NULL,
total_debit         DECIMAL(16,2) NOT NULL DEFAULT 0,
total_credit        DECIMAL(16,2) NOT NULL DEFAULT 0,
closing_balance     DECIMAL(16,2) NOT NULL,
created_at          TIMESTAMP DEFAULT NOW()
```

### 8.5 `bank_accounts`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_code        VARCHAR(10) NOT NULL,
bank_name           VARCHAR(255) NOT NULL,
account_number      VARCHAR(50) NOT NULL,
account_name        VARCHAR(255) NOT NULL,
account_type        account_type_enum DEFAULT 'savings', -- savings|current|salary|fixed_deposit
branch_name         VARCHAR(255),
ifsc_code           VARCHAR(20),
micr_code           VARCHAR(20),
opening_balance     DECIMAL(16,2) DEFAULT 0,
current_balance     DECIMAL(16,2) DEFAULT 0,
is_primary          BOOLEAN DEFAULT false,
is_active           BOOLEAN DEFAULT true,
created_by          UUID,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 8.6 `bank_statement_entries`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
bank_account_id     UUID NOT NULL REFERENCES bank_accounts(id),
entry_date          DATE NOT NULL,
description         VARCHAR(500),
transaction_ref     VARCHAR(100),
debit_amount        DECIMAL(16,2) DEFAULT 0,
credit_amount       DECIMAL(16,2) DEFAULT 0,
balance             DECIMAL(16,2) NOT NULL,
entry_type          VARCHAR(20),                  -- auto|manual
is_reconciled       BOOLEAN DEFAULT false,
reconciled_with_id  UUID,
reconciled_at       TIMESTAMP,
created_at          TIMESTAMP DEFAULT NOW()
```

### 8.7 `bank_reconciliations`

```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
reconciliation_number   VARCHAR(10) NOT NULL,     -- Auto: REC1000001
bank_account_id         UUID NOT NULL REFERENCES bank_accounts(id),
from_date               DATE NOT NULL,
to_date                 DATE NOT NULL,
bank_closing_balance    DECIMAL(16,2) NOT NULL,
book_closing_balance    DECIMAL(16,2) NOT NULL,
difference              DECIMAL(16,2) DEFAULT 0,
is_completed            BOOLEAN DEFAULT false,
reconciled_by           UUID,
completed_at            TIMESTAMP,
notes                   TEXT,
created_at              TIMESTAMP DEFAULT NOW()
```

---

## 9. Communication Module

### 9.1 `sms_templates`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
template_code   VARCHAR(10) NOT NULL,
template_name   VARCHAR(255) NOT NULL,
category        VARCHAR(50),                   -- application|payment|reminder|disbursement
language        VARCHAR(10) DEFAULT 'en',
template_text   TEXT NOT NULL,
variables       TEXT[],                        -- ['{name}', '{amount}', '{date}']
is_active       BOOLEAN DEFAULT true,
created_at      TIMESTAMP DEFAULT NOW(),
updated_at      TIMESTAMP DEFAULT NOW()
```

### 9.2 `sms_logs`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
sms_number      VARCHAR(10) NOT NULL,          -- Auto: SMS1000001
recipient_phone VARCHAR(20) NOT NULL,
recipient_name  VARCHAR(255),
template_id     UUID REFERENCES sms_templates(id),
message_text    TEXT NOT NULL,
template_vars   JSONB DEFAULT '{}',
status          VARCHAR(30) DEFAULT 'pending', -- pending|sent|delivered|failed|bounced
gateway_ref     VARCHAR(255),
error_message   TEXT,
sent_at         TIMESTAMP,
delivered_at    TIMESTAMP,
created_at      TIMESTAMP DEFAULT NOW()
```

### 9.3 `email_templates`

```sql
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
updated_at      TIMESTAMP DEFAULT NOW()
```

### 9.4 `email_logs`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
email_number    VARCHAR(10) NOT NULL,           -- Auto: EML1000001
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
created_at      TIMESTAMP DEFAULT NOW()
```

---

## 10. Verification Module

### 10.1 `verification_tasks`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
task_number         VARCHAR(10) NOT NULL,       -- Auto: TSK1000001
application_id      UUID NOT NULL REFERENCES applications(id),
task_type           VARCHAR(30) NOT NULL,       -- field_verification|document_verification|
                                                -- collection|address_verification
assigned_to         UUID NOT NULL REFERENCES users(id),
assigned_by         UUID NOT NULL REFERENCES users(id),
priority            VARCHAR(20) DEFAULT 'medium', -- low|medium|high|urgent
scheduled_date      DATE,
completed_date      DATE,
status              VARCHAR(30) DEFAULT 'assigned', -- assigned|in_progress|completed|cancelled|overdue
verification_data   JSONB DEFAULT '{}',
photos              TEXT[],
gps_latitude        DECIMAL(10,8),
gps_longitude       DECIMAL(11,8),
gps_accuracy        DECIMAL(10,2),
notes               TEXT,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 10.2 `verifications`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
verification_number VARCHAR(10) NOT NULL,        -- Auto: VER1000001
task_id             UUID NOT NULL REFERENCES verification_tasks(id),
verification_type   VARCHAR(50) NOT NULL,
result              VARCHAR(30) NOT NULL,        -- verified|not_verified|partial|discrepancy_found
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
created_at          TIMESTAMP DEFAULT NOW()
```

---

## 11. Reports, Audit & Settings Module

### 11.1 `audit_logs`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
audit_number    VARCHAR(10) NOT NULL,           -- Auto: AUD1000001
user_id         UUID REFERENCES users(id),
action          VARCHAR(100) NOT NULL,          -- create|update|delete|approve|reject|pay
entity_type     VARCHAR(50),                    -- application|loan|disbursement|payment
entity_id       UUID,
entity_number   VARCHAR(30),
old_values      JSONB,
new_values      JSONB,
ip_address      VARCHAR(50),
user_agent      TEXT,
created_at      TIMESTAMP DEFAULT NOW()
```

### 11.2 `trust_scores`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
customer_id         UUID NOT NULL REFERENCES users(id),
application_id      UUID REFERENCES applications(id),
team_score          INTEGER,
community_score     INTEGER,
repayment_history   INTEGER,
overall_score       INTEGER,
grade               VARCHAR(5),                  -- A|B|C|D|E
factors             JSONB DEFAULT '{}',
calculated_by       UUID,
notes               TEXT,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 11.3 `referrals`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
referral_number     VARCHAR(10) NOT NULL,        -- Auto: REF1000001
referrer_id         UUID NOT NULL REFERENCES users(id),
referred_name       VARCHAR(255) NOT NULL,
referred_phone      VARCHAR(20) NOT NULL,
referred_address    TEXT,
status              VARCHAR(30) DEFAULT 'pending',
                    -- pending|contacted|applied|converted|not_interested
converted_customer_id UUID REFERENCES users(id),
notes               TEXT,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 11.4 `npa_classifications`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
npa_number          VARCHAR(10) NOT NULL,        -- Auto: NPA1000001
loan_id             UUID NOT NULL REFERENCES loans(id),
customer_id         UUID NOT NULL REFERENCES users(id),
classification_date DATE NOT NULL,
overdue_days        INTEGER NOT NULL,
overdue_amount      DECIMAL(14,2) NOT NULL,
npa_category        VARCHAR(20) NOT NULL,        -- sub_standard|doubtful|loss
substandard_days    INTEGER,
doubtful_days       INTEGER,
provision_amount    DECIMAL(14,2) DEFAULT 0,
provision_pct       DECIMAL(5,2) DEFAULT 0,
action_taken        TEXT,
is_active           BOOLEAN DEFAULT true,
created_by          UUID,
created_at          TIMESTAMP DEFAULT NOW(),
updated_at          TIMESTAMP DEFAULT NOW()
```

### 11.5 `app_settings`

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
setting_key     VARCHAR(100) UNIQUE NOT NULL,
setting_value   TEXT,
setting_type    VARCHAR(20),                   -- string|number|boolean|json
description     TEXT,
updated_by      UUID REFERENCES users(id),
updated_at      TIMESTAMP DEFAULT NOW()
```

---

## 12. Enum Types

```sql
CREATE TYPE user_role_enum AS ENUM (
    'super_admin', 'branch_admin', 'team_leader',
    'field_officer', 'collection_agent', 'customer', 'lender'
);

CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
CREATE TYPE marital_status_enum AS ENUM ('single', 'married', 'widowed', 'divorced');
CREATE TYPE education_enum AS ENUM (
    'none', 'primary', 'secondary', 'higher_secondary',
    'graduate', 'post_graduate', 'diploma', 'professional'
);
CREATE TYPE employment_type_enum AS ENUM (
    'self_employed', 'salaried', 'business', 'agriculture',
    'daily_wage', 'retired', 'unemployed'
);
CREATE TYPE account_type_enum AS ENUM ('savings', 'current', 'salary', 'fixed_deposit');
CREATE TYPE address_type_enum AS ENUM ('permanent', 'current', 'work');
```

---

## 13. Key Database Functions

### 13.1 `generate_id(prefix)` — Atomic 10-Digit ID Generation

```sql
-- Usage: SELECT generate_id('APP') → 'APP1000001'
-- Atomically increments counter and returns formatted ID
-- Format: 3-char prefix + 7 zero-padded digits = exactly 10 characters
```

### 13.2 `auto_generate_id()` — Trigger Function

Fires BEFORE INSERT on 17 tables. If the ID field is NULL, populates it via `generate_id()`.

### 13.3 `update_updated_at_column()` — Timestamp Trigger

Fires BEFORE UPDATE on any table with an `updated_at` column. Sets `NEW.updated_at = NOW()`.

### 13.4 `update_emi_overdue()` — EMI Overdue Trigger

Fires BEFORE INSERT OR UPDATE on `emi_schedules`. Sets `is_overdue = true` and `days_overdue` if due date has passed and EMI is unpaid.

### 13.5 `update_ledger_balance()` — Ledger Balance Trigger

Fires AFTER INSERT on `ledger_entry_lines`. Updates `current_balance` on the referenced `ledger_accounts` row.

### 13.6 `calculate_emi(principal, rate, tenure, type)` — EMI Calculation

```sql
-- Reducing Balance:
-- EMI = P × r × (1+r)^n / ((1+r)^n - 1)
-- where r = annual_rate / 12 / 100

-- Flat Rate:
-- EMI = (P + P × r × n / 100) / n
-- where r = annual_rate, n = tenure_months
```

Implemented as a PostgreSQL function or in application code (`emiCalculator.js`).

---

## 14. Complete Table Index

| Table | Purpose | ID Prefix |
|-------|---------|-----------|
| id_counters | ID generation counters | — |
| users | User accounts (all roles) | CMF |
| user_profiles | Extended user profile data | — |
| roles | System roles | — |
| permissions | Granular permission definitions | — |
| role_permissions | Role-to-permission mapping | — |
| user_permission_overrides | Per-user permission overrides | — |
| user_areas | User-to-area assignments | — |
| password_reset_tokens | Password reset flow | — |
| jwt_refresh_tokens | JWT refresh token storage | — |
| login_audit | Login attempt tracking | — |
| branches | Branch master | — |
| areas | Collection area definitions | — |
| loan_products | Loan product catalog | — |
| product_slabs | Dynamic interest/charge slabs per product | — |
| applications | Loan applications (core entity) | APP |
| application_topics | 16 topic sections per application | — |
| application_documents | Uploaded documents per application | — |
| application_notes | Reviewer remarks and queries | — |
| stages | Configurable stage definitions | — |
| stage_transitions | Stage change history | — |
| approval_history | Approval action log | — |
| approval_limits | Role/branch approval limits | — |
| loans | Disbursed/active loans | LON |
| emi_schedules | EMI amortization schedule rows | — |
| emi_payments | EMI payment records | PAY |
| payment_receipts | Payment receipts (PDF) | RCP |
| penalties | Late payment and other penalties | PEN |
| disbursements | Disbursement records | DSB |
| disbursement_charges | Charge breakdown per disbursement | CHG |
| ledger_accounts | Chart of accounts | — |
| ledger_entries | Journal entry headers | LDG |
| ledger_entry_lines | Journal entry debit/credit lines | — |
| ledger_account_balances | Precomputed daily account balances | — |
| bank_accounts | Managed company bank accounts | — |
| bank_statement_entries | Imported bank statement rows | — |
| bank_reconciliations | Bank reconciliation records | REC |
| verification_tasks | Assigned field verification tasks | TSK |
| verifications | Verification results | VER |
| sms_templates | SMS message templates | — |
| sms_logs | SMS send history | SMS |
| email_templates | Email message templates | — |
| email_logs | Email send history | EML |
| audit_logs | System audit trail | AUD |
| trust_scores | Customer trust scoring | — |
| referrals | Customer referral tracking | REF |
| npa_classifications | NPA loan classifications | NPA |
| app_settings | Key-value system settings | — |
