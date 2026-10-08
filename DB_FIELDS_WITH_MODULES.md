# CMF — Database Fields & Modules Specification

## Continnum Microfinance Private Limited
**Location:** Chennai, Tamil Nadu, India
**Database:** PostgreSQL (via Supabase)
**Version:** 1.0.0 — October 2026

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [Core Data Tables (Module 01 — Users & Roles)](#module-01--users--roles)
3. [Module 02 — Branches & Areas](#module-02--branches--areas)
4. [Module 03 — Loan Products](#module-03--loan-products)
5. [Module 04 — Loan Applications](#module-04--loan-applications)
6. [Module 05 — Loans & EMI](#module-05--loans--emi)
7. [Module 06 — Disbursement & Charges](#module-06--disbursement--charges)
8. [Module 07 — EMI Payments & Penalties](#module-07--emi-payments--penalties)
9. [Module 08 — Ledger & Accounting](#module-08--ledger--accounting)
10. [Module 09 — Bank Accounts & Statements](#module-09--bank-accounts--statements)
11. [Module 10 — Verification & Tasks](#module-10--verification--tasks)
12. [Module 11 — Communications (SMS & Email)](#module-11--communications-sms--email)
13. [Module 12 — Dashboard & Reports](#module-12--dashboard--reports)
14. [Module 13 — NPA & Collection](#module-13--npa--collection)
15. [Module 14 — Referrals & Trust](#module-14--referrals--trust)
16. [Module 15 — Audit & Security](#module-15--audit--security)
17. [Module 16 — Settings & System](#module-16--settings--system)
18. [Entity Relationship Summary](#entity-relationship-summary)
19. [Database Functions & Triggers](#database-functions--triggers)
20. [Views & Reports](#views--reports)

---

## Module Overview

| # | Module Name | Tables | Purpose |
|---|-------------|--------|---------|
| 01 | Users & Roles | 4 | Authentication, authorization, user management |
| 02 | Branches & Areas | 2 | Geographic organization |
| 03 | Loan Products | 2 | Product catalog with interest slabs |
| 04 | Loan Applications | 6 | End-to-end application lifecycle with topics |
| 05 | Loans & EMI | 2 | Active loans and EMI schedules |
| 06 | Disbursement & Charges | 2 | Disbursement processing with dynamic charges |
| 07 | EMI Payments & Penalties | 2 | Payment collection and penalty tracking |
| 08 | Ledger & Accounting | 3 | Double-entry bookkeeping |
| 09 | Bank Accounts & Statements | 2 | Multi-bank reconciliation |
| 10 | Verification & Tasks | 2 | Field verification, task assignment |
| 11 | Communications | 4 | SMS, email templates and logs |
| 12 | Dashboard & Reports | 2 | Reports and calculations |
| 13 | NPA & Collection | 2 | Overdue tracking, NPA classification |
| 14 | Referrals & Trust | 2 | Customer referral, trust scoring |
| 15 | Audit & Security | 1 | Complete audit trail |
| 16 | Settings & System | 1 | ID generation counter |

**Total: 48 tables across 16 modules**

---

## Module 01 — Users & Roles

### 1.1 `users` — Core user accounts

```sql
Column                | Type           | Null | Default           | Description
----------------------|----------------|------|-------------------|------------------------------------
id                    | uuid           | No   | gen_random_uuid() | Primary key
customer_code         | varchar(20)    | No   | generate_id('CMF')| Auto-generated unique code
username              | varchar(50)    | No   |                   | Login username (unique)
email                 | varchar(255)   | No   |                   | Email address (unique)
phone                 | varchar(15)    | No   |                   | Phone number (unique)
password_hash         | varchar(255)   | No   |                   | bcrypt hashed password
role                  | user_role_enum | No   | 'customer'        | Role (enum)
is_active             | boolean        | No   | true              | Account active flag
is_verified           | boolean        | No   | false             | Verification status
email_verified        | boolean        | No   | false             | Email OTP verified
phone_verified        | boolean        | No   | false             | Phone OTP verified
login_attempts        | integer        | No   | 0                 | Failed login counter
locked_until          | timestamp      | Yes  |                   | Account lock expiry
last_login_at         | timestamp      | Yes  |                   | Last successful login
last_login_ip         | varchar(45)    | Yes  |                   | Last login IP address
created_at            | timestamp      | No   | NOW()             | Creation timestamp
updated_at            | timestamp      | No   | NOW()             | Update timestamp
created_by            | uuid           | Yes  |                   | Creator user ID
```

**Enum `user_role_enum`:** `super_admin`, `branch_admin`, `team_leader`, `field_officer`, `collection_agent`, `customer`, `lender`, `support`

**Indexes:** `idx_users_email` on email, `idx_users_phone` on phone, `idx_users_role` on role, `idx_users_customer_code` on customer_code

### 1.2 `user_profiles` — Extended profile information

```sql
Column                | Type           | Null | Default | Description
----------------------|----------------|------|---------|------------------------------------
id                    | uuid           | No   | PK      | Primary key
user_id               | uuid           | No   | FK      | References users(id) — UNIQUE
first_name            | varchar(100)   | No   |         | First name
middle_name           | varchar(100)   | Yes  |         | Middle name
last_name             | varchar(100)   | No   |         | Last name
date_of_birth         | date           | Yes  |         | Date of birth
gender                | gender_enum    | Yes  |         | male / female / other
marital_status        | marital_enum   | Yes  |         | single / married / divorced / widowed
father_name           | varchar(200)   | Yes  |         | Father's full name
spouse_name           | varchar(200)   | Yes  |         | Spouse's full name
occupation            | varchar(100)   | Yes  |         | Primary occupation
address               | text           | Yes  |         | Full residential address
city                  | varchar(100)   | Yes  |         | City
state                 | varchar(100)   | Yes  |         | State
pincode               | varchar(10)    | Yes  |         | Postal code
country               | varchar(100)   | Yes  | 'India' | Country
latitude              | decimal(10,7)  | Yes  |         | GPS latitude
longitude             | decimal(10,7)  | Yes  |         | GPS longitude
aadhaar_number        | varchar(12)    | Yes  |         | Aadhaar (encrypted)
aadhaar_last4         | varchar(4)     | Yes  |         | Last 4 digits only (for display)
aadhaar_verified      | boolean        | No   | false   | Aadhaar verification status
aadhaar_verified_at   | timestamp      | Yes  |         | Verification date
aadhaar_verified_by   | uuid           | Yes  |         | Verified by user ID
pan_number            | varchar(10)    | Yes  |         | PAN number (encrypted)
pan_verified          | boolean        | No   | false   | PAN verification status
photo_url             | varchar(500)   | Yes  |         | Profile photo URL
signature_url         | varchar(500)   | Yes  |         | Signature image URL
profile_completed     | boolean        | No   | false   | Profile completion flag
created_at            | timestamp      | No   | NOW()   |
updated_at            | timestamp      | No   | NOW()   |
```

**Enums:** `gender_enum = ('male', 'female', 'other', 'prefer_not_to_say')`, `marital_enum = ('single', 'married', 'divorced', 'widowed')`

### 1.3 `roles` — Application roles (separate from users.role enum, used for RBAC)

```sql
Column           | Type          | Null | Default | Description
-----------------|---------------|------|---------|------------------------------------
id               | uuid          | No   | PK      | Primary key
name             | varchar(50)   | No   |         | Role key name (unique)
display_name     | varchar(100)  | No   |         | Human-readable name
description      | text          | Yes  |         | Role description
is_system_role   | boolean       | No   | false   | Cannot be deleted
is_active        | boolean       | No   | true    | Active flag
created_at       | timestamp     | No   | NOW()   |
```

**Seeded roles:** `super_admin`, `branch_admin`, `team_leader`, `field_officer`, `collection_agent`, `customer`, `lender`, `support`

### 1.4 `permissions` — Granular permissions for RBAC

```sql
Column       | Type          | Null | Default | Description
-------------|---------------|------|---------|------------------------------------
id           | uuid          | No   | PK      | Primary key
name         | varchar(100)  | No   |         | Permission key (e.g., "applications.create")
display_name | varchar(100)  | No   |         | Human-readable
module       | varchar(50)   | No   |         | Feature module name
description  | text          | Yes  |         | Permission description
created_at   | timestamp     | No   | NOW()   |
```

**Seeded permissions (38 total):**
```
dashboard.view, branches.view/create/edit, areas.view/create/edit/assign,
users.view/create/edit, products.view/create/edit,
applications.view/create/review/approve/reject/query,
disbursements.view/create, emi.view/collect,
ledger.view/create, banks.view, tasks.view/assign,
sms.view/send, email.view/send,
reports.dashboard/emi/collection/loan/ledger,
settings.view
```

### 1.5 `role_permissions` — Maps permissions to roles

```sql
Column         | Type      | Null | Default | Description
---------------|-----------|------|---------|------------------------------------
id             | uuid      | No   | PK      | Primary key
role_id        | uuid      | No   | FK      | References roles(id)
permission_id  | uuid      | No   | FK      | References permissions(id)
is_granted     | boolean   | No   | true    | Granted (true) or denied (false)
created_at     | timestamp | No   | NOW()   |
created_by     | uuid      | Yes  |         | Creator
```

**Unique constraint:** `(role_id, permission_id)`

### 1.6 `user_permission_overrides` — Per-user permission overrides

```sql
Column         | Type      | Null | Default | Description
---------------|-----------|------|---------|------------------------------------
id             | uuid      | No   | PK      | Primary key
user_id        | uuid      | No   | FK      | References users(id)
permission_id  | uuid      | No   | FK      | References permissions(id)
is_granted     | boolean   | No   |         | Override: granted or denied
created_at     | timestamp | No   | NOW()   |
created_by     | uuid      | Yes  |         | Who set this override
```

---

## Module 02 — Branches & Areas

### 2.1 `branches` — Branch offices

```sql
Column         | Type            | Null | Default | Description
---------------|-----------------|------|---------|------------------------------------
id             | uuid            | No   | PK      | Primary key
branch_code    | varchar(20)     | No   |         | Auto-generated (BRN + seq)
branch_name    | varchar(200)    | No   |         | Branch name
branch_type    | branch_type_enum| No   | 'branch'| head_office / branch / sub_branch
parent_branch_id| uuid           | Yes  |         | Parent branch (for hierarchy)
address        | text            | Yes  |         | Full address
city           | varchar(100)    | Yes  |         | City
state          | varchar(100)    | Yes  |         | State
pincode        | varchar(10)     | Yes  |         | PIN code
latitude       | decimal(10,7)   | Yes  |         | GPS latitude
longitude      | decimal(10,7)   | Yes  |         | GPS longitude
phone          | varchar(15)     | Yes  |         | Contact phone
email          | varchar(255)    | Yes  |         | Contact email
branch_manager_id | uuid          | Yes  |         | FK to users(id)
is_active      | boolean         | No   | true    | Active flag
created_at     | timestamp       | No   | NOW()   |
updated_at     | timestamp       | No   | NOW()   |
```

**Enum `branch_type_enum`:** `head_office`, `branch`, `sub_branch`, `service_center`

### 2.2 `areas` — Geographic areas within branches

```sql
Column         | Type            | Null | Default | Description
---------------|-----------------|------|---------|------------------------------------
id             | uuid            | No   | PK      | Primary key
area_code      | varchar(20)     | No   |         | Auto-generated (ARE + seq)
area_name      | varchar(200)    | No   |         | Area name (e.g., "Anna Nagar")
branch_id      | uuid            | No   | FK      | FK to branches(id)
pincode        | varchar(10)     | Yes  |         | Area PIN
city           | varchar(100)    | Yes  |         | City
state          | varchar(100)    | Yes  | 'Tamil Nadu' | State
latitude       | decimal(10,7)   | Yes  |         | Center lat
longitude      | decimal(10,7)   | Yes  |         | Center lng
radius_km      | decimal(5,2)    | Yes  |         | Service radius in km
population     | integer         | Yes  |         | Estimated population
description    | text            | Yes  |         | Area description
is_active      | boolean         | No   | true    | Active flag
created_at     | timestamp       | No   | NOW()   |
updated_at     | timestamp       | No   | NOW()   |
```

### 2.3 `user_areas` — Maps users to areas (for area-based access)

```sql
Column         | Type      | Null | Default | Description
---------------|-----------|------|---------|------------------------------------
id             | uuid      | No   | PK      | Primary key
user_id        | uuid      | No   | FK      | References users(id)
area_id        | uuid      | No   | FK      | References areas(id)
is_primary     | boolean   | No   | false   | Primary area for this user
created_at     | timestamp | No   | NOW()   |
```

**Unique constraint:** `(user_id, area_id)`
**Use case:** Team Leaders manage specific areas; Collection Agents only see their assigned areas; Field Officers verify in their areas.

### 2.4 `approval_limits` — Per-role approval authority limits

```sql
Column         | Type        | Null | Default | Description
---------------|-------------|------|---------|------------------------------------
id             | uuid        | No   | PK      | Primary key
role_id        | uuid        | No   | FK      | References roles(id)
min_amount     | numeric(15,2)| No  | 0       | Minimum loan amount for this role
max_amount     | numeric(15,2)| No  |         | Maximum approval limit
is_active      | boolean     | No   | true    | Active flag
created_at     | timestamp   | No   | NOW()   |
updated_at     | timestamp   | No   | NOW()   |
```

**Sample data:**
```
team_leader:  min=0, max=50,000
branch_admin: min=50,001, max=200,000
super_admin:  min=200,001, max=1,000,000
```

---

## Module 03 — Loan Products

### 3.1 `loan_products` — Product catalog

```sql
Column               | Type           | Null | Default     | Description
---------------------|----------------|------|-------------|------------------------------------
id                   | uuid           | No   | PK          | Primary key
product_code         | varchar(20)    | No   | generate_id('PRD') | Auto code
product_name         | varchar(200)   | No   |             | Display name
product_name_tamil   | varchar(200)   | Yes  |             | Tamil name
category             | product_cat_enum| No  | 'personal'  | personal / business / emergency / group / agriculture
description          | text           | Yes  |             | Product description
min_loan_amount      | numeric(15,2)  | No   | 0           | Minimum loan amount (Rs.)
max_loan_amount      | numeric(15,2)  | No   |             | Maximum loan amount (Rs.)
min_tenure_months    | integer        | No   | 3           | Minimum tenure
max_tenure_months    | integer        | No   | 60          | Maximum tenure
min_interest_rate    | numeric(5,2)   | No   |             | Minimum annual rate %
max_interest_rate    | numeric(5,2)   | No   |             | Maximum annual rate %
interest_type        | int_type_enum  | No   | 'reducing'  | reducing / flat / flat_rate
processing_fee_type  | fee_type_enum  | No   | 'flat'      | flat / percentage
processing_fee_value | numeric(8,2)   | No   | 0           | Flat amount or percentage
processing_fee_cap   | numeric(15,2)  | Yes  |             | Maximum processing fee
document_charge_type | fee_type_enum  | No   | 'flat'      | flat / percentage / none
document_charge_value| numeric(8,2)   | No   | 0           | Document charge amount
insurance_type       | fee_type_enum  | No   | 'none'      | none / flat / percentage
insurance_value      | numeric(8,2)   | No   | 0           | Insurance amount
penalty_rate         | numeric(5,2)   | Yes  |             | Late payment penalty % per month
penalty_type         | fee_type_enum  | Yes  | 'flat'      | flat / percentage
grace_period_days    | integer        | No   | 0           | Days after due date before penalty
prepayment_allowed   | boolean        | No   | false       | Prepayment allowed
prepayment_penalty   | numeric(5,2)   | Yes  |             | Prepayment penalty %
collateral_required | boolean        | No   | false       | Collateral requirement
min_age              | integer        | No   | 21          | Minimum applicant age
max_age              | integer        | No   | 65          | Maximum applicant age at loan end
min_cibil_score      | integer        | Yes  |             | Minimum CIBIL score
max_dti_ratio        | numeric(5,2)   | Yes  |             | Max debt-to-income ratio %
required_documents   | jsonb          | Yes  |             | Array of required document types
eligibility_rules    | jsonb          | Yes  |             | Custom eligibility JSON rules
is_active            | boolean        | No   | true        | Active flag
created_at           | timestamp      | No   | NOW()       |
updated_at           | timestamp      | No   | NOW()       |
created_by           | uuid           | Yes  |             | FK to users(id)
```

**Enums:** `product_cat_enum = ('personal', 'business', 'emergency', 'group', 'agriculture', 'gold', 'vehicle')`, `int_type_enum = ('reducing', 'flat', 'flat_rate')`, `fee_type_enum = ('flat', 'percentage', 'none')`

### 3.2 `product_slabs` — Dynamic interest rate slabs per product

```sql
Column        | Type           | Null | Default | Description
--------------|----------------|------|---------|------------------------------------
id            | uuid           | No   | PK      | Primary key
product_id    | uuid           | No   | FK      | References loan_products(id)
slab_code     | varchar(20)    | No   |         | Auto code (SLB + seq)
slab_name     | varchar(100)   | No   |         | Display name
slab_order    | integer        | No   |         | Display order
min_amount    | numeric(15,2)  | No   |         | Minimum loan amount for this slab
max_amount    | numeric(15,2)  | No   |         | Maximum loan amount
interest_rate | numeric(5,2)   | No   |         | Interest rate % for this slab
processing_fee_override | numeric(8,2) | Yes |    | Override processing fee for slab
is_active     | boolean        | No   | true    | Active flag
created_at    | timestamp      | No   | NOW()   |
```

**Unique constraint:** `(product_id, slab_order)`
**Logic:** When a loan amount falls within a slab's range, that slab's interest rate and processing fee override are used.

---

## Module 04 — Loan Applications

### 4.1 `applications` — Main loan application record

```sql
Column                    | Type           | Null | Default       | Description
--------------------------|----------------|------|---------------|------------------------------------
id                        | uuid           | No   | PK            | Primary key
application_number        | varchar(20)    | No   | generate_id('APP') | Auto code
customer_id               | uuid           | No   | FK            | References users(id)
product_id                | uuid           | No   | FK            | References loan_products(id)
branch_id                 | uuid           | No   | FK            | References branches(id)
area_id                   | uuid           | Yes  | FK            | References areas(id)
created_by                | uuid           | No   | FK            | References users(id) — FO who created
assigned_to               | uuid           | Yes  | FK            | Current reviewer user ID
status                    | app_status_enum| No   | 'draft'       | Current status
application_stage         | varchar(50)    | Yes  |               | Current stage label
loan_amount               | numeric(15,2)  | Yes  |               | Requested amount
tenure_months             | integer        | Yes  |               | Requested tenure
interest_rate             | numeric(5,2)   | Yes  |               | Approved/offered rate
emi_amount                | numeric(12,2)  | Yes  |               | Calculated EMI
total_household_income    | numeric(12,2)  | Yes  |               | Total family income
cibil_score               | integer        | Yes  |               | Applicant CIBIL score
eligibility_score         | integer        | Yes  |               | Auto-calculated score (0-100)
is_preferred_customer     | boolean        | No   | false         | Existing customer flag
referred_by               | uuid           | Yes  | FK            | Existing customer who referred
referral_bonus_applicable | boolean        | No   | false         | Whether referral bonus applies
loan_purpose              | varchar(255)   | Yes  |               | Purpose of loan
submitted_at              | timestamp      | Yes  |               | When submitted for review
approved_at               | timestamp      | Yes  |               | Approval timestamp
approved_by               | uuid           | Yes  | FK            | Approver user ID
rejected_at               | timestamp      | Yes  |               | Rejection timestamp
rejected_by               | uuid           | Yes  | FK            | Rejector user ID
rejection_reason          | text           | Yes  |               | Why rejected
disbursed_at              | timestamp      | Yes  |               | Disbursement timestamp
disbursed_by              | uuid           | Yes  | FK            | Disbursing user ID
query_raised_at           | timestamp      | Yes  |               | Query raised timestamp
query_raised_by           | uuid           | Yes  | FK            | Who raised query
query_text                 | text           | Yes  |               | Query description
query_responded_at        | timestamp      | Yes  |               | Query answered timestamp
query_responded_by        | uuid           | Yes  | FK            | Who answered
review_notes              | jsonb          | Yes  |               | Review notes as JSON
cancelled_at              | timestamp      | Yes  |               | Cancellation timestamp
cancelled_by              | uuid           | Yes  | FK            | Who cancelled
cancellation_reason       | text           | Yes  |               | Cancellation reason
created_at                | timestamp      | No   | NOW()         |
updated_at                | timestamp      | No   | NOW()         |
```

**Enum `app_status_enum`:** `draft`, `submitted`, `in_review`, `query_raised`, `approved`, `rejected`, `disbursed`, `completed`, `cancelled`, `expired`

### 4.2 `application_topics` — Structured application data (16 sub-topics)

Each application has 16 topics representing the complete application form:

```sql
Column        | Type      | Null | Default | Description
--------------|-----------|------|---------|------------------------------------
id            | uuid      | No   | PK      | Primary key
application_id| uuid      | No   | FK      | References applications(id)
topic_code    | varchar(50)| No  |         | topic_code (see below)
topic_name    | varchar(100)| No |         | Human-readable name
topic_order   | integer   | No   |         | Display order (1-16)
topic_data    | jsonb     | Yes  | {}      | All form data for this topic
is_completed  | boolean   | No   | false   | Completion flag
completion_pct| integer   | No   | 0       | Percentage complete
completed_at  | timestamp | Yes  |         | Completion timestamp
completed_by  | uuid      | Yes  | FK      | Who completed it
created_at    | timestamp | No   | NOW()   |
updated_at    | timestamp | No   | NOW()   |
```

**Unique constraint:** `(application_id, topic_code)`

**16 Topic Codes (in order):**

| Order | Code | Topic Name | Data Fields (examples) |
|-------|------|------------|----------------------|
| 1 | `applicant_details` | Applicant Details | first_name, last_name, dob, gender, marital_status, father_name, spouse_name, email, phone, customer_id |
| 2 | `basic_details` | Basic Details | religion, caste, category, nationality, education, no_of_family_members, no_of_dependents |
| 3 | `kyc_details` | KYC Details | aadhaar_number, pan_number, voter_id, ration_card, photos (front/side) |
| 4 | `work_details` | Work Details | employment_type, employer_name, designation, years_in_job, monthly_salary, office_address |
| 5 | `banking_details` | Banking Details | bank_name, account_number, ifsc, account_type, nominee_name, bank_statement_months |
| 6 | `ratio_analysis` | Ratio Analysis | debt_to_income, loan_to_value, savings_ratio, debt_burden_ratio, calculated_by_system |
| 7 | `obligations` | Obligations | existing_loans (array), credit_card_outstanding, other_obligations, total_monthly_obligations |
| 8 | `income_details` | Income Details | primary_income, secondary_income, spouse_income, other_income, total_income, income_proof_type |
| 9 | `customer_wealth` | Customer Wealth | movable_assets_value, immovable_assets_value, investments_value, total_wealth, gold_weight |
| 10 | `product_details` | Product Details | product_id, loan_amount_requested, tenure_months, purpose_of_loan, purpose_description |
| 11 | `property_details` | Property Details | property_type, property_address, property_value, is_self_owned, property_docs |
| 12 | `eligibility` | Eligibility Calculation | eligibility_score, is_eligible, eligible_amount, eligible_tenure, calculated_emi, calculation_notes |
| 13 | `documents` | Documents | uploaded_docs (array of {doc_type, file_url, verified}), doc_checklist_completed |
| 14 | `verification_checks` | Verification Checks | address_verified, income_verified, documents_verified, residence_type, verification_agency |
| 15 | `notes` | Notes | internal_notes, external_notes, review_comments |
| 16 | `query` | Query | query_raised, query_text, query_response, query_resolved |

### 4.3 `application_stages` — Workflow stage tracking per application

```sql
Column       | Type      | Null | Default | Description
-------------|-----------|------|---------|------------------------------------
id           | uuid      | No   | PK      | Primary key
application_id| uuid     | No   | FK      | References applications(id)
stage_id     | uuid      | No   | FK      | References stages(id)
assigned_to  | uuid      | Yes  | FK      | Assigned user ID
status       | varchar(20)| No  | 'pending' | pending / in_progress / completed / skipped
notes        | text      | Yes  |         | Stage notes
started_at   | timestamp | Yes  |         | When started
completed_at | timestamp | Yes  |         | When completed
created_at   | timestamp | No   | NOW()   |
```

**Stages enum (seeded):** `new_application`, `document_verification`, `field_verification`, `credit_assessment`, `committee_review`, `approval`, `disbursement`

### 4.4 `application_notes` — Notes and comments on applications

```sql
Column       | Type      | Null | Default | Description
-------------|-----------|------|---------|------------------------------------
id           | uuid      | No   | PK      | Primary key
application_id| uuid     | No   | FK      | References applications(id)
note_type    | note_type_enum | No | 'general' | general / review / query / rejection / approval
note_text    | text      | No   |         | Note content
is_internal  | boolean   | No   | false   | Internal-only (not visible to customer)
is_resolved  | boolean   | No   | false   | Query resolved flag
added_by     | uuid      | No   | FK      | References users(id)
created_at   | timestamp | No   | NOW()   |
updated_at   | timestamp | No   | NOW()   |
```

### 4.5 `application_documents` — Uploaded documents for applications

```sql
Column          | Type          | Null | Default | Description
----------------|---------------|------|---------|------------------------------------
id              | uuid          | No   | PK      | Primary key
application_id  | uuid          | No   | FK      | References applications(id)
topic_id        | uuid          | Yes  | FK      | References application_topics(id)
doc_type        | doc_type_enum | No   |         | Document type
doc_name        | varchar(255)  | No   |         | Document name
file_url        | varchar(500)  | No   |         | Storage URL (Supabase Storage)
file_size_kb    | integer       | Yes  |         | File size in KB
file_format     | varchar(10)   | Yes  |         | pdf / jpg / png
is_verified     | boolean       | No   | false   | Verification status
verified_by     | uuid          | Yes  | FK      | Verified by user
verified_at     | timestamp     | Yes  |         | Verification timestamp
verification_notes| text        | Yes  |         | Verification comments
version         | integer       | No   | 1       | Version number
created_at      | timestamp     | No   | NOW()   |
```

### 4.6 `stage_transitions` — Audit trail of stage changes

```sql
Column          | Type      | Null | Default | Description
----------------|-----------|------|---------|------------------------------------
id              | uuid      | No   | PK      | Primary key
application_id  | uuid      | No   | FK      | References applications(id)
from_stage_id   | uuid      | Yes  | FK      | References stages(id)
to_stage_id     | uuid      | No   | FK      | References stages(id)
action          | varchar(20)| No   |         | approve / reject / forward / return / complete
performed_by    | uuid      | No   | FK      | References users(id)
remarks         | text      | Yes  |         | Transition remarks
ip_address      | varchar(45)| Yes  |         | IP of performer
transitioned_at | timestamp | No   | NOW()   |
```

---

## Module 05 — Loans & EMI

### 5.1 `loans` — Active/closed loan accounts

```sql
Column                    | Type           | Null | Default       | Description
--------------------------|----------------|------|---------------|------------------------------------
id                        | uuid           | No   | PK            | Primary key
loan_number               | varchar(20)    | No   | generate_id('LON') | Auto code
application_id            | uuid           | No   | FK            | References applications(id)
customer_id               | uuid           | No   | FK            | References users(id)
product_id                | uuid           | No   | FK            | References loan_products(id)
branch_id                 | uuid           | No   | FK            | References branches(id)
area_id                   | uuid           | Yes  | FK            | References areas(id)
group_loan_id             | uuid           | Yes  | FK            | For group loans — references groups(id)
created_by                | uuid           | No   | FK            | References users(id)
loan_amount               | numeric(15,2)  | No   |               | Sanctioned amount
approved_amount           | numeric(15,2)  | No   |               | Approved amount
tenure_months             | integer        | No   |               | Loan tenure in months
interest_rate             | numeric(5,2)   | No   |               | Annual interest rate %
interest_type             | int_type_enum  | No   | 'reducing'    | Reducing balance / flat
slab_id                   | uuid           | Yes  | FK            | References product_slabs(id)
applied_slab_rate         | numeric(5,2)   | Yes  |               | Rate at time of sanction
emi_amount                | numeric(12,2)  | No   |               | Calculated EMI
total_interest            | numeric(15,2)  | No   |               | Total interest over tenure
total_payable             | numeric(15,2)  | No   |               | Principal + interest
total_charges             | numeric(15,2)  | No   | 0             | Processing + document charges
processing_fee            | numeric(12,2)  | No   | 0             | Processing fee
document_charge           | numeric(12,2)  | No   | 0             | Document charge
insurance_amount          | numeric(12,2)  | No   | 0             | Insurance premium
principal_paid            | numeric(15,2)  | No   | 0             | Cumulative principal repaid
interest_paid             | numeric(15,2)  | No   | 0             | Cumulative interest paid
penalty_collected         | numeric(15,2)  | No   | 0             | Cumulative penalties
outstanding_principal     | numeric(15,2)  | No   |               | loan_amount - principal_paid
outstanding_interest      | numeric(15,2)  | No   |               | total_interest - interest_paid
emi_paid_count            | integer        | No   | 0             | Number of EMIs paid
total_emis                | integer        | No   |               | Total EMIs in schedule
first_emi_date            | date           | No   |               | First EMI due date
last_emi_date             | date           | Yes  |               | Last EMI due date
next_emi_date             | date           | Yes  |               | Next EMI due date
status                    | loan_status_enum| No | 'disbursed'  | disbursed / active / closed / foreclosed / npa / written_off
disbursement_date         | date           | Yes  |               | Actual disbursement date
foreclosure_date          | date           | Yes  |               | Foreclosure date
closure_date              | date           | Yes  |               | Loan closure date
is_topup_eligible         | boolean        | No   | false         | Eligible for top-up loan
topup_count               | integer        | No   | 0             | Number of top-ups done
is_npa                    | boolean        | No   | false         | NPA flag
npa_since                 | date           | Yes  |               | NPA classification date
write_off_amount          | numeric(15,2)  | Yes  |               | Write-off amount
write_off_date            | date           | Yes  |               | Write-off date
recovery_amount           | numeric(15,2)  | Yes  | 0             | Amount recovered after NPA
created_at                | timestamp      | No   | NOW()         |
updated_at                | timestamp      | No   | NOW()         |
```

**Enum `loan_status_enum`:** `draft`, `sanctioned`, `disbursed`, `active`, `closed`, `foreclosed`, `npa`, `written_off`, `settled`

### 5.2 `emi_schedules` — EMI schedule per loan

```sql
Column             | Type           | Null | Default | Description
-------------------|----------------|------|---------|------------------------------------
id                 | uuid           | No   | PK      | Primary key
loan_id            | uuid           | No   | FK      | References loans(id)
emi_number         | integer        | No   |         | EMI sequence (1 to total_emis)
due_date           | date           | No   |         | Due date for this EMI
emi_amount         | numeric(12,2)  | No   |         | EMI amount (principal + interest)
principal          | numeric(12,2)  | No   |         | Principal component
interest           | numeric(12,2)  | No   |         | Interest component
penalty_component  | numeric(12,2)  | No   | 0       | Penalty for this EMI
total_due          | numeric(12,2)  | No   |         | emi_amount + penalty_component
opening_balance    | numeric(15,2)  | No   |         | Balance before this EMI
closing_balance    | numeric(15,2)  | No   |         | Balance after this EMI
is_paid            | boolean        | No   | false   | Payment status
paid_amount        | numeric(12,2)  | Yes  |         | Actual amount received
paid_on            | date           | Yes  |         | Payment date
is_overdue         | boolean        | No   | false   | Overdue flag
days_overdue       | integer        | No   | 0       | Days past due date
penalty_calculated | boolean        | No   | false   | Whether penalty was calculated
created_at         | timestamp      | No   | NOW()   |
updated_at         | timestamp      | No   | NOW()   |
```

**Unique constraint:** `(loan_id, emi_number)`
**Indexes:** `idx_emi_due_date` on due_date, `idx_emi_loan_status` on (loan_id, is_paid, due_date)

---

## Module 06 — Disbursement & Charges

### 6.1 `disbursements` — Disbursement records

```sql
Column                    | Type           | Null | Default       | Description
--------------------------|----------------|------|---------------|------------------------------------
id                        | uuid           | No   | PK            | Primary key
disbursement_number       | varchar(20)    | No   | generate_id('DSB') | Auto code
loan_id                   | uuid           | No   | FK            | References loans(id)
application_id            | uuid           | No   | FK            | References applications(id)
customer_id               | uuid           | No   | FK            | References users(id)
product_id                | uuid           | No   | FK            | References loan_products(id)
branch_id                 | uuid           | No   | FK            | References branches(id)
bank_account_id           | uuid           | No   | FK            | References bank_accounts(id)
loan_amount               | numeric(15,2)  | No   |               | Gross loan amount
processing_fee            | numeric(12,2)  | No   | 0             | Processing fee charged
document_charge           | numeric(12,2)  | No   | 0             | Document charge
insurance_amount          | numeric(12,2)  | No   | 0             | Insurance premium
other_charges             | numeric(12,2)  | No   | 0             | Any other charges
total_charges             | numeric(15,2)  | No   | 0             | Sum of all charges
net_disbursement_amount   | numeric(15,2)  | No   |               | loan_amount - total_charges
disbursement_mode         | disb_mode_enum | No   | 'bank_transfer' | bank_transfer / cash / upi / neft / rtgs
utr_number                | varchar(50)    | Yes  |               | UTR / transaction reference
utr_image_url             | varchar(500)   | Yes  |               | UTR screenshot
disbursement_date         | date           | No   |               | Scheduled/actual date
actual_disbursement_date  | date           | Yes  |               | Actual date when completed
status                    | disb_status_enum| No | 'pending'    | pending / approved / processing / completed / failed / reversed
approved_by               | uuid           | Yes  | FK            | References users(id)
approved_at               | timestamp      | Yes  |               | Approval timestamp
processed_by              | uuid           | Yes  | FK            | References users(id)
processed_at              | timestamp      | Yes  |               | Processing timestamp
narration                 | text           | Yes  |               | Additional notes
is_reversed               | boolean        | No   | false         | Reversal flag
reversed_by               | uuid           | Yes  | FK            | Who reversed
reversed_at               | timestamp      | Yes  |               | Reversal timestamp
reversal_reason           | text           | Yes  |               | Why reversed
created_at                | timestamp      | No   | NOW()         |
updated_at                | timestamp      | No   | NOW()         |
created_by                | uuid           | No   | FK            | References users(id)
```

**Enums:** `disb_mode_enum = ('bank_transfer', 'cash', 'upi', 'neft', 'rtgs', 'imps')`, `disb_status_enum = ('pending', 'approved', 'processing', 'completed', 'failed', 'reversed', 'cancelled')`

### 6.2 `disbursement_charges` — Individual charges per disbursement

```sql
Column           | Type           | Null | Default | Description
-----------------|----------------|------|---------|------------------------------------
id               | uuid           | No   | PK      | Primary key
charge_number    | varchar(20)    | No   | generate_id('CHG') | Auto code
disbursement_id  | uuid           | No   | FK      | References disbursements(id)
charge_type      | charge_type_enum| No  |         | processing_fee / document_charge / insurance / gst / other
charge_head      | varchar(100)   | No   |         | Charge name
calculation_type | fee_type_enum  | No   |         | flat / percentage / slab_based
base_amount      | numeric(15,2)  | Yes  |         | Base amount for percentage calc
rate_pct         | numeric(8,2)   | Yes  |         | Percentage rate
flat_amount      | numeric(12,2)  | Yes  |         | Flat amount
slab_id          | uuid           | Yes  | FK      | References product_slabs(id)
charge_amount    | numeric(12,2)  | No   |         | Calculated charge amount
gst_rate         | numeric(5,2)   | Yes  |         | GST applicable %
gst_amount       | numeric(12,2)  | Yes  | 0       | Calculated GST
total_amount     | numeric(12,2)  | No   |         | charge_amount + gst_amount
cgst_amount      | numeric(12,2)  | Yes  |         | CGST portion
sgst_amount      | numeric(12,2)  | Yes  |         | SGST portion
igst_amount      | numeric(12,2)  | Yes  |         | IGST portion
is_waived        | boolean        | No   | false   | Waiver flag
waived_by        | uuid           | Yes  | FK      | Who waived
waived_at        | timestamp      | Yes  |         | Waiver timestamp
waiver_reason    | text           | Yes  |         | Waiver justification
ledger_account_id| uuid           | Yes  | FK      | FK to ledger_accounts(id) for accounting
created_at       | timestamp      | No   | NOW()   |
```

**Enum `charge_type_enum`:** `processing_fee`, `document_charge`, `insurance`, `gst`, `other`, `discount`, `waiver`

---

## Module 07 — EMI Payments & Penalties

### 7.1 `emi_payments` — Payment records for each EMI

```sql
Column             | Type           | Null | Default       | Description
-------------------|----------------|------|---------------|------------------------------------
id                 | uuid           | No   | PK            | Primary key
payment_number     | varchar(20)    | No   | generate_id('PAY') | Auto code
loan_id            | uuid           | No   | FK            | References loans(id)
emi_schedule_id    | uuid           | No   | FK            | References emi_schedules(id)
customer_id        | uuid           | No   | FK            | References users(id)
payment_amount     | numeric(12,2)  | No   |               | Total amount paid
principal_component| numeric(12,2)  | No   |               | Principal portion
interest_component | numeric(12,2)  | No   |               | Interest portion
penalty_component  | numeric(12,2)  | No   | 0             | Penalty portion
payment_method     | pay_method_enum| No   | 'cash'        | cash / bank_transfer / upi / card / cheque
bank_account_id    | uuid           | Yes  | FK            | FK to bank_accounts(id)
transaction_ref    | varchar(100)   | Yes  |               | Transaction / receipt number
cheque_number      | varchar(50)    | Yes  |               | Cheque number (if applicable)
cheque_date        | date           | Yes  |               | Cheque date
payment_date       | date           | No   |               | Actual payment date
collected_by       | uuid           | No   | FK            | References users(id) — collection agent
received_by        | uuid           | Yes  | FK            | References users(id) — field officer (if applicable)
location_lat       | decimal(10,7)  | Yes  |               | Collection location GPS
location_lng       | decimal(10,7)  | Yes  |               |
location_address   | text           | Yes  |               | Collection address (auto-filled)
payment_notes      | text           | Yes  |               | Additional notes
ledger_entry_id    | uuid           | Yes  | FK            | FK to ledger_entries(id)
created_at         | timestamp      | No   | NOW()         |
```

**Enum `pay_method_enum`:** `cash`, `bank_transfer`, `upi`, `card`, `cheque`, `demand_draft`, `neft`, `rtgs`

### 7.2 `payment_receipts` — Generated payment receipts

```sql
Column          | Type           | Null | Default       | Description
----------------|----------------|------|---------------|------------------------------------
id              | uuid           | No   | PK            | Primary key
receipt_number  | varchar(20)    | No   | generate_id('RCP') | Auto code
emi_payment_id  | uuid           | No   | FK            | References emi_payments(id)
loan_id         | uuid           | No   | FK            | References loans(id)
customer_id     | uuid           | No   | FK            | References users(id)
receipt_amount  | numeric(12,2)  | No   |               | Amount received
receipt_date    | date           | No   |               | Date of receipt
receipt_type    | receipt_type_enum | No | 'emi'        | emi / penalty / partial / settlement
principal_amount| numeric(12,2)  | Yes  |               | Principal in this receipt
interest_amount | numeric(12,2)  | Yes  |               | Interest in this receipt
penalty_amount  | numeric(12,2)  | Yes  |               | Penalty in this receipt
pdf_url         | varchar(500)   | Yes  |               | PDF receipt download URL
sent_via_email  | boolean        | No   | false         | Email sent flag
sent_via_sms    | boolean        | No   | false         | SMS sent flag
generated_by    | uuid           | Yes  | FK            | Who generated receipt
created_at      | timestamp      | No   | NOW()         |
```

**Enum `receipt_type_enum`:** `emi`, `penalty`, `partial`, `settlement`, `foreclosure`, `disbursement`

### 7.3 `penalties` — Penalty/late fee records

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
penalty_number | varchar(20)    | No   | generate_id('PEN') | Auto code
loan_id        | uuid           | No   | FK      | References loans(id)
emi_schedule_id| uuid           | Yes  | FK      | References emi_schedules(id)
customer_id    | uuid           | No   | FK      | References users(id)
penalty_type   | penalty_type_enum | No |       | late_payment / partial_payment / foreclosure / dishonour
penalty_amount | numeric(12,2)  | No   |         | Penalty amount calculated
final_amount   | numeric(12,2)  | No   |         | Amount to be paid (after waiver)
is_paid        | boolean        | No   | false   | Paid flag
paid_amount    | numeric(12,2)  | Yes  |         | Actual amount paid
paid_on        | date           | Yes  |         | Payment date
is_waived      | boolean        | No   | false   | Waiver flag
waived_by      | uuid           | Yes  | FK      | Who waived
waived_at      | timestamp      | Yes  |         | Waiver timestamp
waiver_reason  | text           | Yes  |         | Waiver justification
penalty_date   | date           | No   |         | Penalty application date
due_date       | date           | No   |         | Due date for penalty payment
calculated_by  | varchar(20)    | No   | 'system'| system / manual
created_at     | timestamp      | No   | NOW()   |
```

**Enum `penalty_type_enum`:** `late_payment`, `partial_payment`, `foreclosure`, `dishonour`, `overdue_interest`

---

## Module 08 — Ledger & Accounting

### 8.1 `ledger_accounts` — Chart of accounts

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
account_code   | varchar(20)    | No   |         | Unique account code (LAC + seq)
account_name   | varchar(200)   | No   |         | Account name
account_group  | account_group_enum | No |       | assets / liabilities / income / expenses / equity
account_type   | account_type_enum | No |       | direct / indirect
parent_id      | uuid           | Yes  | FK      | FK to ledger_accounts(id) for hierarchy
opening_balance| numeric(15,2)  | No   | 0       | Opening balance
current_balance| numeric(15,2)  | No   | 0       | Running balance
debit_balance  | numeric(15,2)  | No   | 0       | Cumulative debits
credit_balance | numeric(15,2)  | No   | 0       | Cumulative credits
is_active      | boolean        | No   | true    | Active flag
created_at     | timestamp      | No   | NOW()   |
updated_at     | timestamp      | No   | NOW()   |
```

**Enum `account_group_enum`:** `assets`, `liabilities`, `equity`, `income`, `expenses`
**Enum `account_type_enum`:** `direct`, `indirect`

**Pre-seeded accounts (12):**
```
LAC1000001 — Cash (assets/direct)
LAC1000002 — Bank — SBI (assets/direct)
LAC1000003 — Bank — HDFC (assets/direct)
LAC1000004 — Loans Disbursed (assets/direct)
LAC1000005 — Interest Receivable (assets/direct)
LAC1000006 — Salary Expenses (expenses/indirect)
LAC1000007 — Rent Expenses (expenses/indirect)
LAC1000008 — Processing Fee Income (income/direct)
LAC1000009 — Interest Income (income/direct)
LAC1000010 — Document Charges Income (income/direct)
LAC1000011 — Penalty Income (income/direct)
LAC1000012 — EMI Collections (assets/direct)
```

### 8.2 `ledger_entries` — Double-entry transaction headers

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
entry_number   | varchar(20)    | No   | generate_id('LDG') | Auto code
entry_date     | date           | No   |         | Transaction date
description    | varchar(255)   | No   |         | Entry description
reference_type | ref_type_enum | Yes  |         | loan / application / disbursement / emi_payment / manual
reference_id   | uuid           | Yes  |         | FK to reference entity
bank_account_id| uuid           | Yes  | FK      | FK to bank_accounts(id)
narration      | text           | Yes  |         | Detailed narration
total_debit    | numeric(15,2)  | No   |         | Total debit amount
total_credit   | numeric(15,2)  | No   |         | Total credit amount
is_posted      | boolean        | No   | false   | Posted to accounts flag
posted_at      | timestamp      | Yes  |         | Posting timestamp
created_by     | uuid           | Yes  | FK      | Creator user ID
created_at     | timestamp      | No   | NOW()   |
```

**Enum `ref_type_enum`:** `loan`, `application`, `disbursement`, `emi_payment`, `penalty`, `bank_transfer`, `manual`, `journal`

### 8.3 `ledger_entry_lines` — Double-entry line items

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
ledger_entry_id| uuid           | No   | FK      | References ledger_entries(id)
account_id     | uuid           | No   | FK      | References ledger_accounts(id)
narration      | varchar(255)   | Yes  |         | Line narration
debit_amount   | numeric(15,2)  | No   | 0       | Debit amount
credit_amount  | numeric(15,2)  | No   | 0       | Credit amount
line_order     | integer        | No   |         | Line sequence
created_at     | timestamp      | No   | NOW()   |
```

**Constraint:** Each entry must have at least 2 lines; debit total must equal credit total; debit + credit per line cannot both be non-zero.

### 8.4 `ledger_account_balances` — Running balances for reporting

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
account_id     | uuid           | No   | FK      | References ledger_accounts(id)
balance_date   | date           | No   |         | Balance date
opening_balance| numeric(15,2)  | No   |         | Opening for the day
period_debit   | numeric(15,2)  | No   | 0       | Debits for period
period_credit  | numeric(15,2)  | No   | 0       | Credits for period
closing_balance| numeric(15,2)  | No   |         | Closing balance
created_at     | timestamp      | No   | NOW()   |
```

---

## Module 09 — Bank Accounts & Statements

### 9.1 `bank_accounts` — Company bank accounts

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
account_code   | varchar(20)    | No   |         | Auto code (BNK + seq)
bank_name      | varchar(200)   | No   |         | Bank name
branch_name    | varchar(200)   | Yes  |         | Bank branch
account_number | varchar(30)    | No   |         | Account number (masked in responses)
account_name   | varchar(200)   | No   |         | Account holder name
account_type   | account_type_enum | No |        | current / savings / overdraft
ifsc_code      | varchar(11)    | Yes  |         | IFSC code
micr_code      | varchar(9)     | Yes  |         | MICR code
branch_id      | uuid           | Yes  | FK      | References branches(id)
ledger_account_id| uuid          | Yes  | FK      | FK to ledger_accounts(id)
opening_balance| numeric(15,2)  | No   | 0       | Opening balance
current_balance| numeric(15,2)  | No   | 0       | Current balance
is_primary     | boolean        | No   | false   | Primary account flag
is_active      | boolean        | No   | true    | Active flag
created_at     | timestamp      | No   | NOW()   |
updated_at     | timestamp      | No   | NOW()   |
```

### 9.2 `bank_statement_entries` — Bank statement line items

```sql
Column            | Type           | Null | Default | Description
------------------|----------------|------|---------|------------------------------------
id                | uuid           | No   | PK      | Primary key
bank_account_id   | uuid           | No   | FK      | References bank_accounts(id)
entry_date        | date           | No   |         | Transaction date
description       | varchar(500)   | No   |         | Transaction description
transaction_ref   | varchar(100)   | Yes  |         | Bank's transaction reference
debit_amount      | numeric(15,2)  | No   | 0       | Money out
credit_amount     | numeric(15,2)  | No   | 0       | Money in
balance           | numeric(15,2)  | No   |         | Balance after this entry
entry_type        | stmt_entry_type| No   | 'manual'| manual / auto_import / bank_feed
ledger_entry_id   | uuid           | Yes  | FK      | FK to ledger_entries(id)
is_reconciled     | boolean        | No   | false   | Reconciliation flag
reconciled_at     | timestamp      | Yes  |         | Reconciliation timestamp
reconciled_by     | uuid           | Yes  | FK      | Who reconciled
created_at        | timestamp      | No   | NOW()   |
```

**Enum `stmt_entry_type`:** `manual`, `auto_import`, `bank_feed`, `reconciliation`

### 9.3 `bank_reconciliations` — Reconciliation batches

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
reconciliation_number | varchar(20) | No | generate_id('REC') | Auto code
bank_account_id| uuid           | No   | FK      | References bank_accounts(id)
from_date      | date           | No   |         | Period start
to_date        | date           | No   |         | Period end
book_balance   | numeric(15,2)  | No   |         | Ledger balance
bank_balance   | numeric(15,2)  | No   |         | Bank statement balance
difference     | numeric(15,2)  | No   |         | Difference
is_reconciled  | boolean        | No   | false   | Fully reconciled flag
reconciled_by  | uuid           | Yes  | FK      | Who reconciled
reconciled_at  | timestamp      | Yes  |         | When reconciled
notes          | text           | Yes  |         | Reconciliation notes
created_at     | timestamp      | No   | NOW()   |
```

---

## Module 10 — Verification & Tasks

### 10.1 `verification_tasks` — Task assignments for field work

```sql
Column          | Type            | Null | Default | Description
----------------|-----------------|------|---------|------------------------------------
id              | uuid            | No   | PK      | Primary key
task_number     | varchar(20)     | No   | generate_id('TSK') | Auto code
application_id  | uuid            | Yes  | FK      | References applications(id)
loan_id         | uuid            | Yes  | FK      | References loans(id)
task_type       | task_type_enum  | No   |         | field_verification / document_verification / collection / recovery
assigned_to     | uuid            | No   | FK      | References users(id) — field officer/agent
assigned_by     | uuid            | No   | FK      | References users(id) — who assigned
priority        | priority_enum   | No   | 'medium' | low / medium / high / urgent
status          | task_status_enum| No   | 'assigned' | assigned / in_progress / completed / cancelled / overdue
scheduled_date  | date            | Yes  |         | When task is scheduled
scheduled_time  | time            | Yes  |         | Scheduled time
started_at      | timestamp       | Yes  |         | When task started
completed_at    | timestamp       | Yes  |         | When task completed
overdue_at      | timestamp       | Yes  |         | When marked overdue
verification_data | jsonb         | Yes  | {}      | Field verification form data
verification_notes | text          | Yes  |         | Notes from verification
location_lat    | decimal(10,7)   | Yes  |         | GPS latitude at completion
location_lng    | decimal(10,7)   | Yes  |         | GPS longitude at completion
location_address| text            | Yes  |         | Auto-filled address
osm_verified    | boolean         | No   | false   | OpenStreetMap location verified
osm_distance_km | decimal(6,2)    | Yes  |         | Distance from expected location
selfie_url      | varchar(500)    | Yes  |         | Verification selfie
doc_upload_urls | jsonb           | Yes  |         | Photos uploaded during visit
cancelled_by    | uuid            | Yes  | FK      | Who cancelled
cancelled_at    | timestamp       | Yes  |         | When cancelled
cancellation_reason | text         | Yes  |         | Why cancelled
created_at      | timestamp       | No   | NOW()   |
updated_at      | timestamp       | No   | NOW()   |
```

**Enums:** `task_type_enum = ('field_verification', 'document_verification', 'collection', 'recovery', 'legal', 'asset_valuation')`, `priority_enum = ('low', 'medium', 'high', 'urgent')`, `task_status_enum = ('assigned', 'in_progress', 'completed', 'cancelled', 'overdue')`

### 10.2 `verifications` — Detailed verification records

```sql
Column          | Type           | Null | Default | Description
----------------|----------------|------|---------|------------------------------------
id              | uuid           | No   | PK      | Primary key
verification_number | varchar(20) | No | generate_id('VER') | Auto code
task_id         | uuid           | Yes  | FK      | References verification_tasks(id)
application_id  | uuid           | Yes  | FK      | References applications(id)
loan_id         | uuid           | Yes  | FK      | References loans(id)
customer_id     | uuid           | No   | FK      | References users(id)
verification_type | ver_type_enum | No |         | residence / office / reference / document / post_disbursement
verification_status | ver_status_enum | No | 'pending' | pending / in_progress / verified / rejected
address_found   | boolean        | Yes  |         | Address verified
person_met      | varchar(200)   | Yes  |         | Name of person met
relation        | varchar(100)   | Yes  |         | Relation to borrower
duration_at_address | varchar(50) | Yes  |       | How long at this address
residence_type  | residence_enum | Yes  |         | owned / rented / family
family_verified | boolean        | Yes  |         | Family info confirmed
income_verified | boolean        | Yes  |         | Income confirmed
documents_verified | boolean     | Yes  |         | Documents seen
neighbors_verified | boolean     | Yes  |         | Neighbor inquiry done
recommendation  | text           | Yes  |         | Verification recommendation
overall_rating  | integer        | Yes  |         | 1-5 rating
remarks         | text           | Yes  |         | Detailed remarks
completed_by    | uuid           | Yes  | FK      | References users(id)
completed_at    | timestamp      | Yes  |         | Completion timestamp
verified_at     | timestamp      | Yes  |         | Verification timestamp
created_at      | timestamp      | No   | NOW()   |
```

**Enums:** `ver_type_enum = ('residence', 'office', 'reference', 'document', 'post_disbursement', 'pre_closure')`, `ver_status_enum = ('pending', 'in_progress', 'verified', 'rejected', 'partially_verified')`, `residence_enum = ('owned', 'rented', 'family', 'company_provided', 'other')`

---

## Module 11 — Communications (SMS & Email)

### 11.1 `sms_templates` — SMS message templates

```sql
Column           | Type           | Null | Default | Description
-----------------|----------------|------|---------|------------------------------------
id               | uuid           | No   | PK      | Primary key
template_code    | varchar(50)    | No   |         | Unique code (unique)
template_name    | varchar(100)   | No   |         | Template name
category         | sms_cat_enum   | No   |         | Template category
template_text    | text           | No   |         | Message text with {placeholders}
placeholders     | jsonb          | Yes  |         | Array of {name, example} placeholders
language         | varchar(10)    | No   | 'en'    | en / ta (Tamil)
is_active        | boolean        | No   | true    | Active flag
created_at       | timestamp      | No   | NOW()   |
updated_at       | timestamp      | No   | NOW()   |
created_by       | uuid           | Yes  | FK      | References users(id)
```

**Seeded templates (8):**
| Code | Name | Category | Purpose |
|------|------|----------|---------|
| `APP_WELCOME` | Welcome SMS | onboarding | New customer welcome |
| `APP_RECEIVED` | Application Received | application | Application submitted confirmation |
| `APP_APPROVED` | Application Approved | application | Approval notification |
| `APP_REJECTED` | Application Rejected | application | Rejection notification |
| `APP_QUERY` | Application Query | application | Query raised notification |
| `EMI_DUE` | EMI Due Reminder | emi | 3-day pre-due reminder |
| `EMI_OVERDUE` | EMI Overdue | emi | Overdue notification |
| `EMI_RECEIPT` | EMI Payment Receipt | emi | Payment confirmation |

### 11.2 `sms_logs` — SMS send log

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
sms_number     | varchar(20)    | No   | generate_id('SMS') | Auto code
recipient_phone| varchar(15)    | No   |         | Phone number
recipient_name | varchar(100)   | Yes  |         | Recipient name
template_id    | uuid           | Yes  | FK      | References sms_templates(id)
message_text   | text           | No   |         | Actual message sent
message_length | integer        | No   |         | Character count
sms_count      | integer        | No   | 1       | Number of SMS credits used
status         | sms_status_enum| No   | 'pending' | pending / sent / delivered / failed / bounced
twilio_sid     | varchar(100)   | Yes  |         | Twilio message SID
error_message  | text           | Yes  |         | Error if failed
sent_at        | timestamp      | Yes  |         | When sent
delivered_at   | timestamp      | Yes  |         | Delivery confirmation
created_at     | timestamp      | No   | NOW()   |
```

### 11.3 `email_templates` — Email HTML templates

```sql
Column           | Type           | Null | Default | Description
-----------------|----------------|------|---------|------------------------------------
id               | uuid           | No   | PK      | Primary key
template_code    | varchar(50)    | No   |         | Unique code
template_name    | varchar(100)   | No   |         | Template name
category         | email_cat_enum | No   |         | Template category
subject          | varchar(255)   | No   |         | Email subject with placeholders
body_html        | text           | Yes  |         | Full HTML body
body_text        | text           | Yes  |         | Plain text fallback
placeholders     | jsonb          | Yes  |         | Available variables
is_active        | boolean        | No   | true    | Active flag
created_at       | timestamp      | No   | NOW()   |
updated_at       | timestamp      | No   | NOW()   |
created_by       | uuid           | Yes  | FK      | References users(id)
```

**Seeded templates (8):** Welcome Email, Application Received, Application Approved, Application Rejected, EMI Due Reminder, EMI Payment Receipt, Penalty Notification, Loan Disbursement Confirmation.

### 11.4 `email_logs` — Email send log

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
email_number   | varchar(20)    | No   | generate_id('EML') | Auto code
recipient_email| varchar(255)   | No   |         | To address
recipient_name | varchar(100)   | Yes  |         | Recipient name
cc_emails      | jsonb          | Yes  |         | CC recipients array
template_id    | uuid           | Yes  | FK      | References email_templates(id)
subject        | varchar(255)   | No   |         | Email subject
body_html      | text           | Yes  |         | HTML body sent
body_text      | text           | Yes  |         | Text body sent
attachments    | jsonb          | Yes  |         | Array of attachment URLs
status         | email_status_enum | No | 'pending' | pending / sent / delivered / bounced / failed / opened
mailer_sid     | varchar(100)   | Yes  |         | Mailer message ID
open_count     | integer        | No   | 0       | Times opened
last_opened_at | timestamp      | Yes  |         | Last open timestamp
click_count    | integer        | No   | 0       | Link click count
error_message  | text           | Yes  |         | Error if failed
sent_at        | timestamp      | Yes  |         | When sent
delivered_at   | timestamp      | Yes  |         | Delivery time
created_at     | timestamp      | No   | NOW()   |
```

---

## Module 12 — Dashboard & Reports

### 12.1 `reports` — Saved reports configuration

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
report_code    | varchar(20)    | No   |         | Auto code
report_name    | varchar(200)   | No   |         | Report name
report_type    | report_type_enum | No |        | dashboard / application / loan / collection / ledger / npa
category       | varchar(50)    | Yes  |         | Subcategory
report_query   | jsonb          | No   |         | Query params saved as JSON
filters        | jsonb          | Yes  |         | Default filters
chart_config   | jsonb          | Yes  |         | Chart type, axis, series
is_scheduled   | boolean        | No   | false   | Scheduled report flag
schedule_cron  | varchar(50)    | Yes  |         | Cron expression
schedule_recipients | jsonb      | Yes  |         | Emails to send to
is_public      | boolean        | No   | false   | Publicly accessible
is_active      | boolean        | No   | true    | Active flag
created_by     | uuid           | No   | FK      | References users(id)
created_at     | timestamp      | No   | NOW()   |
updated_at     | timestamp      | No   | NOW()   |
```

### 12.2 `report_executions` — Report run history

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
report_id      | uuid           | Yes  | FK      | References reports(id)
report_name    | varchar(200)   | No   |         | Snapshot of report name
executed_by    | uuid           | Yes  | FK      | Who ran it
execution_type | exec_type_enum  | No   | 'manual' | manual / scheduled / api
parameters     | jsonb          | Yes  |         | Parameters used
result_data    | jsonb          | Yes  |         | Report results
export_format  | export_fmt_enum| Yes  |         | pdf / xlsx / csv / json
export_url     | varchar(500)   | Yes  |         | Export file URL
row_count      | integer        | Yes  |         | Number of rows returned
execution_time_ms | integer     | Yes  |         | Query execution time
status         | exec_status_enum | No |       | success / failed / timeout
error_message  | text           | Yes  |         | Error if failed
executed_at    | timestamp      | No   | NOW()   |
```

---

## Module 13 — NPA & Collection

### 13.1 `npa_classifications` — Non-performing asset tracking

```sql
Column          | Type           | Null | Default | Description
----------------|----------------|------|---------|------------------------------------
id              | uuid           | No   | PK      | Primary key
npa_number      | varchar(20)    | No   | generate_id('NPA') | Auto code
loan_id         | uuid           | No   | FK      | References loans(id)
customer_id     | uuid           | No   | FK      | References users(id)
classification_date | date        | No   |         | Date of NPA classification
overdue_days    | integer        | No   |         | Days overdue
overdue_amount  | numeric(15,2)  | No   |         | Total overdue amount
npa_category    | npa_cat_enum   | No   |         | sub_standard / doubtful / loss
substandard_days| integer        | Yes  |         | Days in substandard
doubtful_days   | integer        | Yes  |         | Days in doubtful
provision_pct   | numeric(5,2)   | No   |         | Required provision %
provision_amount| numeric(15,2)  | No   |         | Provision to be made
recovery_action | jsonb          | Yes  |         | Recovery actions taken
recovery_amount | numeric(15,2)  | No   | 0       | Amount recovered
write_off_flag  | boolean        | No   | false   | Write-off flag
write_off_date  | date           | Yes  |         | Write-off date
write_off_amount| numeric(15,2)  | Yes  |         | Amount written off
is_active       | boolean        | No   | true    | Active flag
created_at      | timestamp      | No   | NOW()   |
updated_at      | timestamp      | No   | NOW()   |
```

**Enum `npa_cat_enum`:** `standard`, `sub_standard`, `doubtful`, `loss`
**RBI NPA rules applied:** >90 days = sub_standard, >180 days = doubtful, >365 days = loss.

### 13.2 `collection_agent_areas` — Agent-area assignments for collection

```sql
Column         | Type      | Null | Default | Description
---------------|-----------|------|---------|------------------------------------
id             | uuid      | No   | PK      | Primary key
agent_id       | uuid      | No   | FK      | References users(id) — collection agent
area_id        | uuid      | No   | FK      | References areas(id)
loan_id        | uuid      | Yes  | FK      | References loans(id) — specific loan assignment
assigned_date  | date      | No   |         | Assignment date
priority       | priority_enum | No | 'medium' | Collection priority
is_active      | boolean   | No   | true    | Active flag
created_at     | timestamp | No   | NOW()   |
```

---

## Module 14 — Referrals & Trust

### 14.1 `referrals` — Customer referral tracking

```sql
Column          | Type           | Null | Default | Description
----------------|----------------|------|---------|------------------------------------
id              | uuid           | No   | PK      | Primary key
referral_number | varchar(20)    | No   | generate_id('REF') | Auto code
referrer_id     | uuid           | No   | FK      | References users(id)
referred_name   | varchar(200)   | No   |         | Referred person name
referred_phone  | varchar(15)    | Yes  |         | Referred person phone
referred_email  | varchar(255)   | Yes  |         | Referred person email
referred_address| text           | Yes  |         | Address
referred_occupation | varchar(100) | Yes  |        | Occupation
status          | referral_status| No   | 'pending' | pending / contacted / applied / disbursed / rejected
referred_user_id| uuid           | Yes  | FK      | References users(id) — if they signed up
application_id  | uuid           | Yes  | FK      | References applications(id)
bonus_amount    | numeric(12,2)  | Yes  |         | Referral bonus amount
bonus_paid      | boolean        | No   | false   | Bonus paid flag
bonus_paid_on   | date           | Yes  |         | When bonus was paid
notes           | text           | Yes  |         | Additional notes
created_at      | timestamp      | No   | NOW()   |
updated_at      | timestamp      | No   | NOW()   |
```

**Enum `referral_status`:** `pending`, `contacted`, `applied`, `disbursed`, `rejected`, `expired`

### 14.2 `trust_scores` — Customer trust scoring

```sql
Column          | Type           | Null | Default | Description
----------------|----------------|------|---------|------------------------------------
id              | uuid           | No   | PK      | Primary key
customer_id     | uuid           | No   | FK      | References users(id)
application_id  | uuid           | Yes  | FK      | References applications(id)
team_score      | integer        | Yes  |         | FO/TL trust score (0-100)
community_score | integer        | Yes  |         | Community feedback score
repayment_history| integer       | Yes  |         | Repayment history score
overall_score   | integer        | No   |         | Composite score
grade           | trust_grade_enum | No |         | A / B / C / D
factors         | jsonb          | Yes  |         | Detailed scoring factors
recommendation  | text           | Yes  |         | Recommendation notes
calculated_by   | uuid           | No   | FK      | References users(id) — who calculated
calculated_at   | timestamp      | No   | NOW()   |
```

**Enum `trust_grade_enum`:** `A` (80-100), `B` (60-79), `C` (40-59), `D` (0-39)

---

## Module 15 — Audit & Security

### 15.1 `audit_logs` — Complete audit trail

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
audit_number   | varchar(20)    | No   | generate_id('AUD') | Auto code
user_id        | uuid           | Yes  | FK      | References users(id) — who did it
action         | varchar(100)   | No   |         | Action performed (e.g., "application.approved")
entity_type    | varchar(50)    | Yes  |         | Entity type (application, loan, etc.)
entity_id      | uuid           | Yes  |         | Entity ID
entity_number  | varchar(50)    | Yes  |         | Entity code (for search)
old_values     | jsonb          | Yes  |         | Previous values (for updates)
new_values     | jsonb          | Yes  |         | New values (for updates)
ip_address     | varchar(45)    | Yes  |         | Client IP
user_agent     | text           | Yes  |         | Browser / client info
request_url    | varchar(500)   | Yes  |         | API endpoint
request_method | varchar(10)    | Yes  |         | HTTP method
status_code    | integer        | Yes  |         | HTTP response status
error_message  | text           | Yes  |         | Error if any
performed_at   | timestamp      | No   | NOW()   |
```

**Sample action values:** `user.login`, `user.logout`, `application.created`, `application.submitted`, `application.approved`, `application.rejected`, `application.query_raised`, `loan.disbursed`, `emi.payment`, `disbursement.completed`, `penalty.waived`, `settings.updated`

### 15.2 `login_audit` — Login attempt tracking

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
user_id        | uuid           | Yes  | FK      | References users(id)
login_at       | timestamp      | No   | NOW()   | Login timestamp
logout_at      | timestamp      | Yes  |         | Logout timestamp
ip_address     | varchar(45)    | No   |         | Client IP
user_agent     | text           | Yes  |         | User agent string
success        | boolean        | No   |         | Login success flag
failure_reason | varchar(100)   | Yes  |         | Failure reason if failed
two_fa_used    | boolean        | No   | false   | Whether 2FA was used
session_duration | integer      | Yes  |         | Session duration in seconds
```

### 15.3 `jwt_refresh_tokens` — Refresh token management

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
user_id        | uuid           | No   | FK      | References users(id)
token          | varchar(500)   | No   |         | Refresh token hash
expires_at     | timestamp      | No   |         | Token expiry
is_revoked     | boolean        | No   | false   | Revocation flag
revoked_at     | timestamp      | Yes  |         | Revocation timestamp
created_at     | timestamp      | No   | NOW()   |
```

### 15.4 `password_reset_tokens` — Password reset flow

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
user_id        | uuid           | No   | FK      | References users(id)
token          | varchar(100)   | No   |         | Reset token
expires_at     | timestamp      | No   |         | Expiry (1 hour)
used_at        | timestamp      | Yes  |         | When used
ip_address     | varchar(45)    | Yes  |         | Request IP
created_at     | timestamp      | No   | NOW()   |
```

---

## Module 16 — Settings & System

### 16.1 `id_counters` — ID generation tracking

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
prefix         | varchar(10)    | No   |         | Code prefix (CMF, APP, LON, etc.)
table_name     | varchar(50)    | No   |         | Which table this is for
current_value  | integer        | No   | 0       | Last used sequence number
format         | varchar(50)    | No   |         | Format pattern
created_at     | timestamp      | No   | NOW()   |
updated_at     | timestamp      | No   | NOW()   |
```

### 16.2 `system_settings` — Application-wide settings

```sql
Column         | Type           | Null | Default | Description
---------------|----------------|------|---------|------------------------------------
id             | uuid           | No   | PK      | Primary key
setting_key    | varchar(100)   | No   |         | Setting key
setting_value  | jsonb          | No   |         | Setting value (any type)
data_type      | varchar(20)    | No   |         | string / number / boolean / json
category       | varchar(50)    | Yes  |         | Grouping category
description    | text           | Yes  |         | Setting description
is_editable    | boolean        | No   | true    | Can be edited by admin
updated_by     | uuid           | Yes  | FK      | Who last updated
created_at     | timestamp      | No   | NOW()   |
updated_at     | timestamp      | No   | NOW()   |
```

**Sample settings:** `company_name`, `company_logo`, `default_interest_rate`, `max_loan_amount`, `sms_provider`, `email_provider`, `overdue_notification_days`, `emi_due_reminder_days`, `fiscal_year_start`, `currency_code` (INR)

---

## Entity Relationship Summary

```
users (1) ←——→ (1) user_profiles
users (1) ←——→ (n) user_areas → areas (1) ←—— (n) branches
roles (1) ←——→ (n) role_permissions → permissions (1)
branches (1) ←——→ (n) areas
branches (1) ←——→ (n) loan_products

users (customer) (1) ←——→ (n) applications
loan_products (1) ←——→ (n) applications
branches (1) ←——→ (n) applications
areas (1) ←——→ (n) applications

applications (1) ←——→ (n) application_topics
applications (1) ←——→ (n) application_stages → stages
applications (1) ←——→ (n) application_notes
applications (1) ←——→ (n) application_documents
applications (1) ←——→ (n) stage_transitions

applications (1) ←——→ (1) loans
users (customer) (1) ←——→ (n) loans
loan_products (1) ←——→ (n) loans
product_slabs (1) ←——→ (n) loans

loans (1) ←——→ (n) emi_schedules
loans (1) ←——→ (n) emi_payments
loans (1) ←——→ (n) disbursements
loans (1) ←——→ (n) penalties
loans (1) ←——→ (n) verification_tasks
loans (1) ←——→ (n) npa_classifications

emi_payments (1) ←——→ (1) payment_receipts
emi_schedules (1) ←——→ (n) emi_payments
emi_schedules (1) ←——→ (n) penalties

disbursements (1) ←——→ (n) disbursement_charges
bank_accounts (1) ←——→ (n) disbursements

ledger_accounts (1) ←——→ (n) ledger_entry_lines → ledger_entries (1)
bank_accounts (1) ←——→ (n) ledger_entries
bank_accounts (1) ←——→ (n) bank_statement_entries
bank_reconciliations (n) ←——→ (1) bank_accounts

users (1) ←——→ (n) referrals (referrer)
users (1) ←——→ (n) referrals (referred_user)
users (1) ←——→ (n) trust_scores
users (1) ←——→ (n) audit_logs
users (1) ←——→ (n) verification_tasks (assigned_to)
users (1) ←——→ (n) verification_tasks (assigned_by)
```

---

## Database Functions & Triggers

### Function: `generate_id(prefix)` — Generates unique IDs with prefix

```sql
CREATE OR REPLACE FUNCTION generate_id(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
    new_val INTEGER;
    result TEXT;
BEGIN
    INSERT INTO id_counters (prefix, current_value)
    VALUES (prefix, 1)
    ON CONFLICT (prefix) DO UPDATE SET current_value = id_counters.current_value + 1
    RETURNING current_value INTO new_val;

    result := prefix || LPAD(new_val::TEXT, 7, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Function: `auto_generate_id()` — Trigger function for auto-numbering

Fires BEFORE INSERT on every table with an auto-numbered column. Checks `TG_TABLE_NAME` and assigns the appropriate prefix.

### Function: `update_emi_overdue()` — Mark EMIs overdue daily

```sql
CREATE OR REPLACE FUNCTION update_emi_overdue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_paid = false AND NEW.due_date < CURRENT_DATE THEN
        NEW.is_overdue = true;
        NEW.days_overdue = CURRENT_DATE - NEW.due_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Function: `update_ledger_balance()` — Recalculate account balances

Fires AFTER INSERT on `ledger_entry_lines`, recalculates the parent `ledger_accounts.current_balance`.

### Trigger: `before_application_insert` — Auto-generate application number

Fires BEFORE INSERT on `applications`, sets `application_number` if NULL.

---

## Views & Reports

### View: `v_customer_portal` — Customer self-service view

```sql
CREATE VIEW v_customer_portal AS
SELECT
    u.id as user_id, u.customer_code, u.email, u.phone,
    p.first_name, p.last_name,
    l.id as loan_id, l.loan_number, l.loan_amount, l.tenure_months,
    l.interest_rate, l.emi_amount, l.principal_paid, l.interest_paid,
    l.outstanding_principal, l.status as loan_status,
    l.next_emi_date,
    (SELECT COUNT(*) FROM emi_schedules e WHERE e.loan_id = l.id AND e.is_paid = true) as emis_paid,
    (SELECT COUNT(*) FROM emi_schedules e WHERE e.loan_id = l.id AND e.is_paid = false AND e.is_overdue = true) as overdue_emis,
    (SELECT SUM(penalty_amount) FROM penalties pen WHERE pen.loan_id = l.id AND pen.is_paid = false) as pending_penalties
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id
LEFT JOIN loans l ON l.customer_id = u.id AND l.status IN ('active', 'disbursed')
WHERE u.role = 'customer';
```

### View: `v_dashboard_loan_summary` — Dashboard loan summary

```sql
CREATE VIEW v_dashboard_loan_summary AS
SELECT
    b.id as branch_id, b.branch_name,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('disbursed', 'active')) as active_loans,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'submitted') as pending_apps,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'approved') as approved_today,
    COALESCE(SUM(l.loan_amount) FILTER (WHERE l.status = 'active'), 0) as disbursed_amount,
    COALESCE(SUM(l.outstanding_principal) FILTER (WHERE l.status = 'active'), 0) as outstanding_amount,
    COALESCE(SUM(l.principal_paid) FILTER (WHERE l.status = 'active'), 0) as collected_amount,
    COUNT(DISTINCT e.id) FILTER (WHERE e.is_paid = false AND e.due_date < CURRENT_DATE) as overdue_emis
FROM branches b
LEFT JOIN loans l ON l.branch_id = b.id
LEFT JOIN applications a ON a.branch_id = b.id
LEFT JOIN emi_schedules e ON e.loan_id = l.id
GROUP BY b.id, b.branch_name;
```

### View: `v_emi_portal` — EMI details for customer portal

```sql
CREATE VIEW v_emi_portal AS
SELECT
    e.id, e.loan_id, e.emi_number, e.due_date, e.emi_amount,
    e.principal, e.interest, e.penalty_component, e.total_due,
    e.is_paid, e.paid_on, e.is_overdue, e.days_overdue,
    l.loan_number, l.outstanding_principal,
    u.customer_code, p.first_name, p.last_name
FROM emi_schedules e
JOIN loans l ON l.id = e.loan_id
JOIN users u ON u.id = l.customer_id
LEFT JOIN user_profiles p ON p.user_id = u.id;
```

---

*Document version: 1.0.0 | Last updated: October 2026 | For: Continnum Microfinance Private Limited, Chennai*
