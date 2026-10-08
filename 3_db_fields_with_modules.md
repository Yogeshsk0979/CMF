# Continumm Micro Finance Pvt Ltd
# Database Fields with Modules — Complete Technical Reference

**Document Version:** 2.0  
**Date:** October 2026  
**Database:** PostgreSQL 15+ (via Supabase)  
**Tables:** 48  
**PK Strategy:** UUID v4 (gen_random_uuid()) for all tables  
**ID Numbering:** 10-character codes via `generate_id('PREFIX')` → `CMF1000001`

---

## Table of Contents

1. [ID Numbering System](#0-id-numbering-system)
2. [Module 1: Authentication & Users](#1-module-authentication--users)
3. [Module 2: Roles & Permissions](#2-module-roles--permissions)
4. [Module 3: Branch & Area Management](#3-module-branch--area-management)
5. [Module 4: Bank Accounts](#4-module-bank-accounts)
6. [Module 5: Loan Products & Slabs](#5-module-loan-products--slabs)
7. [Module 6: Customer Profiles](#6-module-customer-profiles)
8. [Module 7: Customer Banking, Wealth, Obligations](#7-module-customer-banking-wealth-obligations)
9. [Module 8: Referrals & Trust Scores](#8-module-referrals--trust-scores)
10. [Module 9: Loan Application](#9-module-loan-application)
11. [Module 10: Application Topics](#10-module-application-topics)
11. [Module 11: Stage Workflow Engine](#11-module-stage-workflow-engine)
12. [Module 12: Approval System](#12-module-approval-system)
13. [Module 13: Loan Management](#13-module-loan-management)
14. [Module 14: EMI Schedule & Payments](#14-module-emi-schedule--payments)
15. [Module 15: Payment Receipts](#15-module-payment-receipts)
16. [Module 16: Penalties](#16-module-penalties)
17. [Module 17: Disbursements](#17-module-disbursements)
18. [Module 18: Disbursement Charges](#18-module-disbursement-charges)
19. [Module 19: Ledger — Chart of Accounts](#19-module-ledger--chart-of-accounts)
20. [Module 20: Ledger Entries & Lines](#20-module-ledger-entries--lines)
21. [Module 21: Ledger Account Balances](#21-module-ledger-account-balances)
22. [Module 22: Bank Statement Entries](#22-module-bank-statement-entries)
23. [Module 23: Bank Reconciliations](#23-module-bank-reconciliations)
24. [Module 24: Verification Tasks & Results](#24-module-verification-tasks--results)
25. [Module 25: NPA Classification](#25-module-npa-classification)
26. [Module 26: Communication Templates & Logs](#26-module-communication-templates--logs)
27. [Module 27: Audit Logs](#27-module-audit-logs)
28. [Module 28: App Settings](#28-module-app-settings)
29. [Module 29: Security Tokens](#29-module-security-tokens)
30. [Relationships Diagram](#30-relationships-diagram)
31. [Index Strategy](#31-index-strategy)

---

## 0. ID Numbering System

All human-readable IDs are **exactly 10 characters**: `PREFIX` (3) + `0000000` (7 zero-padded).

| Prefix | Entity | Example |
|--------|--------|---------|
| CMF | Customer | CMF1000001 |
| APP | Application | APP1000001 |
| LON | Loan | LON1000001 |
| DSB | Disbursement | DSB1000001 |
| PAY | EMI Payment | PAY1000001 |
| RCP | Payment Receipt | RCP1000001 |
| PEN | Penalty | PEN1000001 |
| LDG | Ledger Entry | LDG1000001 |
| TSK | Verification Task | TSK1000001 |
| VER | Verification Report | VER1000001 |
| SMS | SMS Log | SMS1000001 |
| EML | Email Log | EML1000001 |
| REF | Referral | REF1000001 |
| CHG | Disbursement Charge | CHG1000001 |
| NPA | NPA Classification | NPA1000001 |
| REC | Bank Reconciliation | REC1000001 |
| AUD | Audit Log | AUD1000001 |

Implementation:
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
    v_result := UPPER(p_prefix) || LPAD(v_new_value::TEXT, 7, '0');
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 1. Module: Authentication & Users

### 1.1 users

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| customer_code | VARCHAR(10) | YES | NULL | 10-digit ID (CMF1000001), UNIQUE |
| username | VARCHAR(100) | NOT NULL | — | Login username, UNIQUE |
| email | VARCHAR(255) | YES | NULL | Email, UNIQUE |
| phone | VARCHAR(20) | NOT NULL | — | Primary phone (10-digit), UNIQUE |
| alternate_phone | VARCHAR(20) | YES | NULL | Secondary phone |
| password_hash | VARCHAR(255) | NOT NULL | — | bcrypt hash |
| role | user_role_enum | NOT NULL | 'customer' | super_admin/branch_admin/team_leader/field_officer/collection_agent/customer/lender |
| is_active | BOOLEAN | NOT NULL | true | Account active |
| is_verified | BOOLEAN | NOT NULL | false | KYC verified |
| email_verified | BOOLEAN | NOT NULL | false | Email verified |
| phone_verified | BOOLEAN | NOT NULL | false | Phone verified |
| last_login_at | TIMESTAMP | YES | NULL | Last login |
| created_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 1.2 user_profiles

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| user_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE, UNIQUE |
| first_name | VARCHAR(100) | YES | NULL | First name |
| middle_name | VARCHAR(100) | YES | NULL | Middle name |
| last_name | VARCHAR(100) | NOT NULL | — | Last name |
| date_of_birth | DATE | YES | NULL | DOB |
| gender | gender_enum | YES | NULL | male/female/other |
| marital_status | marital_status_enum | YES | NULL | single/married/widowed/divorced |
| blood_group | VARCHAR(10) | YES | NULL | e.g., B+, O- |
| aadhaar_number | VARCHAR(12) | YES | NULL | Encrypted |
| aadhaar_verified | BOOLEAN | NOT NULL | false | Aadhaar verified |
| aadhaar_verified_at | TIMESTAMP | YES | NULL | Verification timestamp |
| pan_number | VARCHAR(10) | YES | NULL | Encrypted PAN |
| pan_verified | BOOLEAN | NOT NULL | false | PAN verified |
| voter_id | VARCHAR(50) | YES | NULL | Voter ID |
| ckyc_number | VARCHAR(20) | YES | NULL | CKYC number |
| ckyc_verified | BOOLEAN | NOT NULL | false | CKYC verified |
| photo_url | VARCHAR(500) | YES | NULL | Profile photo |
| address | JSONB | NOT NULL | '{}' | {permanent: {...}, current: {...}} |
| emergency_contact | JSONB | NOT NULL | '{}' | {name, phone, relation} |
| profile_completed | BOOLEAN | NOT NULL | false | Profile complete flag |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**address JSONB structure:**
```json
{
  "permanent": {
    "line1": "12, Anna Salai",
    "line2": "T Nagar",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600017",
    "country": "India"
  },
  "current": {
    "line1": "12, Anna Salai",
    "line2": "T Nagar",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600017",
    "country": "India"
  }
}
```

---

## 2. Module: Roles & Permissions

### 2.1 roles

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| name | VARCHAR(50) | NOT NULL | — | Unique: super_admin/branch_admin/team_leader/field_officer/collection_agent/customer/lender |
| display_name | VARCHAR(100) | NOT NULL | — | Human-readable |
| description | TEXT | YES | NULL | Role description |
| is_system_role | BOOLEAN | NOT NULL | false | Cannot delete |
| is_active | BOOLEAN | NOT NULL | true | Role active |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 2.2 permissions

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| name | VARCHAR(100) | NOT NULL | — | Unique permission code |
| display_name | VARCHAR(150) | NOT NULL | — | Human-readable |
| module | VARCHAR(50) | NOT NULL | — | Feature module |
| description | TEXT | YES | NULL | What this allows |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

### 2.3 role_permissions

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| role_id | UUID | NOT NULL | — | FK → roles(id) ON DELETE CASCADE |
| permission_id | UUID | NOT NULL | — | FK → permissions(id) ON DELETE CASCADE |
| is_granted | BOOLEAN | NOT NULL | true | Grant/deny |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** (role_id, permission_id)

### 2.4 user_permission_overrides

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| user_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| permission_id | UUID | NOT NULL | — | FK → permissions(id) ON DELETE CASCADE |
| is_granted | BOOLEAN | NOT NULL | true | Override value |
| granted_by | UUID | YES | NULL | FK → users(id) |
| granted_at | TIMESTAMP | NOT NULL | NOW() | When overridden |

**Unique:** (user_id, permission_id)

---

## 3. Module: Branch & Area Management

### 3.1 branches

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| branch_code | VARCHAR(10) | NOT NULL | — | Unique (BRH1000001) |
| branch_name | VARCHAR(255) | NOT NULL | — | Branch name |
| address | JSONB | YES | '{}' | Full address as JSON |
| city | VARCHAR(100) | YES | NULL | City |
| state | VARCHAR(100) | YES | 'Tamil Nadu' | State |
| pincode | VARCHAR(10) | YES | NULL | PIN code |
| phone | VARCHAR(20) | YES | NULL | Branch phone |
| email | VARCHAR(255) | YES | NULL | Branch email |
| manager_id | UUID | YES | NULL | FK → users(id) |
| is_active | BOOLEAN | NOT NULL | true | Branch status |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 3.2 areas

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| branch_id | UUID | NOT NULL | — | FK → branches(id) ON DELETE RESTRICT |
| area_name | VARCHAR(255) | NOT NULL | — | Area/ward name |
| area_code | VARCHAR(10) | NOT NULL | — | Unique (ARE1000001) |
| pincode | VARCHAR(10) | YES | NULL | Area PIN |
| city | VARCHAR(100) | YES | NULL | City |
| state | VARCHAR(100) | YES | 'Tamil Nadu' | State |
| latitude | DECIMAL(10,8) | YES | NULL | OSM latitude |
| longitude | DECIMAL(11,8) | YES | NULL | OSM longitude |
| radius_km | DECIMAL(5,2) | YES | NULL | Coverage radius |
| description | TEXT | YES | NULL | Area notes |
| is_active | BOOLEAN | NOT NULL | true | Area status |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 3.3 user_areas

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| user_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| area_id | UUID | NOT NULL | — | FK → areas(id) ON DELETE CASCADE |
| is_primary | BOOLEAN | NOT NULL | false | Primary assignment |
| assigned_at | TIMESTAMP | NOT NULL | NOW() | Assignment date |

**Unique:** (user_id, area_id)

---

## 4. Module: Bank Accounts

### 4.1 bank_accounts

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| account_code | VARCHAR(10) | NOT NULL | — | Unique (BNK1000001) |
| bank_name | VARCHAR(255) | NOT NULL | — | Bank name |
| account_number | VARCHAR(50) | NOT NULL | — | Account number |
| account_name | VARCHAR(255) | NOT NULL | — | Account holder name |
| account_type | account_type_enum | NOT NULL | 'savings' | savings/current/salary/fixed_deposit |
| branch_name | VARCHAR(255) | YES | NULL | Bank branch |
| ifsc_code | VARCHAR(20) | YES | NULL | IFSC |
| micr_code | VARCHAR(20) | YES | NULL | MICR |
| opening_balance | DECIMAL(16,2) | NOT NULL | 0 | Opening balance |
| current_balance | DECIMAL(16,2) | NOT NULL | 0 | Current balance |
| is_primary | BOOLEAN | NOT NULL | false | Default account |
| is_active | BOOLEAN | NOT NULL | true | Account active |
| created_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

---

## 5. Module: Loan Products & Slabs

### 5.1 loan_products

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| product_code | VARCHAR(10) | NOT NULL | — | Unique (PRD1000001) |
| product_name | VARCHAR(255) | NOT NULL | — | Display name |
| category | VARCHAR(50) | NOT NULL | — | individual/group/jlg/emergency |
| description | TEXT | YES | NULL | Product details |
| min_loan_amount | DECIMAL(14,2) | NOT NULL | — | Minimum |
| max_loan_amount | DECIMAL(14,2) | NOT NULL | — | Maximum |
| min_tenure_months | INTEGER | NOT NULL | — | Min tenure |
| max_tenure_months | INTEGER | NOT NULL | — | Max tenure |
| interest_rate_min | DECIMAL(5,2) | NOT NULL | — | Min annual rate |
| interest_rate_max | DECIMAL(5,2) | NOT NULL | — | Max annual rate |
| interest_type | VARCHAR(20) | NOT NULL | 'reducing' | reducing/flat |
| processing_fee_type | VARCHAR(20) | NOT NULL | 'percentage' | percentage/flat/slab |
| processing_fee_value | DECIMAL(5,2) | YES | NULL | % or flat amount |
| document_charge_type | VARCHAR(20) | NOT NULL | 'flat' | percentage/flat |
| document_charge_value | DECIMAL(14,2) | YES | NULL | Charge amount |
| insurance_type | VARCHAR(20) | NOT NULL | 'none' | none/percentage/flat |
| insurance_value | DECIMAL(5,2) | YES | NULL | % or flat |
| insurance_provider | VARCHAR(255) | YES | NULL | Insurance company |
| is_active | BOOLEAN | NOT NULL | true | Product active |
| created_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 5.2 product_slabs (Dynamic charge brackets)

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| product_id | UUID | NOT NULL | — | FK → loan_products(id) ON DELETE CASCADE |
| slab_name | VARCHAR(100) | NOT NULL | — | e.g., "₹5K-₹25K", "₹25K-₹50K" |
| slab_type | VARCHAR(30) | NOT NULL | — | processing_fee/document_charge/insurance |
| min_amount | DECIMAL(14,2) | NOT NULL | — | Min loan for this slab |
| max_amount | DECIMAL(14,2) | NOT NULL | — | Max loan for this slab |
| calculation_type | VARCHAR(20) | NOT NULL | — | percentage/flat |
| rate_value | DECIMAL(5,2) | YES | NULL | % rate |
| flat_amount | DECIMAL(14,2) | YES | NULL | Flat charge |
| min_charge | DECIMAL(14,2) | YES | NULL | Min charge floor |
| max_charge | DECIMAL(14,2) | YES | NULL | Max charge cap |
| sort_order | INTEGER | NOT NULL | 0 | Display order |
| is_active | BOOLEAN | NOT NULL | true | Active |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

---

## 6. Module: Customer Profiles

Customers are linked to users via a 1:1 relationship. The `user_profiles` table serves as the customer profile.

Key distinction:
- `users` — authentication, role, contact
- `user_profiles` — personal details, KYC, address
- Additional modules below for banking, wealth, obligations

---

## 7. Module: Customer Banking, Wealth, Obligations

### 7.1 customer_banking

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| customer_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| bank_name | VARCHAR(255) | NOT NULL | — | Bank name |
| account_number | VARCHAR(50) | NOT NULL | — | Encrypted account number |
| ifsc_code | VARCHAR(20) | NOT NULL | — | IFSC |
| account_holder_name | VARCHAR(255) | NOT NULL | — | As per bank |
| account_type | VARCHAR(20) | YES | NULL | savings/current |
| branch_name | VARCHAR(255) | YES | NULL | Bank branch |
| is_primary | BOOLEAN | NOT NULL | true | Primary account |
| is_verified | BOOLEAN | NOT NULL | false | Verification status |
| verified_at | TIMESTAMP | YES | NULL | When verified |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 7.2 customer_wealth

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| customer_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| owns_house | BOOLEAN | YES | NULL | Owns house |
| house_value | DECIMAL(14,2) | YES | NULL | Estimated value |
| owns_land | BOOLEAN | YES | NULL | Owns land |
| land_value | DECIMAL(14,2) | YES | NULL | Land value |
| owns_vehicle | BOOLEAN | YES | NULL | Owns vehicle |
| vehicle_type | VARCHAR(30) | YES | NULL | two_wheeler/four_wheeler |
| vehicle_value | DECIMAL(14,2) | YES | NULL | Vehicle value |
| owns_gold | BOOLEAN | YES | NULL | Owns gold |
| gold_value | DECIMAL(14,2) | YES | NULL | Gold value |
| owns_business | BOOLEAN | YES | NULL | Owns business |
| business_value | DECIMAL(14,2) | YES | NULL | Business value |
| owns_livestock | BOOLEAN | YES | NULL | Owns livestock |
| livestock_value | DECIMAL(14,2) | YES | NULL | Livestock value |
| total_assets_value | DECIMAL(16,2) | YES | NULL | Total assets |
| savings_balance | DECIMAL(14,2) | YES | NULL | Savings |
| fixed_deposits | DECIMAL(14,2) | YES | NULL | FD amount |
| chit_funds | DECIMAL(14,2) | YES | NULL | Chit fund |
| other_assets | TEXT | YES | NULL | Description |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 7.3 customer_obligations

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| customer_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| obligation_type | VARCHAR(30) | NOT NULL | — | home_loan/vehicle/credit_card/personal/other |
| lender_name | VARCHAR(255) | NOT NULL | — | Lender/bank |
| total_amount | DECIMAL(14,2) | NOT NULL | — | Original amount |
| outstanding_amount | DECIMAL(14,2) | NOT NULL | — | Current outstanding |
| emi_amount | DECIMAL(14,2) | YES | NULL | Monthly EMI |
| emi_due_date | INTEGER | YES | NULL | Day of month |
| tenure_months | INTEGER | YES | NULL | Original tenure |
| remaining_months | INTEGER | YES | NULL | Months left |
| interest_rate | DECIMAL(5,2) | YES | NULL | Rate % |
| is_active | BOOLEAN | NOT NULL | true | Currently active |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

---

## 8. Module: Referrals & Trust Scores

### 8.1 referrals

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| referral_number | VARCHAR(10) | NOT NULL | — | Unique (REF1000001) |
| referrer_id | UUID | NOT NULL | — | FK → users(id) |
| referred_name | VARCHAR(255) | NOT NULL | — | Referee name |
| referred_phone | VARCHAR(20) | NOT NULL | — | Referee phone |
| referred_address | TEXT | YES | NULL | Referee address |
| relationship | VARCHAR(50) | YES | NULL | friend/neighbor/family |
| status | VARCHAR(30) | NOT NULL | 'pending' | pending/contacted/applied/converted/not_interested |
| converted_customer_id | UUID | YES | NULL | FK → users(id) when converted |
| reward_amount | DECIMAL(10,2) | NOT NULL | 0 | Referral reward |
| reward_paid | BOOLEAN | NOT NULL | false | Reward paid |
| notes | TEXT | YES | NULL | Notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 8.2 trust_scores

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| customer_id | UUID | NOT NULL | — | FK → users(id) |
| application_id | UUID | YES | NULL | FK → applications(id) |
| team_score | INTEGER | YES | NULL | Team assessment (0-100) |
| community_score | INTEGER | YES | NULL | Community standing (0-100) |
| repayment_history | INTEGER | YES | NULL | Past repayment (0-100) |
| overall_score | INTEGER | YES | NULL | Composite score |
| grade | VARCHAR(5) | YES | NULL | A/B/C/D/E |
| factors | JSONB | NOT NULL | '{}' | Scoring breakdown |
| calculated_by | UUID | YES | NULL | FK → users(id) |
| notes | TEXT | YES | NULL | Assessment notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

---

## 9. Module: Loan Application

### 9.1 applications

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| application_number | VARCHAR(10) | NOT NULL | — | Unique (APP1000001) |
| customer_id | UUID | NOT NULL | — | FK → users(id) ON DELETE RESTRICT |
| product_id | UUID | YES | NULL | FK → loan_products(id) |
| branch_id | UUID | NOT NULL | — | FK → branches(id) ON DELETE RESTRICT |
| area_id | UUID | YES | NULL | FK → areas(id) |
| created_by | UUID | NOT NULL | — | FK → users(id) |
| loan_amount | DECIMAL(14,2) | YES | NULL | Requested amount |
| tenure_months | INTEGER | YES | NULL | Requested tenure |
| interest_rate | DECIMAL(5,2) | YES | NULL | Approved rate |
| emi_amount | DECIMAL(14,2) | YES | NULL | Calculated EMI |
| status | VARCHAR(30) | NOT NULL | 'draft' | draft/submitted/in_review/query_raised/approved/rejected/disbursed/closed/withdrawn |
| current_stage_id | UUID | YES | NULL | FK → stages(id) |
| submitted_at | TIMESTAMP | YES | NULL | Submission time |
| approved_at | TIMESTAMP | YES | NULL | Approval time |
| approved_by | UUID | YES | NULL | FK → users(id) |
| reviewed_by | UUID | YES | NULL | FK → users(id) |
| disbursed_at | TIMESTAMP | YES | NULL | Disbursement time |
| disbursed_by | UUID | YES | NULL | FK → users(id) |
| cibil_score | INTEGER | YES | NULL | CIBIL score |
| eligibility_score | DECIMAL(5,2) | YES | NULL | Auto-calculated |
| total_household_income | DECIMAL(14,2) | YES | NULL | Monthly household income |
| trust_score | INTEGER | YES | NULL | Calculated trust score |
| rejection_reason | TEXT | YES | NULL | If rejected |
| notes | TEXT | YES | NULL | General notes |
| metadata | JSONB | NOT NULL | '{}' | Additional data |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** application_number
**Check:** loan_amount > 0

---

## 10. Module: Application Topics

### 10.1 application_topics

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| application_id | UUID | NOT NULL | — | FK → applications(id) ON DELETE CASCADE |
| topic_code | VARCHAR(50) | NOT NULL | — | Topic identifier |
| topic_name | VARCHAR(255) | NOT NULL | — | Display name |
| topic_order | INTEGER | NOT NULL | — | 1-16 display order |
| topic_data | JSONB | NOT NULL | '{}' | Flexible topic data |
| is_completed | BOOLEAN | NOT NULL | false | Completion flag |
| completion_pct | INTEGER | NOT NULL | 0 | 0-100 |
| completed_at | TIMESTAMP | YES | NULL | When completed |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** (application_id, topic_code)

**16 Topics (in order):**
| Order | Code | Display Name |
|-------|------|-------------|
| 1 | applicant_details | Applicant Details |
| 2 | basic_details | Basic Details |
| 3 | kyc_details | KYC Details |
| 4 | work_details | Work Details |
| 5 | banking_details | Banking Details |
| 6 | ratio_analysis | Ratio Analysis |
| 7 | obligations | Obligations |
| 8 | income_details | Income Details |
| 9 | customer_wealth | Customer Wealth |
| 10 | product_details | Product Details |
| 11 | property_details | Property Details |
| 12 | eligibility | Eligibility Calculation |
| 13 | documents | Documents |
| 14 | verification_checks | Verification Checks |
| 15 | notes | Notes |
| 16 | query | Query |

---

## 11. Module: Stage Workflow Engine

### 11.1 stages

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| code | VARCHAR(50) | NOT NULL | — | Unique stage code |
| name | VARCHAR(255) | NOT NULL | — | Display name |
| description | TEXT | YES | NULL | Stage description |
| stage_order | INTEGER | NOT NULL | — | Sequential order |
| required_roles | TEXT[] | YES | NULL | Allowed roles array |
| sla_hours | INTEGER | NOT NULL | 0 | SLA in hours |
| is_mandatory | BOOLEAN | NOT NULL | true | Required stage |
| is_active | BOOLEAN | NOT NULL | true | Active |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Seed stages:**
| code | name | order | required_roles | sla_hours |
|------|------|-------|----------------|-----------|
| new_application | New Application | 1 | [field_officer] | 0 |
| document_verification | Document Verification | 2 | [field_officer, team_leader] | 24 |
| field_verification | Field Verification | 3 | [field_officer] | 48 |
| credit_assessment | Credit Assessment | 4 | [team_leader, branch_admin] | 48 |
| committee_review | Committee Review | 5 | [branch_admin, super_admin] | 72 |
| approval | Approval | 6 | [branch_admin, super_admin] | 48 |
| disbursement | Disbursement | 7 | [branch_admin] | 24 |

### 11.2 application_stages

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| application_id | UUID | NOT NULL | — | FK → applications(id) ON DELETE CASCADE |
| stage_id | UUID | NOT NULL | — | FK → stages(id) |
| assigned_to | UUID | YES | NULL | FK → users(id) |
| assigned_at | TIMESTAMP | NOT NULL | NOW() | When assigned |
| started_at | TIMESTAMP | YES | NULL | When started |
| completed_at | TIMESTAMP | YES | NULL | When completed |
| status | VARCHAR(20) | NOT NULL | 'pending' | pending/in_progress/completed/skipped/returned |
| notes | TEXT | YES | NULL | Stage notes |
| return_reason | TEXT | YES | NULL | If returned |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 11.3 stage_transitions

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| application_id | UUID | NOT NULL | — | FK → applications(id) ON DELETE CASCADE |
| from_stage_id | UUID | YES | NULL | FK → stages(id) |
| to_stage_id | UUID | NOT NULL | — | FK → stages(id) |
| action | VARCHAR(30) | YES | NULL | approve/reject/query/return/assign/complete |
| performed_by | UUID | YES | NULL | FK → users(id) |
| remarks | TEXT | YES | NULL | Notes |
| performed_at | TIMESTAMP | NOT NULL | NOW() | When transitioned |

---

## 12. Module: Approval System

### 12.1 approval_limits

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| role_id | UUID | NOT NULL | — | FK → roles(id) |
| max_amount | DECIMAL(14,2) | NOT NULL | — | Max loan amount they can approve |
| min_amount | DECIMAL(14,2) | NOT NULL | 0 | Min loan amount |
| max_tenure | INTEGER | YES | NULL | Max tenure months |
| product_id | UUID | YES | NULL | FK → loan_products(id) (null = all) |
| is_active | BOOLEAN | NOT NULL | true | Active |
| effective_from | DATE | NOT NULL | CURRENT_DATE | Start date |
| effective_to | DATE | YES | NULL | End date (null = ongoing) |
| notes | TEXT | YES | NULL | Notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Check:** max_amount > min_amount

**Sample limits:**
| Role | Min | Max | Max Tenure |
|------|-----|-----|-----------|
| field_officer | 0 | 25,000 | 12 |
| team_leader | 0 | 50,000 | 24 |
| branch_admin | 0 | 200,000 | 60 |
| super_admin | 0 | 5,00,00,000 | null |

### 12.2 approval_history

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| application_id | UUID | NOT NULL | — | FK → applications(id) ON DELETE CASCADE |
| level | INTEGER | NOT NULL | — | Approval level (1-5) |
| approver_id | UUID | YES | NULL | FK → users(id) |
| role_at_time | VARCHAR(50) | YES | NULL | Approver's role |
| limit_amount | DECIMAL(14,2) | YES | NULL | Limit applicable |
| action | VARCHAR(30) | YES | NULL | approved/rejected/forwarded/query_raised |
| remarks | TEXT | YES | NULL | Remarks |
| acted_at | TIMESTAMP | NOT NULL | NOW() | When actioned |

### 12.3 application_notes

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| application_id | UUID | NOT NULL | — | FK → applications(id) ON DELETE CASCADE |
| note_type | VARCHAR(30) | YES | NULL | general/query/remark/document_required |
| note_text | TEXT | NOT NULL | — | Note content |
| is_internal | BOOLEAN | NOT NULL | true | Staff only |
| is_resolved | BOOLEAN | NOT NULL | false | Resolved |
| resolved_at | TIMESTAMP | YES | NULL | When resolved |
| added_by | UUID | NOT NULL | — | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

### 12.4 application_documents

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| application_id | UUID | NOT NULL | — | FK → applications(id) ON DELETE CASCADE |
| document_type | VARCHAR(100) | NOT NULL | — | Type: aadhaar/pan/address/proof/salary_slip/photo |
| document_name | VARCHAR(255) | YES | NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | — | Storage path |
| file_size | BIGINT | YES | NULL | Size in bytes |
| mime_type | VARCHAR(100) | YES | NULL | MIME type |
| is_verified | BOOLEAN | NOT NULL | false | Verified status |
| verified_by | UUID | YES | NULL | FK → users(id) |
| verified_at | TIMESTAMP | YES | NULL | When verified |
| uploaded_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

---

## 13. Module: Loan Management

### 13.1 loans

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| loan_number | VARCHAR(10) | NOT NULL | — | Unique (LON1000001) |
| application_id | UUID | NOT NULL | — | FK → applications(id) |
| customer_id | UUID | NOT NULL | — | FK → users(id) |
| product_id | UUID | NOT NULL | — | FK → loan_products(id) |
| branch_id | UUID | NOT NULL | — | FK → branches(id) |
| area_id | UUID | YES | NULL | FK → areas(id) |
| disbursement_id | UUID | YES | NULL | FK → disbursements(id) |
| loan_amount | DECIMAL(14,2) | NOT NULL | — | Principal |
| approved_amount | DECIMAL(14,2) | YES | NULL | Approved amount |
| tenure_months | INTEGER | NOT NULL | — | Tenure |
| interest_rate | DECIMAL(5,2) | NOT NULL | — | Annual rate % |
| interest_type | VARCHAR(20) | NOT NULL | 'reducing' | reducing/flat |
| emi_amount | DECIMAL(14,2) | NOT NULL | — | EMI |
| total_interest | DECIMAL(14,2) | YES | NULL | Total interest |
| total_payable | DECIMAL(16,2) | YES | NULL | Total to pay |
| total_charges | DECIMAL(14,2) | YES | NULL | Total charges |
| disbursement_net_amount | DECIMAL(14,2) | YES | NULL | Net disbursed |
| total_disbursed | DECIMAL(14,2) | YES | NULL | Total disbursed |
| principal_paid | DECIMAL(14,2) | NOT NULL | 0 | Principal repaid |
| interest_paid | DECIMAL(14,2) | NOT NULL | 0 | Interest paid |
| charges_paid | DECIMAL(14,2) | NOT NULL | 0 | Charges paid |
| penalty_collected | DECIMAL(14,2) | NOT NULL | 0 | Penalties collected |
| outstanding_principal | DECIMAL(14,2) | YES | NULL | Remaining principal |
| outstanding_total | DECIMAL(16,2) | YES | NULL | Total outstanding |
| emi_paid_count | INTEGER | NOT NULL | 0 | EMIs paid |
| total_emis | INTEGER | NOT NULL | — | Total EMIs |
| overdue_emis | INTEGER | NOT NULL | 0 | Overdue count |
| first_emi_date | DATE | YES | NULL | First EMI date |
| last_emi_date | DATE | YES | NULL | Last EMI date |
| status | VARCHAR(30) | NOT NULL | 'disbursed' | disbursed/active/completed/foreclosed/written_off/npa |
| foreclosure_date | DATE | YES | NULL | If foreclosed |
| closure_date | DATE | YES | NULL | If closed |
| npa_classification | UUID | YES | NULL | FK → npa_classifications(id) |
| created_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** loan_number
**Check:** loan_amount > 0, emi_amount > 0

---

## 14. Module: EMI Schedule & Payments

### 14.1 emi_schedules

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| loan_id | UUID | NOT NULL | — | FK → loans(id) ON DELETE CASCADE |
| emi_number | INTEGER | NOT NULL | — | Sequence: 1, 2, 3... |
| due_date | DATE | NOT NULL | — | Due date |
| emi_amount | DECIMAL(14,2) | NOT NULL | — | Total EMI |
| principal | DECIMAL(14,2) | NOT NULL | — | Principal portion |
| interest | DECIMAL(14,2) | NOT NULL | — | Interest portion |
| opening_balance | DECIMAL(14,2) | NOT NULL | — | Balance before |
| closing_balance | DECIMAL(14,2) | NOT NULL | — | Balance after |
| is_paid | BOOLEAN | NOT NULL | false | Paid flag |
| paid_on | DATE | YES | NULL | Payment date |
| paid_amount | DECIMAL(14,2) | YES | NULL | Amount paid |
| is_overdue | BOOLEAN | NOT NULL | false | Overdue flag |
| penalty_applied | DECIMAL(14,2) | NOT NULL | 0 | Penalty amount |
| days_overdue | INTEGER | NOT NULL | 0 | Days past due |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** (loan_id, emi_number)

### 14.2 emi_payments

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| payment_number | VARCHAR(10) | NOT NULL | — | Unique (PAY1000001) |
| loan_id | UUID | NOT NULL | — | FK → loans(id) |
| emi_schedule_id | UUID | YES | NULL | FK → emi_schedules(id) |
| customer_id | UUID | NOT NULL | — | FK → users(id) |
| payment_amount | DECIMAL(14,2) | NOT NULL | — | Total paid |
| principal_component | DECIMAL(14,2) | NOT NULL | 0 | Principal portion |
| interest_component | DECIMAL(14,2) | NOT NULL | 0 | Interest portion |
| penalty_component | DECIMAL(14,2) | NOT NULL | 0 | Penalty portion |
| payment_method | VARCHAR(30) | NOT NULL | 'cash' | cash/bank_transfer/upi/cheque/card |
| bank_account_id | UUID | YES | NULL | FK → bank_accounts(id) |
| transaction_ref | VARCHAR(255) | YES | NULL | UPI/ref number |
| payment_date | DATE | NOT NULL | CURRENT_DATE | Payment date |
| received_by | UUID | YES | NULL | FK → users(id) |
| is_verified | BOOLEAN | NOT NULL | true | Verified |
| notes | TEXT | YES | NULL | Notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** payment_number

---

## 15. Module: Payment Receipts

### 15.1 payment_receipts

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| receipt_number | VARCHAR(10) | NOT NULL | — | Unique (RCP1000001) |
| emi_payment_id | UUID | NOT NULL | — | FK → emi_payments(id) |
| loan_id | UUID | NOT NULL | — | FK → loans(id) |
| customer_id | UUID | NOT NULL | — | FK → users(id) |
| receipt_amount | DECIMAL(14,2) | NOT NULL | — | Amount |
| receipt_date | DATE | NOT NULL | CURRENT_DATE | Date |
| receipt_type | VARCHAR(30) | NOT NULL | 'emi' | emi/penalty/partial/settlement |
| pdf_path | VARCHAR(500) | YES | NULL | PDF URL |
| is_emailed | BOOLEAN | NOT NULL | false | Email sent |
| is_sms_sent | BOOLEAN | NOT NULL | false | SMS sent |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** receipt_number

---

## 16. Module: Penalties

### 16.1 penalties

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| penalty_number | VARCHAR(10) | NOT NULL | — | Unique (PEN1000001) |
| loan_id | UUID | NOT NULL | — | FK → loans(id) |
| emi_schedule_id | UUID | YES | NULL | FK → emi_schedules(id) |
| customer_id | UUID | NOT NULL | — | FK → users(id) |
| penalty_type | VARCHAR(30) | NOT NULL | — | late_payment/bounced_cheque/legal |
| penalty_amount | DECIMAL(14,2) | NOT NULL | — | Full penalty |
| waived_amount | DECIMAL(14,2) | NOT NULL | 0 | Waived amount |
| final_amount | DECIMAL(14,2) | NOT NULL | — | Net penalty |
| penalty_date | DATE | NOT NULL | — | Penalty date |
| due_date | DATE | NOT NULL | — | Due date |
| is_paid | BOOLEAN | NOT NULL | false | Paid flag |
| paid_on | DATE | YES | NULL | Payment date |
| is_waived | BOOLEAN | NOT NULL | false | Waived |
| waived_by | UUID | YES | NULL | FK → users(id) |
| waiver_reason | TEXT | YES | NULL | Why waived |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** penalty_number

---

## 17. Module: Disbursements

### 17.1 disbursements

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| disbursement_number | VARCHAR(10) | NOT NULL | — | Unique (DSB1000001) |
| loan_id | UUID | NOT NULL | — | FK → loans(id) |
| application_id | UUID | NOT NULL | — | FK → applications(id) |
| customer_id | UUID | NOT NULL | — | FK → users(id) |
| product_id | UUID | NOT NULL | — | FK → loan_products(id) |
| branch_id | UUID | NOT NULL | — | FK → branches(id) |
| bank_account_id | UUID | NOT NULL | — | FK → bank_accounts(id) |
| loan_amount | DECIMAL(14,2) | NOT NULL | — | Gross loan |
| processing_fee | DECIMAL(14,2) | NOT NULL | 0 | Processing fee |
| document_charge | DECIMAL(14,2) | NOT NULL | 0 | Document charge |
| insurance_amount | DECIMAL(14,2) | NOT NULL | 0 | Insurance |
| other_charges | DECIMAL(14,2) | NOT NULL | 0 | Other |
| total_charges | DECIMAL(14,2) | NOT NULL | — | Sum of all charges |
| net_disbursement_amount | DECIMAL(14,2) | NOT NULL | — | To customer |
| disbursement_mode | VARCHAR(20) | NOT NULL | 'bank_transfer' | bank_transfer/cash/imps/neft/rtgs |
| utr_number | VARCHAR(100) | YES | NULL | UTR/ref |
| disbursement_date | DATE | NOT NULL | — | Disbursement date |
| approved_by | UUID | YES | NULL | FK → users(id) |
| processed_by | UUID | YES | NULL | FK → users(id) |
| status | VARCHAR(30) | NOT NULL | 'pending' | pending/approved/processing/completed/failed/cancelled |
| status_changed_at | TIMESTAMP | YES | NULL | Status change time |
| failure_reason | TEXT | YES | NULL | If failed |
| notes | TEXT | YES | NULL | Remarks |
| metadata | JSONB | NOT NULL | '{}' | Extra data |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** disbursement_number

---

## 18. Module: Disbursement Charges

### 18.1 disbursement_charges

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| charge_number | VARCHAR(10) | NOT NULL | — | Unique (CHG1000001) |
| disbursement_id | UUID | NOT NULL | — | FK → disbursements(id) ON DELETE CASCADE |
| charge_type | VARCHAR(30) | NOT NULL | — | processing_fee/document_charge/insurance/other |
| charge_head | VARCHAR(255) | YES | NULL | Display name |
| calculation_type | VARCHAR(20) | YES | NULL | percentage/flat/slab |
| base_amount | DECIMAL(14,2) | YES | NULL | On which calculated |
| rate_pct | DECIMAL(5,2) | YES | NULL | % rate |
| flat_amount | DECIMAL(14,2) | YES | NULL | Flat charge |
| charge_amount | DECIMAL(14,2) | NOT NULL | — | Calculated amount |
| slab_id | UUID | YES | NULL | FK → product_slabs(id) if slab-based |
| cgst_pct | DECIMAL(5,2) | NOT NULL | 0 | CGST % |
| sgst_pct | DECIMAL(5,2) | NOT NULL | 0 | SGST % |
| cgst_amount | DECIMAL(10,2) | NOT NULL | 0 | CGST amount |
| sgst_amount | DECIMAL(10,2) | NOT NULL | 0 | SGST amount |
| total_amount | DECIMAL(14,2) | NOT NULL | — | charge_amount + taxes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** charge_number

---

## 19. Module: Ledger — Chart of Accounts

### 19.1 ledger_accounts

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| account_code | VARCHAR(10) | NOT NULL | — | Unique (LDG1000001) |
| account_name | VARCHAR(255) | NOT NULL | — | Account name |
| account_group | VARCHAR(100) | NOT NULL | — | assets/liabilities/income/expenses/equity |
| parent_account_id | UUID | YES | NULL | FK → ledger_accounts(id) |
| account_type | VARCHAR(50) | YES | NULL | direct/indirect/contra |
| is_active | BOOLEAN | NOT NULL | true | Active |
| is_system | BOOLEAN | NOT NULL | false | System account |
| opening_balance | DECIMAL(16,2) | NOT NULL | 0 | Opening balance |
| current_balance | DECIMAL(16,2) | NOT NULL | 0 | Current balance |
| description | TEXT | YES | NULL | Account notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** account_code

**Account Groups:**
| Group | Type | Example |
|-------|------|---------|
| Assets | debit | Cash, Bank, Loan Portfolio, Receivables |
| Liabilities | credit | Payables, Provisions |
| Income | credit | Interest, Fee, Penalty Income |
| Expenses | debit | Salary, Rent, Office, Marketing |
| Equity | credit | Capital, Reserves |

---

## 20. Module: Ledger Entries & Lines

### 20.1 ledger_entries

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| entry_number | VARCHAR(10) | NOT NULL | — | Unique (LDG1000001) |
| entry_date | DATE | NOT NULL | CURRENT_DATE | Transaction date |
| description | VARCHAR(500) | NOT NULL | — | Entry description |
| reference_type | VARCHAR(50) | YES | NULL | disbursement/emi_payment/penalty/expense/journal |
| reference_id | UUID | YES | NULL | FK to reference table |
| reference_number | VARCHAR(30) | YES | NULL | Human-readable ref |
| narration | TEXT | YES | NULL | Detailed narration |
| created_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** entry_number

### 20.2 ledger_entry_lines

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| ledger_entry_id | UUID | NOT NULL | — | FK → ledger_entries(id) ON DELETE CASCADE |
| account_id | UUID | NOT NULL | — | FK → ledger_accounts(id) |
| debit_amount | DECIMAL(16,2) | NOT NULL | 0 | Debit |
| credit_amount | DECIMAL(16,2) | NOT NULL | 0 | Credit |
| line_order | INTEGER | NOT NULL | — | Display order |
| narration | TEXT | YES | NULL | Line description |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Constraint:** debit_amount >= 0, credit_amount >= 0, NOT both > 0

---

## 21. Module: Ledger Account Balances

### 21.1 ledger_account_balances

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| account_id | UUID | NOT NULL | — | FK → ledger_accounts(id) ON DELETE CASCADE |
| as_of_date | DATE | NOT NULL | — | Balance date |
| opening_balance | DECIMAL(16,2) | NOT NULL | — | Opening balance |
| total_debit | DECIMAL(16,2) | NOT NULL | 0 | Total debits |
| total_credit | DECIMAL(16,2) | NOT NULL | 0 | Total credits |
| closing_balance | DECIMAL(16,2) | NOT NULL | — | Closing balance |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** (account_id, as_of_date)

---

## 22. Module: Bank Statement Entries

### 22.1 bank_statement_entries

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| bank_account_id | UUID | NOT NULL | — | FK → bank_accounts(id) |
| entry_date | DATE | NOT NULL | — | Transaction date |
| description | VARCHAR(500) | YES | NULL | Transaction description |
| transaction_ref | VARCHAR(100) | YES | NULL | Ref number |
| debit_amount | DECIMAL(16,2) | NOT NULL | 0 | Debit |
| credit_amount | DECIMAL(16,2) | NOT NULL | 0 | Credit |
| balance | DECIMAL(16,2) | NOT NULL | — | Running balance |
| entry_type | VARCHAR(20) | YES | NULL | auto/manual |
| is_reconciled | BOOLEAN | NOT NULL | false | Reconciled |
| reconciled_with_id | UUID | YES | NULL | FK → ledger_entry_lines(id) |
| reconciled_at | TIMESTAMP | YES | NULL | When reconciled |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

---

## 23. Module: Bank Reconciliations

### 23.1 bank_reconciliations

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| reconciliation_number | VARCHAR(10) | NOT NULL | — | Unique (REC1000001) |
| bank_account_id | UUID | NOT NULL | — | FK → bank_accounts(id) |
| from_date | DATE | NOT NULL | — | Start date |
| to_date | DATE | NOT NULL | — | End date |
| bank_closing_balance | DECIMAL(16,2) | NOT NULL | — | Per bank statement |
| book_closing_balance | DECIMAL(16,2) | NOT NULL | — | Per ledger |
| difference | DECIMAL(16,2) | NOT NULL | 0 | Difference |
| is_completed | BOOLEAN | NOT NULL | false | Completed |
| reconciled_by | UUID | YES | NULL | FK → users(id) |
| completed_at | TIMESTAMP | YES | NULL | When done |
| notes | TEXT | YES | NULL | Notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** reconciliation_number

---

## 24. Module: Verification Tasks & Results

### 24.1 verification_tasks

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| task_number | VARCHAR(10) | NOT NULL | — | Unique (TSK1000001) |
| application_id | UUID | NOT NULL | — | FK → applications(id) |
| task_type | VARCHAR(30) | NOT NULL | — | field_verification/document_verification/collection/address_verification |
| assigned_to | UUID | NOT NULL | — | FK → users(id) |
| assigned_by | UUID | NOT NULL | — | FK → users(id) |
| priority | VARCHAR(20) | NOT NULL | 'medium' | low/medium/high/urgent |
| scheduled_date | DATE | YES | NULL | Planned date |
| completed_date | DATE | YES | NULL | When done |
| status | VARCHAR(30) | NOT NULL | 'assigned' | assigned/in_progress/completed/cancelled/overdue |
| verification_data | JSONB | NOT NULL | '{}' | Verification findings |
| photos | TEXT[] | YES | NULL | Photo URLs array |
| gps_latitude | DECIMAL(10,8) | YES | NULL | GPS latitude |
| gps_longitude | DECIMAL(11,8) | YES | NULL | GPS longitude |
| gps_accuracy | DECIMAL(10,2) | YES | NULL | GPS accuracy meters |
| notes | TEXT | YES | NULL | Officer notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** task_number

**verification_data JSONB structure:**
```json
{
  "customer_present": true,
  "address_matches": true,
  "documents_verified": true,
  "neighbors_confirm": true,
  "business_verified": true,
  "recommendation": "approve",
  "distance_from_address": "0.2 km"
}
```

### 24.2 verifications

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| verification_number | VARCHAR(10) | NOT NULL | — | Unique (VER1000001) |
| task_id | UUID | NOT NULL | — | FK → verification_tasks(id) |
| verification_type | VARCHAR(50) | NOT NULL | — | Type of verification |
| result | VARCHAR(30) | NOT NULL | — | verified/not_verified/partial/discrepancy_found |
| applicant_present | BOOLEAN | YES | NULL | Was applicant present |
| address_matches | BOOLEAN | YES | NULL | Address matches |
| documents_verified | TEXT[] | YES | NULL | Which docs verified |
| discrepancies | TEXT | YES | NULL | Issues found |
| recommendation | VARCHAR(30) | YES | NULL | approve/reject/review |
| risk_rating | VARCHAR(20) | YES | NULL | low/medium/high |
| officer_rating | INTEGER | YES | NULL | 1-5 rating |
| submitted_by | UUID | NOT NULL | — | FK → users(id) |
| submitted_at | TIMESTAMP | NOT NULL | NOW() | When submitted |
| reviewed_by | UUID | YES | NULL | FK → users(id) |
| reviewed_at | TIMESTAMP | YES | NULL | When reviewed |
| notes | TEXT | YES | NULL | Notes |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** verification_number

---

## 25. Module: NPA Classification

### 25.1 npa_classifications

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| npa_number | VARCHAR(10) | NOT NULL | — | Unique (NPA1000001) |
| loan_id | UUID | NOT NULL | — | FK → loans(id) |
| customer_id | UUID | NOT NULL | — | FK → users(id) |
| classification_date | DATE | NOT NULL | — | Classification date |
| overdue_days | INTEGER | NOT NULL | — | Days overdue |
| overdue_amount | DECIMAL(14,2) | NOT NULL | — | Overdue amount |
| npa_category | VARCHAR(20) | NOT NULL | — | sub_standard/doubtful/loss |
| substandard_days | INTEGER | YES | NULL | Days in substandard |
| doubtful_days | INTEGER | YES | NULL | Days in doubtful |
| provision_amount | DECIMAL(14,2) | NOT NULL | 0 | RBI provision |
| provision_pct | DECIMAL(5,2) | NOT NULL | 0 | Provision % |
| action_taken | TEXT | YES | NULL | Recovery actions |
| is_active | BOOLEAN | NOT NULL | true | Active |
| created_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** npa_number, loan_id
**NPA Categories (RBI):** sub_standard (90-179 days, 15%), doubtful (180-359 days, 40%), loss (360+ days, 100%)

---

## 26. Module: Communication Templates & Logs

### 26.1 sms_templates

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| template_code | VARCHAR(10) | NOT NULL | — | Unique code |
| template_name | VARCHAR(255) | NOT NULL | — | Display name |
| category | VARCHAR(50) | YES | NULL | application/payment/reminder/disbursement |
| language | VARCHAR(10) | NOT NULL | 'en' | Language code |
| template_text | TEXT | NOT NULL | — | Template with {variables} |
| variables | TEXT[] | YES | NULL | Variable names |
| is_active | BOOLEAN | NOT NULL | true | Active |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 26.2 sms_logs

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| sms_number | VARCHAR(10) | NOT NULL | — | Unique (SMS1000001) |
| recipient_phone | VARCHAR(20) | NOT NULL | — | Phone number |
| recipient_name | VARCHAR(255) | YES | NULL | Name |
| template_id | UUID | YES | NULL | FK → sms_templates(id) |
| message_text | TEXT | NOT NULL | — | Final message |
| template_vars | JSONB | NOT NULL | '{}' | Variables used |
| status | VARCHAR(30) | NOT NULL | — | pending/sent/delivered/failed/bounced |
| gateway_ref | VARCHAR(255) | YES | NULL | Provider ref |
| error_message | TEXT | YES | NULL | If failed |
| sent_at | TIMESTAMP | YES | NULL | When sent |
| delivered_at | TIMESTAMP | YES | NULL | When delivered |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

### 26.3 email_templates

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| template_code | VARCHAR(10) | NOT NULL | — | Unique code |
| template_name | VARCHAR(255) | NOT NULL | — | Display name |
| category | VARCHAR(50) | YES | NULL | Category |
| subject | VARCHAR(500) | NOT NULL | — | Email subject |
| html_body | TEXT | NOT NULL | — | HTML body |
| text_body | TEXT | YES | NULL | Plain text |
| variables | TEXT[] | YES | NULL | Variable names |
| is_active | BOOLEAN | NOT NULL | true | Active |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

### 26.4 email_logs

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| email_number | VARCHAR(10) | NOT NULL | — | Unique (EML1000001) |
| recipient_email | VARCHAR(255) | NOT NULL | — | To address |
| recipient_name | VARCHAR(255) | YES | NULL | To name |
| template_id | UUID | YES | NULL | FK → email_templates(id) |
| subject | VARCHAR(500) | YES | NULL | Subject |
| body_html | TEXT | YES | NULL | HTML body |
| body_text | TEXT | YES | NULL | Plain text |
| status | VARCHAR(30) | NOT NULL | — | pending/sent/failed/bounced |
| gateway_ref | VARCHAR(255) | YES | NULL | Provider ref |
| error_message | TEXT | YES | NULL | If failed |
| sent_at | TIMESTAMP | YES | NULL | When sent |
| opened_at | TIMESTAMP | YES | NULL | When opened |
| clicked_at | TIMESTAMP | YES | NULL | When clicked |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

---

## 27. Module: Audit Logs

### 27.1 audit_logs

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| audit_number | VARCHAR(10) | NOT NULL | — | Unique (AUD1000001) |
| user_id | UUID | YES | NULL | FK → users(id) (null for system) |
| action | VARCHAR(100) | NOT NULL | — | Action performed |
| entity_type | VARCHAR(50) | YES | NULL | Table: application/loan/disbursement/payment |
| entity_id | UUID | YES | NULL | FK to entity |
| entity_number | VARCHAR(30) | YES | NULL | Human-readable ID |
| old_values | JSONB | YES | NULL | Previous values |
| new_values | JSONB | YES | NULL | New values |
| ip_address | VARCHAR(50) | YES | NULL | Client IP |
| user_agent | TEXT | YES | NULL | Browser info |
| created_at | TIMESTAMP | NOT NULL | NOW() | When actioned |

**Unique:** audit_number

---

## 28. Module: App Settings

### 28.1 app_settings

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| setting_key | VARCHAR(100) | NOT NULL | — | Setting key |
| setting_value | JSONB | NOT NULL | '{}' | Setting value |
| description | TEXT | YES | NULL | Description |
| is_public | BOOLEAN | NOT NULL | false | Visible to frontend |
| updated_by | UUID | YES | NULL | FK → users(id) |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |
| updated_at | TIMESTAMP | NOT NULL | NOW() | Record updated |

**Unique:** setting_key

**Sample settings:**
| key | value |
|-----|-------|
| app_name | {"value": "CMF"} |
| late_payment_penalty_rate | {"value": 3.0} |
| emi_reminder_days_before | {"value": 3} |
| npa_days_threshold | {"value": 90} |
| default_processing_fee_pct | {"value": 2.0} |
| sms_provider | {"value": "msg91"} |
| email_provider | {"value": "resend"} |

---

## 29. Module: Security Tokens

### 29.1 password_reset_tokens

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| user_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| token | VARCHAR(255) | NOT NULL | — | Unique token |
| expires_at | TIMESTAMP | NOT NULL | — | Expiry |
| used_at | TIMESTAMP | YES | NULL | When used |
| ip_address | VARCHAR(50) | YES | NULL | Requester IP |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** token

### 29.2 jwt_refresh_tokens

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| user_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| token | VARCHAR(500) | NOT NULL | — | Refresh token |
| expires_at | TIMESTAMP | NOT NULL | — | Expiry |
| revoked_at | TIMESTAMP | YES | NULL | When revoked |
| ip_address | VARCHAR(50) | YES | NULL | IP |
| user_agent | TEXT | YES | NULL | Browser |
| created_at | TIMESTAMP | NOT NULL | NOW() | Record created |

**Unique:** token

### 29.3 login_audit

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NOT NULL | gen_random_uuid() | Primary key |
| user_id | UUID | NOT NULL | — | FK → users(id) ON DELETE CASCADE |
| login_at | TIMESTAMP | NOT NULL | NOW() | Login time |
| logout_at | TIMESTAMP | YES | NULL | Logout time |
| ip_address | VARCHAR(50) | YES | NULL | IP |
| user_agent | TEXT | YES | NULL | Browser |
| success | BOOLEAN | NOT NULL | — | Success flag |
| failure_reason | VARCHAR(255) | YES | NULL | If failed |

---

## 30. Relationships Diagram

```
users (UUID PK)
  │
  ├─→ user_profiles (1:1 via user_id UUID)
  │
  ├─→ user_areas (many:many through)
  │     └─→ areas (UUID PK)
  │           └─→ branches (UUID PK)
  │
  ├─→ user_permission_overrides (many:many through permissions)
  │
  ├─→ login_audit (1:many)
  ├─→ password_reset_tokens (1:many)
  ├─→ jwt_refresh_tokens (1:many)
  │
  ├─→ applications (as created_by, approved_by, reviewed_by, disbursed_by)
  │     ├─→ loan_products (UUID PK)
  │     ├─→ branches (UUID PK)
  │     ├─→ areas (UUID PK)
  │     │
  │     ├─→ application_topics (1:many, UUID PK)
  │     ├─→ application_notes (1:many, UUID PK)
  │     ├─→ application_documents (1:many, UUID PK)
  │     ├─→ application_stages (1:many, UUID PK)
  │     ├─→ stage_transitions (1:many, UUID PK)
  │     ├─→ approval_history (1:many, UUID PK)
  │     │
  │     └─→ loans (1:1)
  │           ├─→ branches (UUID)
  │           ├─→ areas (UUID)
  │           ├─→ disbursements (1:many)
  │           │     ├─→ bank_accounts (UUID)
  │           │     ├─→ disbursement_charges (1:many)
  │           │     └─→ product_slabs (many:1)
  │           │
  │           ├─→ emi_schedules (1:many, UUID PK)
  │           │     ├─→ emi_payments (many:1 via emi_schedule_id)
  │           │     │     ├─→ payment_receipts (1:1)
  │           │     │     └─→ penalties (1:many)
  │           │     └─→ penalties (1:many)
  │           │
  │           ├─→ ledger_entries (as reference_type/id)
  │           │     └─→ ledger_entry_lines (1:many)
  │           │           └─→ ledger_accounts (UUID PK)
  │           │
  │           ├─→ bank_statement_entries (via bank_accounts)
  │           │
  │           ├─→ npa_classifications (1:many, UNIQUE(loan_id))
  │           │
  │           └─→ verification_tasks (as application_id, loan_id)
  │                 └─→ verifications (1:1 via task_id)
  │
  ├─→ verification_tasks (as assigned_to, assigned_by)
  ├─→ verifications (as submitted_by, reviewed_by)
  ├─→ emi_payments (as received_by)
  ├─→ penalties (as waived_by)
  ├─→ disbursements (as approved_by, processed_by)
  ├─→ audit_logs (as user_id)
  │
  ├─→ customer_banking (through users.customer relationship)
  ├─→ customer_wealth
  ├─→ customer_obligations
  │
  ├─→ referrals (as referrer_id)
  └─→ trust_scores (as customer_id, calculated_by)

roles (UUID PK)
  └─→ role_permissions (many:many through)
        └─→ permissions (UUID PK)

loan_products (UUID PK)
  └─→ product_slabs (1:many)
```

---

## 31. Index Strategy

```sql
-- Core indexes (from migrations.sql)
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

CREATE INDEX idx_applications_number ON applications(application_number);
CREATE INDEX idx_applications_customer ON applications(customer_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_branch ON applications(branch_id);
CREATE INDEX idx_applications_created ON applications(created_at DESC);
CREATE INDEX idx_applications_customer_status ON applications(customer_id, status);

CREATE INDEX idx_loans_number ON loans(loan_number);
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_branch ON loans(branch_id);
CREATE INDEX idx_loans_product ON loans(product_id);

CREATE INDEX idx_emi_schedules_loan ON emi_schedules(loan_id);
CREATE INDEX idx_emi_schedules_due ON emi_schedules(due_date, is_paid);

CREATE INDEX idx_emi_payments_loan ON emi_payments(loan_id);
CREATE INDEX idx_emi_payments_customer ON emi_payments(customer_id);
CREATE INDEX idx_emi_payments_date ON emi_payments(payment_date DESC);

CREATE INDEX idx_penalties_loan ON penalties(loan_id);
CREATE INDEX idx_penalties_customer ON penalties(customer_id);
CREATE INDEX idx_penalties_due ON penalties(due_date, is_paid);

CREATE INDEX idx_verification_tasks_assigned ON verification_tasks(assigned_to, status);

CREATE INDEX idx_bank_statement_account ON bank_statement_entries(bank_account_id, entry_date DESC);

CREATE INDEX idx_npa_loan ON npa_classifications(loan_id);
CREATE INDEX idx_npa_date ON npa_classifications(classification_date DESC);

CREATE INDEX idx_ledger_entries_date ON ledger_entries(entry_date DESC);
CREATE INDEX idx_ledger_entries_reference ON ledger_entries(reference_type, reference_id);
CREATE INDEX idx_ledger_accounts_group ON ledger_accounts(account_group);

CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE INDEX idx_application_stages_app ON application_stages(application_id);
CREATE INDEX idx_stage_transitions_app ON stage_transitions(application_id, performed_at DESC);
CREATE INDEX idx_app_documents_app ON application_documents(application_id);
```

---

*End of Database Fields with Modules v2.0*
*Continumm Micro Finance Pvt Ltd — Chennai*