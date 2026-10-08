-- Patch: Create missing tables (disbursements, loans, EMI, penalties, charges, NPA, ledger lines)

-- ============================================================================
-- STEP 1: disbursements
-- ============================================================================

CREATE TABLE disbursements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disbursement_number     VARCHAR(10) NOT NULL,
    loan_id                 UUID NOT NULL,
    application_id          UUID NOT NULL,
    customer_id             UUID NOT NULL,
    product_id              UUID NOT NULL,
    branch_id               UUID NOT NULL,
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
    approved_by             UUID,
    processed_by            UUID,
    status                  VARCHAR(30) DEFAULT 'pending',
    status_changed_at       TIMESTAMP,
    failure_reason          TEXT,
    notes                   TEXT,
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),
    UNIQUE(disbursement_number),
    CHECK (loan_amount > 0)
);

CREATE INDEX idx_disbursements_loan ON disbursements(loan_id);
CREATE INDEX idx_disbursements_status ON disbursements(status);

-- ============================================================================
-- STEP 2: loans (references disbursements)
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
    foreclosure_date        DATE,
    closure_date            DATE,
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
-- STEP 3: emi_schedules
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
-- STEP 4: emi_payments
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
-- STEP 5: payment_receipts
-- ============================================================================

CREATE TABLE payment_receipts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number  VARCHAR(10) NOT NULL,
    emi_payment_id  UUID NOT NULL REFERENCES emi_payments(id),
    loan_id         UUID NOT NULL REFERENCES loans(id),
    customer_id     UUID NOT NULL REFERENCES users(id),
    receipt_amount  DECIMAL(14,2) NOT NULL,
    receipt_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_type    VARCHAR(30) DEFAULT 'emi',
    pdf_path        VARCHAR(500),
    is_emailed      BOOLEAN DEFAULT false,
    is_sms_sent     BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(receipt_number)
);

CREATE INDEX idx_receipts_payment ON payment_receipts(emi_payment_id);

-- ============================================================================
-- STEP 6: penalties
-- ============================================================================

CREATE TABLE penalties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    penalty_number      VARCHAR(10) NOT NULL,
    loan_id             UUID NOT NULL REFERENCES loans(id),
    emi_schedule_id     UUID REFERENCES emi_schedules(id),
    customer_id         UUID NOT NULL REFERENCES users(id),
    penalty_type        VARCHAR(30) NOT NULL,
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
-- STEP 7: disbursement_charges
-- ============================================================================

CREATE TABLE disbursement_charges (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_number       VARCHAR(10) NOT NULL,
    disbursement_id     UUID NOT NULL REFERENCES disbursements(id) ON DELETE CASCADE,
    charge_type         VARCHAR(30) NOT NULL,
    charge_head         VARCHAR(255),
    calculation_type    VARCHAR(20),
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
-- STEP 8: npa_classifications
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
    UNIQUE(loan_id)
);

CREATE INDEX idx_npa_loan ON npa_classifications(loan_id);
CREATE INDEX idx_npa_date ON npa_classifications(classification_date DESC);

-- ============================================================================
-- STEP 9: ledger_entry_lines
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
-- STEP 10: Link circular FK
-- ============================================================================

ALTER TABLE disbursements ADD CONSTRAINT fk_disbursements_loan
    FOREIGN KEY (loan_id) REFERENCES loans(id);

SELECT 'All missing tables created' AS result;
