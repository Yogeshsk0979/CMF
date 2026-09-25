# BUILD PROMPT — SHG Microfinance Operations Platform

> **For:** Google Antigravity (or any autonomous coding agent: Claude Code, Cursor, Codex)
> **Role you must adopt:** Senior Solution Architect + Microfinance/SHG Domain Architect + PostgreSQL Architect + Security Architect + Backend/Frontend Lead
> **This file is the single technical source of truth.** If anything here conflicts with your own assumptions, this file wins. If anything here is marked **CONFIRM**, you must NOT guess — build the configurable mechanism, leave the value unset or behind a feature flag, and list it in your report.

---

## 0. HOW TO EXECUTE THIS PROMPT

1. Read this entire file before writing any code.
2. Produce an **implementation plan artifact** that lists the phases in §15, the tables you will create per phase, and the tests you will write. Wait for approval if your environment supports review; otherwise proceed.
3. Build **phase by phase** (§15). Do not start a phase until the previous phase's exit criteria pass.
4. After each phase: run migrations on a clean database, run all tests, start the app, exercise the new flows in the browser, and write a short **phase report** (what was built, what was tested, what is blocked on CONFIRM items).
5. Never "simplify" a financial rule to make a test pass. If a rule seems impossible, stop and report.
6. Never invent fields for the existing live loan application (§17). Build that screen only after the field mapping is supplied.

---

## 1. MISSION AND BUSINESS CONTEXT

Build a production-grade web platform for a microfinance company lending primarily to **Women's Self-Help Groups (SHGs)** in Tamil Nadu (Chennai region: Villivakkam, Korukkupet, Kolathur, GKM Colony, etc.). It is **not a CRUD loan app**. It is an operations platform covering group formation, member onboarding, KYC, loan origination, multi-level approval, sanction, disbursement, repayment schedules, **manual field collection (no payment gateway)**, payment allocation, receipts, **double-entry accounting**, multiple bank/cash accounts, expenses, transfers, reconciliation, daily closing, a customer self-service portal, and fine-grained access control.

### 1.1 Business flow

```
Organization → Branch → Area → Center (meeting center) → SHG Group → Sub-group (JLG, optional) → Member
Member → Loan Application → Document check → Field Verification → Credit Review
       → Multi-level Approval → Sanction → Customer Acceptance → Disbursement
       → Loan Account + Repayment Schedule → Collection Plan → Field Collection
       → Allocation → Receipt → Journal (ledger) → Agent Handover → Reconciliation
       → Daily Closing → ... → Loan Closure
```

### 1.2 What the client's handwritten books show (design MUST address each)

| # | Observation from paper registers | Mandatory design response |
|---|---|---|
| F1 | A "CMF Account" cash book records dozens of ₹8,500 outflows per day as **"Expense"**, while the loan register shows ₹10,000 loans. ₹10,000 − ₹8,500 = ₹1,500 upfront deduction. | Disbursement is a **loan asset**, never an expense. Sanction stores **gross amount + itemised deductions + net payout**. APR must include deductions. Composition of ₹1,500 is **CONFIRM**. |
| F2 | Receipts recorded as lump sums: "BHAVANI Group Amount ₹50,000", "Elakiya Group Amount ₹22,000". | **Group collection sheet** splitting one handover into per-member, per-loan collections. Sheet total must equal sum of lines. |
| F3 | Many receipts (₹12,000, ₹2,000, ₹1,000, ₹500) have no source. | Every money movement requires a transaction type and a source reference. No free-floating receipts; unknown money goes to a **suspense** account with a follow-up task. |
| F4 | ₹1 "expenses" and an ₹8,499 entry used to absorb arithmetic errors; balances struck through and rewritten. | Balances are **computed, never typed**. Corrections only by **reversal + new entry** with reason. Unexplained differences become **reconciliation variances** requiring approval. |
| F5 | Office rent ₹17,000 in the same book as loan payouts. | Full **office expense & payroll module** (§6.16, §7.18): salaries, rent, EB/electricity, water, internet, fuel, stationery etc., with vendors, premises, recurring bills, approval, budgets, petty cash and proper ledger postings. |
| F6 | Two names appear: "CMF" and "SANMAHERA FINANCE". | Multi-organisation (tenant) + multi-branch from day one. Which one is an entity vs brand is **CONFIRM**. |
| F7 | Two product shapes: ₹10,000 (net ₹8,500) and ₹50,000 with ₹500/₹1,000 installments ticked on a dated grid. A "5" column of unknown meaning. | Fully configurable, versioned loan products incl. **fixed installment tables**. Meaning of "5" is **CONFIRM**. |
| F8 | One group name (BHAVANI) spans several locations, each block of 5–6 members with its own "TL" (team leader). | Support **SHG → Sub-group (JLG) → Member**, with team leader as an office-bearer role. |
| F9 | 20+ disbursements/day from one book, balances ₹2.5–5.7 lakh. | Daily closing, agent cash handover and branch cash reconciliation are **core** features. |

Do not copy any personal names/phone numbers from the paper records into code, seeds or fixtures. Use synthetic data.

---

## 2. NON-NEGOTIABLE RULES

1. **All business and financial logic lives in the Node.js API** (services + pure domain package). React only renders and validates for UX.
2. The browser **never** talks to Postgres tables. Supabase JS in the browser is used only for **Auth**. Service-role key exists only on the server.
3. **RLS enabled on every table** with no grants to `anon`/`authenticated` on business tables (backstop). Authorization is enforced by the API (§7.10).
4. **Financial rows are never updated in amount and never deleted.** Corrections are reversals.
5. **Double-entry**: every money movement = one `journal_entry` with balanced `journal_lines` (Σdebit = Σcredit), enforced by a deferred DB constraint trigger.
6. **Money = `numeric(18,2)`** in DB, `decimal.js` in Node, **strings** in JSON. Never JS `number` for money.
7. **Every money-moving POST requires an `Idempotency-Key`.** Offline captures use the client UUID as the key.
8. **Every financial record has a `business_date`** (branch's open business day, Asia/Kolkata), independent of `created_at`.
9. **Nothing is hardcoded** that is tagged CONFIGURABLE: rates, thresholds, approval levels, allocation order, reason codes, dropdowns, workflow stages, number formats.
10. **Status changes happen only through action endpoints** that validate the transition against `workflow_transitions` / state machines. Never `PATCH status`.
11. **Audit everything** (before/after JSON) in the same DB transaction as the change.
12. **Never fabricate GPS.** Record source (DEVICE_GPS / MANUAL_PIN / GEOCODED / NONE) and permission state.
13. **Sensitive data masked by default**; unmasking requires permission and is logged.
14. **No continuous location tracking.** Event-based capture only.
15. **Segregation of duties** on by default (maker ≠ checker; sourcing agent/verifier cannot approve the same application; handover receiver ≠ agent).

---

## 3. TECH STACK AND REPOSITORY

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite, TypeScript (strict), React Router, TanStack Query, React Hook Form, Zod, shadcn/ui, Tailwind, i18next (Tamil + English), PWA (vite-plugin-pwa) for the agent app, IndexedDB (Dexie) for offline queue |
| Backend | Node.js 20 LTS, Express, TypeScript (strict), Zod, Kysely (typed SQL query builder; types generated from DB), decimal.js, pino (logs), helmet, express-rate-limit, pg-boss (jobs on Postgres) |
| Data | Supabase: PostgreSQL 15+, Auth (staff email/password + TOTP MFA; customers phone OTP), Storage (private buckets) |
| Testing | Vitest (unit + integration), Supertest (API), fast-check (property tests), Playwright (E2E), testcontainers or Supabase local for real Postgres |
| Tooling | pnpm workspaces, ESLint, Prettier, Supabase CLI migrations, GitHub Actions CI |

### 3.1 Monorepo layout

```
/apps
  /web                # React app: /app (staff), /field (agent PWA), /portal (customer)
  /api                # Express API
/packages
  /contracts          # Zod schemas, DTOs, enums, permission codes, settings registry (shared FE/BE)
  /domain             # PURE functions, no I/O: schedule, interest, APR, allocation, DPD, penalty,
                      # eligibility, authz evaluation core, state machines. 100% unit tested.
/db
  /migrations         # ordered SQL migrations
  /seed               # permissions, roles, chart of accounts, lookups, reason codes, demo data
/docs                 # generated ERD, API reference, phase reports
```

### 3.2 API internal layering

```
route → zod validate → authenticate(JWT) → loadActor(employee/customer + effective perms)
      → controller (HTTP only)
      → service(actor, dto, tx)           // business rules, authz.can(), orchestration
      → repository(tx)                    // SQL only, no rules
      → domain.* pure functions           // math & rules
      → audit.write(tx)                   // same transaction
```

- One transaction (`UnitOfWork`) per command; passed down to repositories.
- Services may call other services (passing the same tx); never another module's repository.

### 3.3 Environment variables (API)

`DATABASE_URL, SUPABASE_URL, SUPABASE_JWT_SECRET (or JWKS URL), SUPABASE_SERVICE_ROLE_KEY, FIELD_ENCRYPTION_KEY (32-byte, base64), HASH_PEPPER, SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID, APP_BASE_URL, CORS_ORIGINS, TZ=Asia/Kolkata (display only; DB stays UTC)`.
Frontend: `VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL` — nothing else.

---

## 4. GLOBAL CONVENTIONS

| Concern | Rule |
|---|---|
| Primary keys | `uuid default gen_random_uuid()` (switch to uuidv7 when PG18 available). Human codes in separate unique columns. |
| Standard columns (`/* STD */`) | Every business table has: `id uuid pk, org_id uuid not null references organizations, created_at timestamptz not null default now(), created_by uuid, updated_at timestamptz not null default now(), updated_by uuid, version int not null default 1`. The marker `/* STD */` in DDL below means "insert these columns here". |
| Branch column | Any record that belongs to a branch carries `branch_id` (scope filtering + indexing). |
| Money | `numeric(18,2)`; rates `numeric(9,6)` (% per annum unless stated). |
| Dates | `business_date date` for financial meaning; `timestamptz` (UTC) for events. |
| Soft delete | Masters only: `deleted_at timestamptz`. Financial tables: never. |
| Optimistic locking | Updates require `If-Match: <version>`; repository does `where id=$1 and version=$2`, increments version. |
| Enums | Stable system enums = Postgres `enum` types. Client-editable lists = `lookup_values`. |
| Numbering | `number_series` (§7.13): gapless per org/branch/fiscal year. FY = April–March. |
| Rounding | Per product: mode (HALF_UP default) and unit (1.00 or 0.01). Last installment absorbs residue. |
| Language | UI, receipts, SMS in Tamil + English. Indian digit grouping (₹1,23,456.00). |
| Errors | `{error:{code, message, details, requestId}}`; 400 validation, 401, 403 permission, 404 not-found-or-out-of-scope, 409 version/idempotency/state conflict, 422 business-rule violation. |

---

## 5. MODULE CATALOGUE

Codes are used in permissions (`RESOURCE.ACTION`) and folder names (`apps/api/src/modules/<module>`).

| Group | Modules |
|---|---|
| Platform | M01 Organization, M02 Branch, M03 Area, M04 Center, M40 Users, M41 Roles, M42 Permissions, M43 Data Scopes, M44 Audit, M45 System Config, M62 Number Series, M61 Holiday Calendar, M64 Devices & Sessions, M65 Background Jobs, M66 Localisation |
| Members | M06 Customer/Member, M07 KYC, M08 Address, M09 Location (geo points), M10 Household, M11 References/Nominee/Guarantor, M58 Consents & Disclosures |
| Groups | M05 SHG Group, M46 Sub-group/JLG, M47 Meetings & Attendance |
| Products | M11P Loan Products (versioned), M50 Charges & Deductions, M51 Insurance, M52 Security Deposit/Savings (**CONFIRM** if used) |
| Origination | M12 Loan Application, M13 Application Documents, M14 Workflow Engine, M15 Field Verification, M16 Credit Review, M17 Approval, M18 Sanction, M57 Credit Bureau (placeholder) |
| Servicing | M19 Disbursement, M20 Loan Account, M21 Repayment Schedule, M53 Lifecycle Events (reschedule, restructure, moratorium, prepayment, foreclosure, waiver, write-off, death claim), M54 Delinquency/PAR |
| Collections | M22 Collection, M48 Group Collection Sheet, M23 Allocation Engine, M24 Receipts, M25 Agents, M26 Agent Assignment, M27 Collection Planning, M28 Agent Location Events, Reversals |
| Finance | M29 Bank Accounts + M30 Cash Accounts (= Financial Accounts), M49 Chart of Accounts & Journal, M31 Ledger, M32 Office Expenses (vendors, premises & rent, utilities/EB, recurring bills, budgets, petty cash), M67 Payroll & Staff Advances, M33 Transfers, M55 Suspense/Clearing, M56 Cash Denominations, M34 Reconciliation (agent, branch, bank), M35 Daily Closing |
| Customer | M36 Customer Portal, M60 Grievances |
| Output | M37 Notifications, M38 Reports, M39 Dashboards, M59 Document Templates & Printing |
| Data | M63 Import & Migration |

---

## 6. DATABASE SCHEMA (PostgreSQL DDL)

Write these as ordered migrations. `/* STD */` = standard columns from §4. Add `branch_id` indexes and FK indexes everywhere. Extensions: `pgcrypto`, `btree_gist`, `citext`.

### 6.1 System enums

```sql
create type record_status      as enum ('ACTIVE','INACTIVE');
create type gender_t           as enum ('FEMALE','MALE','OTHER');
create type marital_status_t   as enum ('SINGLE','MARRIED','WIDOWED','SEPARATED','DIVORCED');
create type customer_status_t  as enum ('PROSPECT','ACTIVE','INACTIVE','BLACKLISTED','DECEASED','CLOSED');
create type customer_type_t    as enum ('SHG_MEMBER','INDIVIDUAL','GUARANTOR_ONLY');
create type geo_source_t       as enum ('DEVICE_GPS','MANUAL_PIN','GEOCODED','IMPORTED');
create type address_type_t     as enum ('PERMANENT','CURRENT','BUSINESS','COLLECTION');
create type kyc_status_t       as enum ('PENDING','VERIFIED','REJECTED','EXPIRED','SUPERSEDED');
create type group_status_t     as enum ('FORMING','ACTIVE','DORMANT','CLOSED');
create type membership_status_t as enum ('ACTIVE','EXITED');
create type exit_type_t        as enum ('VOLUNTARY','TRANSFERRED_OUT','EXPELLED','DECEASED','GROUP_CLOSED');
create type frequency_t        as enum ('DAILY','WEEKLY','FORTNIGHTLY','MONTHLY','BULLET');
create type tenure_unit_t      as enum ('DAYS','WEEKS','FORTNIGHTS','MONTHS');
create type interest_method_t  as enum ('FLAT','REDUCING_EMI','REDUCING_EQUAL_PRINCIPAL','UPFRONT_INTEREST','FIXED_INSTALLMENT_TABLE');
create type app_status_t       as enum ('DRAFT','SUBMITTED','DOCUMENT_CHECK','VERIFICATION_PENDING','UNDER_VERIFICATION',
                                        'CREDIT_REVIEW','IN_APPROVAL','SENT_BACK','INFO_REQUESTED','ON_HOLD',
                                        'APPROVED','REJECTED','WITHDRAWN','EXPIRED','CANCELLED');
create type sanction_status_t  as enum ('ISSUED','ACCEPTED','DECLINED_BY_CUSTOMER','EXPIRED','CANCELLED','DISBURSED');
create type disb_status_t      as enum ('INITIATED','APPROVED','PAID','FAILED','REVERSED');
create type loan_status_t      as enum ('PENDING_DISBURSEMENT','ACTIVE','CLOSED','PREPAID','WRITTEN_OFF','DEATH_CLAIM_PENDING','CANCELLED');
create type inst_status_t      as enum ('UPCOMING','DUE','PARTIALLY_PAID','PAID','OVERDUE','WAIVED','SUPERSEDED');
create type component_t        as enum ('PRINCIPAL','INTEREST','PENALTY','CHARGE');
create type collection_status_t as enum ('CAPTURED','POSTED','REVERSED');
create type verif_status_t     as enum ('NOT_REQUIRED','PENDING','VERIFIED','FAILED');
create type fin_account_kind_t as enum ('BANK','CASH','AGENT_CASH','CLEARING','OTHER');
create type gl_type_t          as enum ('ASSET','LIABILITY','INCOME','EXPENSE','EQUITY');
create type journal_type_t     as enum ('LOAN_DISBURSEMENT','LOAN_REPAYMENT','CHARGE','PENALTY_ACCRUAL','WAIVER','EXPENSE',
                                        'TRANSFER','REFUND','ADJUSTMENT','REVERSAL','OPENING_BALANCE','WRITE_OFF',
                                        'VARIANCE','ADVANCE_APPLICATION','OTHER');
create type day_status_t       as enum ('OPEN','CLOSING','CLOSED','REOPENED');
create type scope_type_t       as enum ('ORG','BRANCH','AREA','CENTER','GROUP','ASSIGNED_ONLY','OWN_ONLY');
create type override_effect_t  as enum ('GRANT','DENY');
create type wf_action_t        as enum ('SUBMIT','APPROVE','REJECT','SEND_BACK','REQUEST_INFORMATION','RECOMMEND',
                                        'NOT_RECOMMEND','HOLD','RESUME','WITHDRAW','CANCEL','REASSIGN','CLAIM','ANSWER_INFO');
```

### 6.2 Organisation and hierarchy

```sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, legal_name text not null, brand_name text,
  registration_type text,            -- NBFC_MFI | NBFC | SECTION8 | OTHER | UNREGISTERED  (CONFIRM)
  registration_no text, pan text, gstin text,
  address_id uuid, fiscal_year_start_month int not null default 4,
  base_currency char(3) not null default 'INR',
  status record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version int not null default 1
);

create table branches ( /* STD */ code text not null, name text not null, address_id uuid, phone text,
  manager_employee_id uuid, opened_on date, status record_status not null default 'ACTIVE', deleted_at timestamptz,
  unique (org_id, code) );

create table areas   ( /* STD */ branch_id uuid not null references branches, code text not null, name text not null,
  status record_status not null default 'ACTIVE', deleted_at timestamptz, unique (org_id, code) );

create table centers ( /* STD */ branch_id uuid not null references branches, area_id uuid not null references areas,
  code text not null, name text not null, meeting_place text, geo_point_id uuid,
  status record_status not null default 'ACTIVE', deleted_at timestamptz, unique (org_id, code) );

create table holidays ( /* STD */ branch_id uuid null references branches, holiday_date date not null,
  name text not null, holiday_type text not null default 'PUBLIC', unique (org_id, branch_id, holiday_date) );

-- Precomputed containment for fast scope checks (maintained by triggers on hierarchy/group tables)
create table hierarchy_closure (
  org_id uuid not null, ancestor_type text not null, ancestor_id uuid not null,
  descendant_type text not null, descendant_id uuid not null,
  primary key (ancestor_type, ancestor_id, descendant_type, descendant_id) );
create index on hierarchy_closure (descendant_type, descendant_id);

create table hierarchy_changes ( /* STD */ entity_type text not null, entity_id uuid not null,
  old_parent_id uuid, new_parent_id uuid not null, effective_date date not null, reason text not null );
```

### 6.3 Users, employees, access control

```sql
create table employees ( /* STD */ user_id uuid unique,          -- auth.users.id, null until login issued
  employee_code text not null, full_name text not null, mobile text not null, email citext,
  designation text, department text, home_branch_id uuid not null references branches, joined_on date not null, left_on date,
  salary_bank_account_encrypted bytea, salary_bank_account_masked text, salary_ifsc text, salary_payment_mode text default 'BANK_TRANSFER',
  pan_encrypted bytea, pan_masked text, uan text, esic_no text,          -- statutory ids (sensitive)
  status text not null default 'ACTIVE' check (status in ('ACTIVE','ON_LEAVE','SUSPENDED','EXITED')),
  unique (org_id, employee_code) );

create table permissions ( id uuid primary key default gen_random_uuid(),
  code text unique not null,         -- 'LOAN_APPLICATION.APPROVE'
  resource text not null, action text not null, description text not null,
  is_sensitive bool not null default false, supports_scope bool not null default true,
  supports_stage bool not null default false );

create table roles ( /* STD */ code text not null, name text not null, description text,
  is_system bool not null default false, audience text not null default 'STAFF' check (audience in ('STAFF','CUSTOMER')),
  status record_status not null default 'ACTIVE', unique (org_id, code) );

create table role_permissions ( id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles on delete cascade, permission_id uuid not null references permissions,
  stage_codes text[] null,           -- null = any workflow stage
  conditions jsonb null,             -- e.g. {"productCodes":["JLG10K"]}
  unique (role_id, permission_id) );

create table user_roles ( /* STD */ user_id uuid not null, role_id uuid not null references roles,
  valid_from date not null default current_date, valid_to date, granted_by uuid not null );

create table user_data_scopes ( /* STD */ user_id uuid not null, user_role_id uuid null references user_roles,
  scope_type scope_type_t not null, scope_id uuid null, valid_from date not null default current_date, valid_to date,
  check ((scope_type in ('ORG','ASSIGNED_ONLY','OWN_ONLY')) = (scope_id is null)) );

create table user_permission_overrides ( /* STD */ user_id uuid not null, permission_id uuid not null references permissions,
  effect override_effect_t not null, scope_type scope_type_t not null default 'ORG', scope_id uuid,
  stage_codes text[], conditions jsonb, reason text not null, granted_by uuid not null,
  valid_from timestamptz not null default now(), valid_to timestamptz );

create table business_limits ( /* STD */ subject_type text not null check (subject_type in ('ROLE','USER')),
  subject_id uuid not null,
  limit_type text not null check (limit_type in ('APPROVAL_AMOUNT','DISBURSEMENT_AMOUNT','COLLECTION_PER_TXN',
     'COLLECTION_PER_DAY','CASH_HOLDING','EXPENSE_AMOUNT','WAIVER_AMOUNT','REVERSAL_AMOUNT','TRANSFER_AMOUNT')),
  product_id uuid null, amount numeric(18,2) not null check (amount >= 0),
  valid_from date not null default current_date, valid_to date );

create table delegations ( /* STD */ from_user_id uuid not null, to_user_id uuid not null, entity_type text not null,
  valid_from timestamptz not null, valid_to timestamptz not null, reason text not null, check (valid_to > valid_from) );

create table devices ( /* STD */ employee_id uuid references employees, customer_id uuid,
  device_fingerprint text not null, platform text, registered_at timestamptz not null default now(),
  last_seen_at timestamptz, status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED')) );

create table permission_change_log ( id bigserial primary key, org_id uuid not null, changed_at timestamptz not null default now(),
  changed_by uuid not null, target_table text not null, target_id uuid not null, before jsonb, after jsonb, reason text );
```

### 6.4 Documents, geo, addresses

```sql
create table documents ( /* STD */ storage_bucket text not null, storage_path text not null unique,  -- path uses uuid only
  original_filename text, mime_type text not null, size_bytes bigint not null, sha256 text not null,
  entity_type text, entity_id uuid, doc_category text not null,
  captured_geo_point_id uuid, uploaded_by uuid not null );

create table geo_points ( /* STD */ latitude numeric(9,6), longitude numeric(9,6), accuracy_m numeric(8,2),
  captured_at timestamptz not null, source geo_source_t not null, captured_by uuid, device_id uuid,
  is_mock_location bool not null default false,
  check (latitude between -90 and 90 and longitude between -180 and 180) );

create table addresses ( /* STD */ line1 text not null, line2 text, landmark text, locality text, taluk text,
  district text not null, state text not null default 'Tamil Nadu', pincode char(6) not null check (pincode ~ '^[1-9][0-9]{5}$'),
  country char(2) not null default 'IN', address_local text );
```

### 6.5 Customers, KYC, household, references

```sql
create table customers ( /* STD */ home_branch_id uuid not null references branches,
  customer_code text not null, title text,
  first_name text not null, middle_name text, last_name text, full_name text not null, name_local text,
  gender gender_t not null, date_of_birth date, dob_is_approximate bool not null default false,
  primary_mobile text not null check (primary_mobile ~ '^\+91[6-9][0-9]{9}$'),
  alternate_mobile text check (alternate_mobile ~ '^\+91[6-9][0-9]{9}$'),
  mobile_verified_at timestamptz, email citext,
  marital_status marital_status_t, father_name text, mother_name text, spouse_name text,
  education_level_code text, primary_occupation_code text,          -- lookup_values
  religion_code text, social_category_code text,                     -- OFF by default; sensitive (CONFIRM need)
  customer_type customer_type_t not null default 'SHG_MEMBER',
  status customer_status_t not null default 'PROSPECT', status_reason text, status_changed_at timestamptz,
  source text not null check (source in ('FIELD_AGENT','REFERRAL','WALK_IN','EXISTING_MEMBER','IMPORT','OTHER')),
  referred_by_customer_id uuid references customers, sourced_by_employee_id uuid references employees,
  photo_document_id uuid references documents, signature_document_id uuid references documents,
  preferred_language text not null default 'TA' check (preferred_language in ('TA','EN')),
  deceased_on date, dedupe_key text not null, legacy_ref text, deleted_at timestamptz,
  unique (org_id, customer_code) );
create index on customers (org_id, primary_mobile);
create index on customers (org_id, dedupe_key);
-- age is NEVER stored; compute from date_of_birth

create table customer_branch_history ( /* STD */ customer_id uuid not null references customers,
  from_branch_id uuid, to_branch_id uuid not null, effective_date date not null, reason text not null );

create table kyc_document_types ( /* STD */ code text not null, name text not null,
  category text not null check (category in ('IDENTITY','ADDRESS','PHOTO','SIGNATURE','INCOME','OTHER')),
  number_regex text, number_storage text not null check (number_storage in ('FULL_ENCRYPTED','MASKED_ONLY','NONE')),
  has_expiry bool not null default false, active bool not null default true, unique (org_id, code) );
-- Seed Aadhaar as MASKED_ONLY (store last 4 + salted hash). CONFIRM with compliance before changing.

create table customer_kyc_documents ( /* STD */ customer_id uuid not null references customers,
  document_type_id uuid not null references kyc_document_types,
  number_masked text, number_encrypted bytea, number_hash text,   -- hash = HMAC(pepper, normalised number)
  name_on_document text, issued_on date, expires_on date,
  status kyc_status_t not null default 'PENDING',
  verification_method text check (verification_method in ('PHYSICAL','DIGILOCKER','OFFLINE_XML','API','OTHER')),
  verified_by uuid, verified_at timestamptz, rejection_reason_code text, rejection_note text,
  superseded_by uuid references customer_kyc_documents );
create index on customer_kyc_documents (org_id, document_type_id, number_hash);

create table customer_kyc_document_files ( id uuid primary key default gen_random_uuid(),
  kyc_document_id uuid not null references customer_kyc_documents, document_id uuid not null references documents,
  side text not null check (side in ('FRONT','BACK','FULL')) );

create table customer_addresses ( /* STD */ customer_id uuid not null references customers,
  address_id uuid not null references addresses, address_type address_type_t not null,
  is_primary bool not null default false,
  ownership text check (ownership in ('OWNED','RENTED','FAMILY','OTHER')), years_at_address numeric(4,1),
  valid_from date not null default current_date, valid_to date,
  verified_status text not null default 'UNVERIFIED' check (verified_status in ('UNVERIFIED','VERIFIED','MISMATCH')),
  verified_by uuid, verified_at timestamptz );

create table customer_locations ( /* STD */ customer_id uuid not null references customers,
  customer_address_id uuid references customer_addresses, geo_point_id uuid not null references geo_points,
  purpose text not null check (purpose in ('HOME','BUSINESS','MEETING')), verified bool not null default false );

create table customer_livelihoods ( /* STD */ customer_id uuid not null references customers,
  occupation_code text not null, description text, years_in_occupation numeric(4,1),
  monthly_income numeric(18,2), is_primary bool not null default true, valid_from date not null default current_date, valid_to date );

create table household_members ( /* STD */ customer_id uuid not null references customers, name text not null,
  relationship_code text not null, date_of_birth date, age_years int, gender gender_t,
  occupation_code text, monthly_income numeric(18,2), is_earning bool not null default false,
  is_dependent bool not null default false, education_level_code text, mobile text,
  lives_with_customer bool not null default true, is_nominee_eligible bool not null default true, deleted_at timestamptz );

create table household_assessments ( /* STD */ customer_id uuid not null references customers,
  application_id uuid,                                  -- one per application
  household_size int not null check (household_size >= 1), earning_members int not null, dependents int not null,
  monthly_household_income numeric(18,2) not null check (monthly_household_income >= 0),
  income_breakdown jsonb not null default '[]',         -- [{source, memberId, amount}] must sum to income
  monthly_household_expenses numeric(18,2) not null check (monthly_household_expenses >= 0),
  existing_monthly_loan_obligations numeric(18,2) not null default 0,
  assessed_by uuid not null, assessed_on date not null, stage text not null check (stage in ('DECLARED','VERIFIED')) );

create table customer_references ( /* STD */ customer_id uuid not null references customers, name text not null,
  relationship text not null, mobile text, address_id uuid references addresses, years_known numeric(4,1),
  verified_status text not null default 'UNVERIFIED', verification_note text );
```

### 6.6 Groups, sub-groups, membership, meetings

```sql
create table shg_groups ( /* STD */ branch_id uuid not null references branches, area_id uuid not null references areas,
  center_id uuid not null references centers, code text not null, name text not null, name_local text,
  formation_date date not null, registration_no text,
  group_type text not null default 'SHG' check (group_type in ('SHG','JLG','OTHER')),
  meeting_frequency frequency_t not null, meeting_day_of_week int check (meeting_day_of_week between 1 and 7),
  meeting_week_of_month int check (meeting_week_of_month between 1 and 5), meeting_time time,
  meeting_place text, geo_point_id uuid references geo_points,
  min_members int not null default 5, max_members int not null default 20,
  status group_status_t not null default 'FORMING', status_reason text, grade text, deleted_at timestamptz,
  unique (org_id, code) );

create table sub_groups ( /* STD */ group_id uuid not null references shg_groups, code text not null, name text not null,
  status record_status not null default 'ACTIVE', unique (group_id, code) );

create table group_memberships ( /* STD */ group_id uuid not null references shg_groups,
  sub_group_id uuid references sub_groups, customer_id uuid not null references customers,
  member_number text not null, joined_on date not null, left_on date,
  exit_type exit_type_t, exit_reason text, transferred_to_membership_id uuid references group_memberships,
  status membership_status_t not null default 'ACTIVE',
  check ((status = 'EXITED') = (left_on is not null)) );
create unique index one_active_membership on group_memberships (org_id, customer_id) where status = 'ACTIVE';  -- CONFIRM
create unique index member_no_per_group on group_memberships (group_id, member_number);

create table group_office_bearers ( /* STD */ group_id uuid not null references shg_groups,
  sub_group_id uuid references sub_groups, customer_id uuid not null references customers,
  role_code text not null,           -- PRESIDENT, SECRETARY, TREASURER, TEAM_LEADER, ANIMATOR, REPRESENTATIVE (lookup)
  from_date date not null, to_date date, resolution_ref text,
  exclude using gist (group_id with =, coalesce(sub_group_id,'00000000-0000-0000-0000-000000000000'::uuid) with =,
                      role_code with =, daterange(from_date, to_date, '[]') with &&) );

create table group_meetings ( /* STD */ branch_id uuid not null, group_id uuid not null references shg_groups,
  scheduled_date date not null, held_on timestamptz,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','HELD','CANCELLED','POSTPONED')),
  conducted_by_employee_id uuid, geo_point_id uuid, photo_document_id uuid, minutes text,
  unique (group_id, scheduled_date) );

create table meeting_attendance ( id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references group_meetings, customer_id uuid not null references customers,
  status text not null check (status in ('PRESENT','ABSENT','LEAVE','PROXY')), remark text,
  unique (meeting_id, customer_id) );
```

### 6.7 Loan products (versioned) and charges

```sql
create table loan_products ( /* STD */ code text not null, name text not null, name_local text,
  category text not null check (category in ('GROUP_JLG','SHG_BULK','INDIVIDUAL','OTHER')),
  borrower_type text not null check (borrower_type in ('MEMBER','GROUP')),
  status record_status not null default 'ACTIVE', unique (org_id, code) );

create table loan_product_versions ( /* STD */ product_id uuid not null references loan_products,
  version_no int not null, effective_from date not null, effective_to date,
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','RETIRED')), approved_by uuid,
  -- amount
  min_amount numeric(18,2) not null, max_amount numeric(18,2) not null, amount_step numeric(18,2) not null default 1000,
  cycle_limits jsonb not null default '[]',            -- [{cycle:1,max:10000},{cycle:2,max:20000}]
  -- tenure & repayment
  tenure_unit tenure_unit_t not null, min_tenure int not null, max_tenure int not null, allowed_tenures int[],
  repayment_frequency frequency_t not null, align_to_group_meeting bool not null default true,
  min_days_to_first_due int not null default 7,
  holiday_rule text not null default 'NEXT_WORKING_DAY' check (holiday_rule in ('NEXT_WORKING_DAY','PREVIOUS_WORKING_DAY','NO_SHIFT')),
  -- interest
  interest_method interest_method_t not null,
  rate_min numeric(9,6) not null, rate_max numeric(9,6) not null, default_rate numeric(9,6) not null,
  rate_period text not null default 'PER_ANNUM' check (rate_period in ('PER_ANNUM','PER_MONTH','FLAT_TOTAL')),
  day_count text not null default 'PERIODIC' check (day_count in ('PERIODIC','ACTUAL_365','30_360')),
  installment_table jsonb,                              -- FIXED_INSTALLMENT_TABLE: [{amount:10000,tenure:25,installments:[{no:1,principal:..,interest:..}]}]
  rounding_mode text not null default 'HALF_UP', rounding_unit numeric(6,2) not null default 1.00,
  -- grace, penalty, prepayment
  principal_grace_installments int not null default 0, interest_grace_installments int not null default 0,
  penalty_enabled bool not null default false,
  penalty_basis text check (penalty_basis in ('OVERDUE_PRINCIPAL','OVERDUE_INSTALLMENT','FLAT_PER_EVENT')),
  penalty_value numeric(18,6), penalty_grace_days int not null default 0, penalty_cap numeric(18,2),
  overdue_grace_days int not null default 0,
  prepayment_allowed bool not null default true, prepayment_charge_percent numeric(9,6) not null default 0,
  prepayment_interest_rule text not null default 'TILL_DATE' check (prepayment_interest_rule in ('TILL_DATE','TILL_NEXT_DUE')),
  -- allocation
  allocation_order text[] not null default '{CHARGE,PENALTY,INTEREST,PRINCIPAL}',
  allocation_scope text not null default 'OLDEST_DUE_FIRST' check (allocation_scope in ('OLDEST_DUE_FIRST','COMPONENT_ACROSS_INSTALLMENTS')),
  advance_payment_rule text not null default 'HOLD_AS_ADVANCE' check (advance_payment_rule in ('HOLD_AS_ADVANCE','APPLY_TO_FUTURE_PRINCIPAL','REDUCE_TENURE')),
  -- rules & templates
  eligibility_rules jsonb not null default '[]', workflow_definition_id uuid,
  kfs_template_id uuid, agreement_template_id uuid,
  unique (product_id, version_no), check (min_amount <= max_amount), check (min_tenure <= max_tenure),
  check (rate_min <= default_rate and default_rate <= rate_max) );
-- ACTIVE version is immutable (trigger rejects updates except status->RETIRED and effective_to).

create table product_branch_availability ( product_version_id uuid references loan_product_versions,
  branch_id uuid references branches, primary key (product_version_id, branch_id) );

create table charge_types ( /* STD */ code text not null, name text not null,
  nature text not null check (nature in ('INCOME','LIABILITY','PASS_THROUGH')),   -- fee income / deposit / insurer premium
  gl_account_id uuid not null, unique (org_id, code) );
-- seed: PROCESSING_FEE, INSURANCE_PREMIUM, SECURITY_DEPOSIT, DOCUMENTATION, UPFRONT_INTEREST, LATE_FEE, BOUNCE_FEE

create table product_charges ( /* STD */ product_version_id uuid not null references loan_product_versions,
  charge_type_id uuid not null references charge_types,
  calc_method text not null check (calc_method in ('FIXED','PERCENT_OF_SANCTION','PERCENT_OF_INSTALLMENT','SLAB')),
  value numeric(18,6), slabs jsonb,
  collect_at text not null check (collect_at in ('UPFRONT_DEDUCT','UPFRONT_COLLECT','WITH_INSTALLMENT','ON_EVENT')),
  gst_applicable bool not null default false, gst_rate numeric(5,2), is_refundable bool not null default false );

create table product_purposes ( product_version_id uuid references loan_product_versions,
  purpose_code text not null, primary key (product_version_id, purpose_code) );
```

### 6.8 Origination, workflow, verification, sanction

```sql
create table loan_applications ( /* STD */ branch_id uuid not null, application_no text not null,
  center_id uuid, group_id uuid references shg_groups, sub_group_id uuid references sub_groups,
  customer_id uuid references customers,                 -- null only for GROUP borrower products
  product_version_id uuid not null references loan_product_versions, loan_cycle int not null,
  requested_amount numeric(18,2) not null check (requested_amount > 0),
  requested_tenure int not null, tenure_unit tenure_unit_t not null, requested_frequency frequency_t not null,
  purpose_code text not null, purpose_detail text, requested_disbursement_date date,
  source text not null check (source in ('FIELD_AGENT','BRANCH','PORTAL','IMPORT')),
  sourced_by_employee_id uuid, sourcing_geo_point_id uuid,
  status app_status_t not null default 'DRAFT', current_workflow_instance_id uuid,
  submitted_at timestamptz, decided_at timestamptz, expires_at timestamptz,
  withdrawn_reason text, no_existing_loans_declared bool not null default false,
  legacy_payload jsonb not null default '{}',            -- raw values of live-form fields keyed by EXACT existing label (§17)
  client_uuid uuid unique,
  unique (org_id, application_no) );

create table application_snapshots ( id uuid primary key default gen_random_uuid(),
  application_id uuid not null references loan_applications, taken_at timestamptz not null default now(),
  taken_at_status app_status_t not null, snapshot jsonb not null, snapshot_hash text not null );

create table application_existing_loans ( /* STD */ application_id uuid not null references loan_applications,
  lender_name text not null,
  lender_type text not null check (lender_type in ('MFI','BANK','SHG_BANK_LINKAGE','MONEYLENDER','CHIT','OTHER')),
  outstanding numeric(18,2) not null, installment_amount numeric(18,2) not null, frequency frequency_t not null,
  overdue_flag bool not null default false, source text not null check (source in ('SELF_DECLARED','BUREAU')) );

create table loan_parties ( /* STD */ application_id uuid references loan_applications, loan_id uuid,
  customer_id uuid references customers, household_member_id uuid references household_members,
  role text not null check (role in ('BORROWER','CO_BORROWER','GUARANTOR','NOMINEE')), share_percent numeric(5,2),
  check ((customer_id is null) <> (household_member_id is null)) );

create table document_checklist_items ( /* STD */ product_version_id uuid not null references loan_product_versions,
  doc_category text not null, mandatory bool not null, required_by_status app_status_t not null default 'SUBMITTED' );

create table application_documents ( /* STD */ application_id uuid not null references loan_applications,
  checklist_item_id uuid references document_checklist_items, document_id uuid not null references documents,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','REJECTED')), remark text );

create table consent_templates ( /* STD */ consent_type text not null, language text not null, version_no int not null,
  body text not null, effective_from date not null, unique (org_id, consent_type, language, version_no) );

create table application_consents ( /* STD */ application_id uuid references loan_applications, customer_id uuid not null,
  consent_type text not null check (consent_type in ('DATA_PROCESSING','BUREAU_PULL','TERMS','KFS_ACK','INSURANCE','AGREEMENT')),
  template_id uuid not null references consent_templates, accepted_at timestamptz not null,
  method text not null check (method in ('OTP','SIGNATURE','THUMB_IMPRESSION','CLICK')),
  evidence_document_id uuid references documents, captured_by uuid );

create table application_eligibility_results ( id uuid primary key default gen_random_uuid(),
  application_id uuid not null references loan_applications, rule_code text not null,
  result text not null check (result in ('PASS','FAIL','WARN')), message text not null,
  evaluated_at timestamptz not null default now(), overridden_by uuid, override_reason text );

-- ---------- Workflow engine ----------
create table workflow_definitions ( /* STD */ entity_type text not null,   -- LOAN_APPLICATION, EXPENSE, TRANSFER, REVERSAL, WAIVER, WRITE_OFF, RESCHEDULE, RECON_VARIANCE, DISBURSEMENT, REFUND
  code text not null, version_no int not null, status text not null default 'ACTIVE', unique (org_id, code, version_no) );

create table workflow_stages ( id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references workflow_definitions, code text not null, name text not null, sequence int not null,
  stage_type text not null check (stage_type in ('TASK','APPROVAL','PARALLEL_APPROVAL')),
  required_permission text not null, min_approvals int not null default 1,
  assignment_strategy text not null default 'ROLE_POOL'
     check (assignment_strategy in ('ROLE_POOL','BRANCH_MANAGER_OF_RECORD','SPECIFIC_USER','ROUND_ROBIN','LEAST_LOADED')),
  assignee_role_id uuid, sla_hours int, entry_condition jsonb, unique (definition_id, code) );

create table workflow_transitions ( id uuid primary key default gen_random_uuid(),
  definition_id uuid not null references workflow_definitions,
  from_code text not null,           -- a stage code or entity status
  action wf_action_t not null, to_code text not null,
  required_permission text not null, comment_required bool not null default false,
  reason_code_required bool not null default false, unique (definition_id, from_code, action) );

create table approval_matrix ( /* STD */ definition_id uuid not null references workflow_definitions,
  product_id uuid, branch_id uuid, amount_from numeric(18,2) not null, amount_to numeric(18,2),   -- null = infinity
  required_stage_codes text[] not null, effective_from date not null, effective_to date );

create table workflow_instances ( /* STD */ definition_id uuid not null references workflow_definitions,
  entity_type text not null, entity_id uuid not null, branch_id uuid,
  route text[] not null,             -- frozen stage codes at submission
  current_stage_code text, status text not null check (status in ('RUNNING','COMPLETED','TERMINATED')),
  amount_under_decision numeric(18,2), started_at timestamptz not null default now(), completed_at timestamptz );

create table workflow_tasks ( /* STD */ instance_id uuid not null references workflow_instances, stage_code text not null,
  assigned_user_id uuid, assigned_role_id uuid,
  status text not null default 'OPEN' check (status in ('OPEN','CLAIMED','DONE','CANCELLED','ESCALATED')),
  due_at timestamptz, claimed_at timestamptz, completed_at timestamptz );

create table workflow_actions ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  instance_id uuid not null references workflow_instances, task_id uuid references workflow_tasks,
  actor_user_id uuid not null, on_behalf_of_user_id uuid, action wf_action_t not null,
  reason_code text, comment text, target_stage_code text, entity_snapshot_hash text not null,
  acted_at timestamptz not null default now() );   -- append-only

create table reason_codes ( /* STD */ category text not null, code text not null, label_en text not null, label_ta text,
  active bool not null default true, unique (org_id, category, code) );

-- ---------- Verification & credit ----------
create table field_verifications ( /* STD */ branch_id uuid not null, application_id uuid not null references loan_applications,
  assigned_to_employee_id uuid not null, assigned_by uuid not null, assigned_at timestamptz not null default now(),
  scheduled_date date, visited_at timestamptz, geo_point_id uuid, distance_from_address_m numeric(10,2),
  person_met text, status text not null default 'ASSIGNED'
     check (status in ('ASSIGNED','IN_PROGRESS','SUBMITTED','REASSIGNED','CANCELLED')),
  result text check (result in ('VERIFIED','PARTIALLY_VERIFIED','NOT_VERIFIED')),
  recommendation text check (recommendation in ('RECOMMEND','RECOMMEND_WITH_CONDITIONS','NOT_RECOMMEND')),
  recommended_amount numeric(18,2), remarks text, client_uuid uuid unique );

create table verification_checklist_items ( /* STD */ code text not null,
  section text not null check (section in ('ADDRESS','IDENTITY','OCCUPATION','INCOME','GROUP','REFERENCE','EXISTING_LOANS','RESIDENCE')),
  question_en text not null, question_ta text, answer_type text not null, mandatory bool not null, active bool not null default true );

create table verification_answers ( id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references field_verifications, item_id uuid not null references verification_checklist_items,
  answer jsonb not null, verified_value text, matches_declared bool, remark text );

create table verification_media ( id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references field_verifications, document_id uuid not null references documents,
  media_type text not null check (media_type in ('HOUSE','BUSINESS','CUSTOMER','DOCUMENT','OTHER')) );

create table credit_assessments ( /* STD */ application_id uuid not null references loan_applications, assessed_by uuid not null,
  household_income numeric(18,2) not null, obligations_incl_proposed numeric(18,2) not null,
  obligation_to_income_ratio numeric(9,4) not null, active_lenders_count int, bureau_pull_id uuid,
  bureau_summary jsonb, attendance_percent numeric(5,2), risk_grade text,
  recommended_amount numeric(18,2), recommended_tenure int, conditions text, notes text );

-- ---------- Sanction ----------
create table sanctions ( /* STD */ branch_id uuid not null, sanction_no text not null,
  application_id uuid not null unique references loan_applications,
  product_version_id uuid not null references loan_product_versions,
  sanctioned_amount numeric(18,2) not null, tenure int not null, tenure_unit tenure_unit_t not null,
  frequency frequency_t not null, interest_method interest_method_t not null, interest_rate numeric(9,6) not null,
  total_upfront_deductions numeric(18,2) not null, net_disbursement_amount numeric(18,2) not null,
  total_interest numeric(18,2) not null, total_repayable numeric(18,2) not null, apr_percent numeric(9,4) not null,
  draft_schedule jsonb not null, sanctioned_by uuid not null, sanctioned_at timestamptz not null default now(),
  valid_until date not null, customer_acceptance_consent_id uuid references application_consents,
  status sanction_status_t not null default 'ISSUED',
  check (net_disbursement_amount = sanctioned_amount - total_upfront_deductions),
  unique (org_id, sanction_no) );

create table sanction_charges ( id uuid primary key default gen_random_uuid(),
  sanction_id uuid not null references sanctions, charge_type_id uuid not null references charge_types,
  amount numeric(18,2) not null, gst_amount numeric(18,2) not null default 0,
  collect_at text not null );

create table sanction_conditions ( id uuid primary key default gen_random_uuid(),
  sanction_id uuid not null references sanctions, condition_text text not null,
  fulfilled bool not null default false, fulfilled_by uuid, fulfilled_at timestamptz );
```

### 6.9 Loans, disbursement, schedule

```sql
create table loan_accounts ( /* STD */ branch_id uuid not null, loan_no text not null,
  application_id uuid not null unique references loan_applications, sanction_id uuid not null unique references sanctions,
  customer_id uuid references customers, borrower_group_id uuid references shg_groups, sub_group_id uuid references sub_groups,
  collection_group_id uuid references shg_groups, product_version_id uuid not null references loan_product_versions,
  loan_cycle int not null, sanctioned_amount numeric(18,2) not null, disbursed_amount numeric(18,2) not null default 0,
  interest_method interest_method_t not null, interest_rate numeric(9,6) not null, apr_percent numeric(9,4) not null,
  tenure int not null, tenure_unit tenure_unit_t not null, frequency frequency_t not null,
  disbursed_on date, first_due_date date, maturity_date date, current_schedule_version_id uuid,
  status loan_status_t not null default 'PENDING_DISBURSEMENT', status_changed_at timestamptz,
  closed_on date, closure_type text check (closure_type in ('NORMAL','PREPAID','WRITTEN_OFF','DEATH_CLAIM','CANCELLED')),
  npa_since date, is_restructured bool not null default false, legacy_loan_ref text,
  unique (org_id, loan_no) );

-- Cached balances, refreshed in every posting transaction; nightly job recomputes & compares
create table loan_balances ( loan_id uuid primary key references loan_accounts, org_id uuid not null, branch_id uuid not null,
  principal_outstanding numeric(18,2) not null default 0, interest_due numeric(18,2) not null default 0,
  penalty_due numeric(18,2) not null default 0, charges_due numeric(18,2) not null default 0,
  advance_balance numeric(18,2) not null default 0, overdue_amount numeric(18,2) not null default 0,
  overdue_principal numeric(18,2) not null default 0, dpd int not null default 0, dpd_bucket text,
  total_paid numeric(18,2) not null default 0, last_payment_date date,
  next_due_date date, next_due_amount numeric(18,2), as_of_business_date date not null,
  updated_at timestamptz not null default now() );

create table disbursements ( /* STD */ branch_id uuid not null, disbursement_no text not null,
  loan_id uuid not null references loan_accounts, sanction_id uuid not null references sanctions,
  business_date date not null, gross_amount numeric(18,2) not null, deductions_total numeric(18,2) not null,
  net_amount numeric(18,2) not null,
  method text not null check (method in ('CASH','BANK_TRANSFER','CHEQUE','UPI_MANUAL','OTHER')),
  financial_account_id uuid not null, payee_name text not null, payee_account_masked text, payee_account_encrypted bytea,
  payee_ifsc text, instrument_no text, utr_reference text,
  status disb_status_t not null default 'INITIATED', initiated_by uuid not null, approved_by uuid, paid_by uuid,
  paid_at timestamptz, customer_ack_document_id uuid, proof_document_id uuid, journal_entry_id uuid,
  check (net_amount = gross_amount - deductions_total), check (approved_by is null or approved_by <> initiated_by),
  unique (org_id, disbursement_no) );

create table disbursement_deductions ( id uuid primary key default gen_random_uuid(),
  disbursement_id uuid not null references disbursements, charge_type_id uuid not null references charge_types,
  amount numeric(18,2) not null, gst_amount numeric(18,2) not null default 0 );

create table schedule_versions ( /* STD */ loan_id uuid not null references loan_accounts, version_no int not null,
  reason text not null check (reason in ('ORIGINAL','RESCHEDULE','RESTRUCTURE','MORATORIUM','PREPAYMENT_REAMORTISE','MIGRATION')),
  effective_from_installment int not null, workflow_instance_id uuid, approved_by uuid,
  is_current bool not null default true, unique (loan_id, version_no) );
create unique index one_current_schedule on schedule_versions (loan_id) where is_current;

create table repayment_installments ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  schedule_version_id uuid not null references schedule_versions, loan_id uuid not null references loan_accounts,
  installment_no int not null, due_date date not null, original_due_date date not null,
  opening_principal numeric(18,2) not null, scheduled_principal numeric(18,2) not null,
  scheduled_interest numeric(18,2) not null, scheduled_charges numeric(18,2) not null default 0,
  scheduled_total numeric(18,2) generated always as (scheduled_principal + scheduled_interest + scheduled_charges) stored,
  closing_principal numeric(18,2) not null,
  paid_principal numeric(18,2) not null default 0, paid_interest numeric(18,2) not null default 0,
  paid_penalty numeric(18,2) not null default 0, paid_charges numeric(18,2) not null default 0,
  waived_principal numeric(18,2) not null default 0, waived_interest numeric(18,2) not null default 0,
  waived_penalty numeric(18,2) not null default 0, penalty_accrued numeric(18,2) not null default 0,
  status inst_status_t not null default 'UPCOMING', fully_paid_on date,
  unique (schedule_version_id, installment_no),
  check (paid_principal + waived_principal <= scheduled_principal),
  check (paid_interest + waived_interest <= scheduled_interest) );
create index on repayment_installments (loan_id, due_date) where status not in ('PAID','WAIVED','SUPERSEDED');

create table installment_allocations ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  installment_id uuid not null references repayment_installments, loan_id uuid not null,
  source_type text not null check (source_type in ('COLLECTION','ADVANCE_APPLICATION','WAIVER','MIGRATION')),
  source_id uuid not null, component component_t not null,
  amount numeric(18,2) not null,     -- negative only for reversal rows
  reverses_allocation_id uuid references installment_allocations, allocated_at timestamptz not null default now() );

create table penalty_accruals ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  loan_id uuid not null, installment_id uuid not null references repayment_installments, accrual_date date not null,
  basis_amount numeric(18,2) not null, rate_or_amount numeric(18,6) not null, amount numeric(18,2) not null,
  journal_entry_id uuid, unique (installment_id, accrual_date) );

create table loan_events ( /* STD */ loan_id uuid not null references loan_accounts,
  event_type text not null check (event_type in ('RESCHEDULE','RESTRUCTURE','MORATORIUM','PREPAYMENT','FORECLOSURE',
     'WAIVER','WRITE_OFF','DEATH_CLAIM','TRANSFER_COLLECTION_GROUP','CLOSURE')),
  business_date date not null, details jsonb not null, reason_code text not null,
  workflow_instance_id uuid, status text not null, journal_entry_id uuid );

create table foreclosure_quotes ( /* STD */ loan_id uuid not null, quote_date date not null, valid_until date not null,
  principal numeric(18,2) not null, interest numeric(18,2) not null, penalty numeric(18,2) not null,
  charges numeric(18,2) not null, less_advance numeric(18,2) not null, total numeric(18,2) not null );
```

### 6.10 Collections, receipts, reversals

```sql
create table payment_modes ( /* STD */ code text not null,          -- CASH, BANK_TRANSFER, CHEQUE, UPI_MANUAL, OTHER
  name text not null, requires_reference bool not null, requires_verification bool not null,
  allocate_on text not null default 'CAPTURE' check (allocate_on in ('CAPTURE','VERIFICATION')),   -- CONFIRM per mode
  clearing_financial_account_id uuid, allowed_for_agents bool not null default true, active bool not null default true,
  unique (org_id, code) );

create table collection_sheets ( /* STD */ branch_id uuid not null, sheet_no text not null,
  group_id uuid not null references shg_groups, meeting_id uuid references group_meetings,
  collection_plan_id uuid, agent_employee_id uuid not null, business_date date not null,
  expected_total numeric(18,2) not null, collected_total numeric(18,2) not null,
  cash_total numeric(18,2) not null, non_cash_total numeric(18,2) not null,
  denominations jsonb,               -- {"500":40,"200":10,...}; must sum to cash_total
  geo_point_id uuid, photo_document_id uuid,
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','POSTED','RECONCILED','PARTIALLY_REVERSED')),
  client_uuid uuid unique, unique (org_id, sheet_no),
  check (collected_total = cash_total + non_cash_total) );

create table collections ( /* STD */ branch_id uuid not null, collection_no text not null,
  sheet_id uuid references collection_sheets, plan_item_id uuid,
  loan_id uuid not null references loan_accounts, customer_id uuid, agent_employee_id uuid,
  business_date date not null, collected_at timestamptz not null, amount numeric(18,2) not null check (amount > 0),
  payment_mode_id uuid not null references payment_modes, financial_account_id uuid not null,
  instrument_no text, utr_reference text, upi_reference text,
  payer_type text not null default 'SELF' check (payer_type in ('SELF','GROUP','FAMILY','OTHER')),
  geo_point_id uuid, location_permission text,
  client_uuid uuid not null unique,  -- idempotency
  verification_status verif_status_t not null, verified_by uuid, verified_at timestamptz,
  status collection_status_t not null default 'CAPTURED', receipt_id uuid, journal_entry_id uuid,
  allocation_breakup jsonb,          -- denormalised copy of allocation for display
  remark text, unique (org_id, collection_no) );
create index on collections (loan_id, business_date);
create index on collections (agent_employee_id, business_date);
-- Trigger: sum(collections.amount where sheet_id = X and status<>'REVERSED') must equal collection_sheets.collected_total at POSTED.

create table receipts ( /* STD */ branch_id uuid not null, receipt_no text not null,
  collection_id uuid not null unique references collections, customer_id uuid, loan_id uuid not null,
  amount numeric(18,2) not null, amount_in_words_en text not null, amount_in_words_ta text,
  breakup jsonb not null,            -- {principal, interest, penalty, charges, advance}
  status text not null default 'ISSUED' check (status in ('ISSUED','CANCELLED')),
  cancelled_by_reversal_id uuid, issued_at timestamptz not null default now(),
  pdf_document_id uuid, unique (org_id, receipt_no) );

create table reversals ( /* STD */ branch_id uuid not null, reversal_no text not null,
  target_type text not null check (target_type in ('COLLECTION','DISBURSEMENT','EXPENSE','TRANSFER','JOURNAL','COLLECTION_SHEET')),
  target_id uuid not null, reason_code text not null, explanation text not null,
  requested_by uuid not null, workflow_instance_id uuid, approved_by uuid,
  status text not null default 'REQUESTED' check (status in ('REQUESTED','APPROVED','REJECTED','POSTED')),
  reversal_journal_entry_id uuid, replacement_target_id uuid, posted_business_date date,
  check (approved_by is null or approved_by <> requested_by), unique (org_id, reversal_no) );
create unique index one_active_reversal on reversals (target_type, target_id) where status in ('REQUESTED','APPROVED','POSTED');
```

### 6.11 Financial accounts and double-entry ledger

```sql
create table gl_accounts ( /* STD */ code text not null, name text not null, gl_type gl_type_t not null,
  parent_id uuid references gl_accounts, is_control bool not null default false, is_postable bool not null default true,
  normal_balance text not null check (normal_balance in ('DEBIT','CREDIT')),
  status record_status not null default 'ACTIVE', unique (org_id, code) );

create table financial_accounts ( /* STD */ branch_id uuid,           -- null = head office
  code text not null, name text not null, account_kind fin_account_kind_t not null,
  bank_name text, bank_branch text, account_number_encrypted bytea, account_number_masked text,
  ifsc text check (ifsc is null or ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'), account_holder_name text, upi_id text,
  gl_account_id uuid not null unique references gl_accounts,          -- 1:1 sub-ledger mapping
  opening_balance numeric(18,2) not null default 0, opening_balance_date date not null,
  allow_negative bool not null default false, custodian_employee_id uuid,
  imprest_limit numeric(18,2),                        -- petty cash float for CASH accounts used as petty cash
  status text not null default 'ACTIVE' check (status in ('ACTIVE','FROZEN','CLOSED')),
  default_for text[] not null default '{}',                          -- DISBURSEMENT, COLLECTION, EXPENSE
  unique (org_id, code) );
-- NEVER bank_account_1/_2/_3 columns anywhere. Every money movement references financial_account_id.

create table journal_entries ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  branch_id uuid not null, entry_no text not null, business_date date not null, entry_type journal_type_t not null,
  source_type text not null, source_id uuid not null, narration text not null,
  reverses_entry_id uuid references journal_entries, reversed_by_entry_id uuid references journal_entries,
  posted_by uuid not null, posted_at timestamptz not null default now(), approved_by uuid,
  unique (org_id, entry_no) );
create index on journal_entries (source_type, source_id);

create table journal_lines ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  entry_id uuid not null references journal_entries, line_no int not null,
  gl_account_id uuid not null references gl_accounts, financial_account_id uuid references financial_accounts,
  debit numeric(18,2) not null default 0, credit numeric(18,2) not null default 0,
  branch_id uuid not null, business_date date not null,
  loan_id uuid, customer_id uuid, group_id uuid, agent_employee_id uuid, memo text,
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0)),
  unique (entry_id, line_no) );
create index on journal_lines (gl_account_id, business_date);
create index on journal_lines (financial_account_id, business_date);
create index on journal_lines (loan_id);

-- Balanced-entry guarantee
create function assert_entry_balanced() returns trigger language plpgsql as $$
declare d numeric; c numeric; eid uuid := coalesce(new.entry_id, old.entry_id);
begin
  select coalesce(sum(debit),0), coalesce(sum(credit),0) into d, c from journal_lines where entry_id = eid;
  if d <> c or d = 0 then raise exception 'Journal entry % unbalanced: debit %, credit %', eid, d, c; end if;
  return null;
end $$;
create constraint trigger trg_entry_balanced after insert on journal_lines
  deferrable initially deferred for each row execute function assert_entry_balanced();

-- Immutability: block UPDATE/DELETE on journal_lines; allow only reversed_by_entry_id on journal_entries
create function forbid_mutation() returns trigger language plpgsql as $$
begin raise exception 'Financial rows are immutable (%). Use a reversal.', tg_table_name; end $$;
create trigger trg_lines_immutable before update or delete on journal_lines for each row execute function forbid_mutation();
create function only_reversal_link() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'journal_entries cannot be deleted'; end if;
  if (to_jsonb(new) - 'reversed_by_entry_id') <> (to_jsonb(old) - 'reversed_by_entry_id') then
    raise exception 'journal_entries are immutable except reversed_by_entry_id'; end if;
  return new;
end $$;
create trigger trg_entries_immutable before update or delete on journal_entries for each row execute function only_reversal_link();

-- Closed-day guard (applies to journal_lines, collections, disbursements, expenses, transfers)
create function assert_day_open() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from business_days where branch_id = new.branch_id and business_date = new.business_date
                 and status in ('OPEN','REOPENED')) then
    raise exception 'Business day % for branch % is not open', new.business_date, new.branch_id; end if;
  return new;
end $$;
-- Attach AFTER business_days (6.13) exists:
-- create trigger trg_day_open before insert on journal_lines      for each row execute function assert_day_open();
-- create trigger trg_day_open before insert on collections        for each row execute function assert_day_open();
-- create trigger trg_day_open before insert on disbursements      for each row execute function assert_day_open();
-- create trigger trg_day_open before insert on expenses           for each row execute function assert_day_open();
-- create trigger trg_day_open before insert on account_transfers  for each row execute function assert_day_open();
-- (Migration of historical/opening data runs with a dedicated role that uses an OPENING business day, not by disabling triggers.)

create table account_balance_snapshots ( org_id uuid not null, gl_account_id uuid not null,
  financial_account_id uuid, branch_id uuid not null, business_date date not null,
  closing_debit_total numeric(18,2) not null, closing_credit_total numeric(18,2) not null,
  closing_balance numeric(18,2) not null, primary key (gl_account_id, branch_id, business_date) );
-- Balance(any date) = last snapshot <= date + lines after it. Snapshots are rebuilt, never edited.

-- Office expenses: see §6.16 for vendors, premises, utilities, recurring templates, budgets, payroll.
create table expense_categories ( /* STD */ code text not null, name text not null, name_ta text,
  category_group text not null check (category_group in ('PAYROLL','PREMISES','UTILITIES','TRAVEL','OFFICE',
     'IT_COMMUNICATION','PROFESSIONAL','FINANCE_CHARGES','STATUTORY','MARKETING','CAPITAL','OTHER')),
  gl_account_id uuid not null,
  is_capital bool not null default false,              -- posts to fixed-asset GL, not expense
  requires_vendor bool not null default false, requires_bill_above numeric(18,2),
  requires_period bool not null default false,         -- rent/EB/internet need period_from/to
  tds_section_code text, default_tds_percent numeric(5,2),   -- CONFIRM with accountant; never hardcode
  gst_claimable bool not null default false,
  workflow_definition_id uuid, active bool not null default true, unique (org_id, code) );

create table expenses ( /* STD */ branch_id uuid not null, expense_no text not null,
  category_id uuid not null references expense_categories,
  expense_kind text not null default 'DIRECT' check (expense_kind in ('DIRECT','BILL','PETTY_CASH','REIMBURSEMENT','RECURRING')),
  business_date date not null,
  vendor_id uuid,                                      -- §6.16 vendors (landlord, EB, supplier...)
  premises_id uuid, utility_connection_id uuid, recurring_template_id uuid,
  employee_id uuid,                                    -- for staff reimbursements (fuel, travel)
  period_from date, period_to date,                    -- e.g. rent for Oct-2026, EB for Aug–Sep
  bill_no text, bill_date date, due_date date,
  meter_reading_previous numeric(12,2), meter_reading_current numeric(12,2),
  units_consumed numeric(12,2) generated always as (meter_reading_current - meter_reading_previous) stored,
  amount numeric(18,2) not null check (amount > 0),    -- taxable/base amount
  gst_amount numeric(18,2) not null default 0, tds_amount numeric(18,2) not null default 0,
  late_fee_amount numeric(18,2) not null default 0,
  net_payable numeric(18,2) generated always as (amount + gst_amount + late_fee_amount - tds_amount) stored,
  payee_name text not null, description text not null,
  financial_account_id uuid,                           -- paid from (required at PAID)
  payment_mode_code text, reference_no text, paid_on date,
  bill_document_id uuid, payment_proof_document_id uuid,
  budget_status text check (budget_status in ('WITHIN','EXCEEDED','NO_BUDGET')),
  entered_by uuid not null, approved_by uuid, paid_by uuid,
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','APPROVED','REJECTED','PAID','REVERSED','CANCELLED')),
  workflow_instance_id uuid, accrual_journal_entry_id uuid, journal_entry_id uuid, client_uuid uuid unique,
  check (approved_by is null or approved_by <> entered_by),
  check (period_to is null or period_from <= period_to),
  unique (org_id, expense_no) );
create unique index no_duplicate_bill on expenses (vendor_id, bill_no) where bill_no is not null and status <> 'CANCELLED';
create unique index one_rent_per_period on expenses (premises_id, category_id, period_from)
  where premises_id is not null and status not in ('CANCELLED','REJECTED','REVERSED');

create table account_transfers ( /* STD */ branch_id uuid not null, transfer_no text not null,
  from_financial_account_id uuid not null, to_financial_account_id uuid not null,
  amount numeric(18,2) not null check (amount > 0), business_date date not null,
  purpose text not null check (purpose in ('CASH_DEPOSIT_TO_BANK','BANK_WITHDRAWAL','BRANCH_FUNDING','AGENT_HANDOVER','INTER_BRANCH','OTHER')),
  reference_no text, deposit_slip_document_id uuid, created_by uuid not null, approved_by uuid, received_by uuid,
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','APPROVED','IN_TRANSIT','COMPLETED','REJECTED','REVERSED')),
  journal_entry_id uuid, receipt_journal_entry_id uuid,
  check (from_financial_account_id <> to_financial_account_id), check (approved_by is null or approved_by <> created_by),
  unique (org_id, transfer_no) );
```

### 6.12 Agents, assignments, plans, location

```sql
create table agent_profiles ( employee_id uuid primary key references employees, org_id uuid not null,
  cash_account_id uuid not null unique references financial_accounts,   -- AGENT_CASH account "Cash in hand – <agent>"
  can_collect_non_cash bool not null default true, can_disburse_cash bool not null default false,
  device_binding_required bool not null default true, updated_at timestamptz not null default now() );
-- monetary limits live in business_limits (CASH_HOLDING, COLLECTION_PER_TXN, COLLECTION_PER_DAY)

create table agent_assignments ( /* STD */ agent_employee_id uuid not null references employees,
  scope_type text not null check (scope_type in ('AREA','CENTER','GROUP','LOAN')), scope_id uuid not null,
  assignment_role text not null default 'PRIMARY' check (assignment_role in ('PRIMARY','BACKUP')),
  valid_from date not null, valid_to date, assigned_by uuid not null, reason text not null, batch_id uuid );
create unique index one_primary_assignment on agent_assignments (scope_type, scope_id)
  where assignment_role = 'PRIMARY' and valid_to is null;

create table collection_plans ( /* STD */ branch_id uuid not null, plan_no text not null,
  agent_employee_id uuid not null, plan_date date not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','IN_PROGRESS','CLOSED')),
  generated_by text not null check (generated_by in ('SYSTEM','USER')), unique (agent_employee_id, plan_date) );

create table collection_plan_items ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  plan_id uuid not null references collection_plans, group_id uuid, meeting_id uuid, loan_id uuid not null,
  customer_id uuid, sequence int not null, due_amount numeric(18,2) not null, overdue_amount numeric(18,2) not null,
  expected_amount numeric(18,2) not null,
  outcome text not null default 'PENDING' check (outcome in ('PENDING','COLLECTED','PARTIAL','NOT_PAID','SKIPPED','CUSTOMER_ABSENT','PROMISE_TO_PAY')),
  collected_amount numeric(18,2) not null default 0, promise_date date, reason_code text, visited_geo_point_id uuid );

create table agent_location_events ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  employee_id uuid not null, device_id uuid,
  event_type text not null,          -- LOGIN, VERIFICATION_VISIT, GROUP_MEETING, COLLECTION, CUSTOMER_VISIT, CASH_HANDOVER, configured others
  entity_type text, entity_id uuid, geo_point_id uuid,
  permission_state text not null check (permission_state in ('GRANTED','DENIED','UNAVAILABLE')),
  captured_at timestamptz not null );
-- Retention job deletes rows older than setting location.retention_days unless linked to a financial record.
```

### 6.13 Reconciliation and business days

```sql
create table business_days ( /* STD */ branch_id uuid not null references branches, business_date date not null,
  status day_status_t not null default 'OPEN', opened_by uuid not null, opened_at timestamptz not null default now(),
  closed_by uuid, closed_at timestamptz, close_checklist jsonb,
  reopen_reason text, reopened_by uuid, reopen_approved_by uuid, unique (branch_id, business_date) );
create unique index one_open_day on business_days (branch_id) where status in ('OPEN','CLOSING','REOPENED');

create table agent_cash_handovers ( /* STD */ branch_id uuid not null, handover_no text not null,
  agent_employee_id uuid not null, business_date date not null,
  expected_cash numeric(18,2) not null,            -- ledger balance of agent cash account
  declared_cash numeric(18,2) not null, counted_cash numeric(18,2) not null, denominations jsonb not null,
  difference numeric(18,2) generated always as (counted_cash - expected_cash) stored,
  received_by uuid not null, to_financial_account_id uuid not null,
  status text not null check (status in ('PENDING','MATCHED','VARIANCE_PENDING_APPROVAL','APPROVED','REJECTED')),
  variance_id uuid, journal_entry_id uuid, check (received_by <> agent_employee_id) );

create table reconciliation_variances ( /* STD */ branch_id uuid not null, variance_no text not null,
  recon_type text not null check (recon_type in ('AGENT_CASH','BRANCH_CASH','BANK','OPENING_BALANCE')),
  reference_type text not null, reference_id uuid not null,
  expected numeric(18,2) not null, actual numeric(18,2) not null,
  difference numeric(18,2) generated always as (actual - expected) stored,
  reason_code text not null, explanation text not null, responsible_employee_id uuid,
  resolution text check (resolution in ('RECOVER_FROM_EMPLOYEE','WRITE_OFF','INVESTIGATE','CORRECTED_BY_REVERSAL')),
  workflow_instance_id uuid, status text not null default 'PENDING_APPROVAL', journal_entry_id uuid );

create table branch_cash_counts ( /* STD */ branch_id uuid not null, financial_account_id uuid not null,
  business_date date not null, ledger_balance numeric(18,2) not null, counted numeric(18,2) not null,
  denominations jsonb not null, counted_by uuid not null, witnessed_by uuid not null, variance_id uuid,
  check (witnessed_by <> counted_by) );

create table bank_statements ( /* STD */ financial_account_id uuid not null, period_from date not null, period_to date not null,
  document_id uuid not null, format_code text not null, opening_balance numeric(18,2), closing_balance numeric(18,2),
  uploaded_by uuid not null, status text not null default 'PARSED' );
create table bank_statement_lines ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  statement_id uuid not null references bank_statements, txn_date date not null, value_date date,
  description text, reference text, debit numeric(18,2) not null default 0, credit numeric(18,2) not null default 0,
  balance numeric(18,2), match_status text not null default 'UNMATCHED' check (match_status in ('UNMATCHED','MATCHED','IGNORED','CONVERTED')) );
create table bank_recon_matches ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  statement_line_id uuid not null references bank_statement_lines, journal_line_id uuid not null references journal_lines,
  match_type text not null check (match_type in ('AUTO','MANUAL')), matched_by uuid, matched_at timestamptz not null default now() );
```

### 6.14 Config, lookups, numbering, notifications, audit, imports, grievances, portal

```sql
create table lookup_values ( /* STD */ list_code text not null, code text not null, label_en text not null, label_ta text,
  sort_order int not null default 0, active bool not null default true, source text not null default 'SYSTEM',  -- LIVE_APP for migrated options
  unique (org_id, list_code, code) );

create table system_settings ( /* STD */ branch_id uuid, key text not null, value jsonb not null,
  effective_from date not null default current_date, unique (org_id, branch_id, key, effective_from) );

create table number_series ( /* STD */ branch_id uuid, series_type text not null, fiscal_year text not null,
  prefix_pattern text not null,       -- e.g. 'RCT/{BRANCH}/{FY}/' ; FY = '2627'
  next_value bigint not null default 1, padding int not null default 6,
  unique (org_id, branch_id, series_type, fiscal_year) );

create table notification_templates ( /* STD */ event_code text not null,
  channel text not null check (channel in ('SMS','WHATSAPP','PUSH','IN_APP')), language text not null,
  body text not null, dlt_template_id text, active bool not null default true, unique (org_id, event_code, channel, language) );
create table notification_rules ( /* STD */ event_code text not null, audience text not null, offset_days int default 0,
  send_window_start time, send_window_end time, enabled bool not null default true );
create table notifications ( id uuid primary key default gen_random_uuid(), org_id uuid not null,
  recipient_type text not null, recipient_id uuid not null, channel text not null, template_id uuid, payload jsonb not null,
  status text not null default 'QUEUED' check (status in ('QUEUED','SENT','FAILED','DELIVERED','SUPPRESSED')),
  provider_ref text, attempts int not null default 0, scheduled_for timestamptz not null default now(),
  sent_at timestamptz, read_at timestamptz );

create table audit_log ( id bigserial, org_id uuid not null, occurred_at timestamptz not null default now(),
  actor_user_id uuid, actor_roles text[], on_behalf_of uuid, action text not null,
  entity_type text not null, entity_id uuid, before jsonb, after jsonb, changed_fields text[],
  request_id text, ip inet, user_agent text, device_id uuid, geo_point_id uuid, authz_rule text,
  primary key (id, occurred_at) ) partition by range (occurred_at);   -- monthly partitions via job
create table sensitive_access_log ( id bigserial primary key, org_id uuid not null, occurred_at timestamptz not null default now(),
  user_id uuid not null, entity_type text not null, entity_id uuid not null, field text not null, purpose text );
create table auth_events ( id bigserial primary key, org_id uuid, occurred_at timestamptz not null default now(),
  user_id uuid, event text not null, success bool not null, ip inet, user_agent text, detail jsonb );
create table export_log ( id bigserial primary key, org_id uuid not null, occurred_at timestamptz not null default now(),
  user_id uuid not null, report_code text not null, filters jsonb, row_count int, file_sha256 text );
create table idempotency_keys ( key uuid primary key, org_id uuid not null, user_id uuid not null, route text not null,
  request_hash text not null, response_status int, response_body jsonb, created_at timestamptz not null default now() );

create table customer_users ( auth_user_id uuid primary key, org_id uuid not null, customer_id uuid not null unique references customers,
  status text not null default 'ACTIVE', last_login_at timestamptz, created_at timestamptz not null default now() );
create table profile_change_requests ( /* STD */ customer_id uuid not null, requested_changes jsonb not null,
  status text not null default 'PENDING', decided_by uuid, decided_at timestamptz, decision_note text );
create table grievances ( /* STD */ branch_id uuid, grievance_no text not null, customer_id uuid, channel text not null,
  category_code text not null, description text not null, assigned_to uuid, status text not null default 'OPEN',
  resolution text, resolved_at timestamptz, escalated bool not null default false );

create table import_batches ( /* STD */ import_type text not null, document_id uuid not null, status text not null,
  total_rows int, valid_rows int, error_rows int, dry_run bool not null default true, committed_at timestamptz, committed_by uuid );
create table import_rows ( id bigserial primary key, batch_id uuid not null references import_batches, row_no int not null,
  raw jsonb not null, errors jsonb, created_entity_id uuid );
```

### 6.16 Office expenses, premises, utilities (EB), recurring bills, budgets, payroll

```sql
-- ---------- Payees / vendors ----------
create table vendors ( /* STD */ code text not null, name text not null,
  vendor_type text not null check (vendor_type in ('LANDLORD','ELECTRICITY_BOARD','WATER_BOARD','TELECOM_INTERNET',
     'SUPPLIER','SERVICE_PROVIDER','FUEL_STATION','PROFESSIONAL','GOVERNMENT','OTHER')),
  contact_person text, mobile text, email citext, address_id uuid,
  pan_encrypted bytea, pan_masked text, gstin text,
  bank_account_encrypted bytea, bank_account_masked text, ifsc text, upi_id text,
  default_category_id uuid references expense_categories, default_tds_percent numeric(5,2),
  status record_status not null default 'ACTIVE', deleted_at timestamptz, unique (org_id, code) );

-- ---------- Office premises & rent ----------
create table premises ( /* STD */ branch_id uuid not null references branches, name text not null,
  premises_type text not null check (premises_type in ('BRANCH_OFFICE','HEAD_OFFICE','GODOWN','OTHER')),
  address_id uuid not null, landlord_vendor_id uuid references vendors,
  ownership text not null check (ownership in ('RENTED','OWNED','FREE_OF_COST')),
  lease_start date, lease_end date, lock_in_months int, notice_period_days int,
  monthly_rent numeric(18,2), rent_due_day int check (rent_due_day between 1 and 31),
  maintenance_charge numeric(18,2) default 0,
  escalation_percent numeric(5,2), escalation_every_months int, next_escalation_date date,
  security_deposit_amount numeric(18,2) default 0, deposit_paid_on date, deposit_journal_entry_id uuid,
  agreement_document_id uuid, status text not null default 'ACTIVE' check (status in ('ACTIVE','VACATED')) );

create table premises_rent_history ( /* STD */ premises_id uuid not null references premises,
  monthly_rent numeric(18,2) not null, effective_from date not null, reason text not null );  -- escalations kept, never overwritten

-- ---------- Utility connections (EB / electricity, water, internet, phone) ----------
create table utility_connections ( /* STD */ branch_id uuid not null, premises_id uuid references premises,
  utility_type text not null check (utility_type in ('ELECTRICITY','WATER','INTERNET','LANDLINE','MOBILE','GAS','OTHER')),
  provider_vendor_id uuid not null references vendors,
  consumer_number text not null,                        -- EB service connection number / account id
  tariff_category text, sanctioned_load text,
  billing_cycle text not null check (billing_cycle in ('MONTHLY','BIMONTHLY','QUARTERLY','PREPAID')),  -- set per connection; do not assume
  paid_by text not null default 'COMPANY' check (paid_by in ('COMPANY','LANDLORD_INCLUDED_IN_RENT','SHARED')),
  share_percent numeric(5,2), deposit_amount numeric(18,2) default 0,
  last_meter_reading numeric(12,2), status record_status not null default 'ACTIVE',
  unique (org_id, provider_vendor_id, consumer_number) );

-- ---------- Recurring expenses (rent, EB, internet, salary-like fixed payments, subscriptions) ----------
create table recurring_expense_templates ( /* STD */ branch_id uuid not null, category_id uuid not null references expense_categories,
  vendor_id uuid references vendors, premises_id uuid references premises, utility_connection_id uuid references utility_connections,
  description text not null,
  amount_type text not null check (amount_type in ('FIXED','VARIABLE')),     -- rent FIXED, EB VARIABLE (amount entered from bill)
  fixed_amount numeric(18,2), frequency text not null check (frequency in ('MONTHLY','BIMONTHLY','QUARTERLY','HALF_YEARLY','YEARLY')),
  due_day int, start_date date not null, end_date date,
  create_days_before_due int not null default 5, default_financial_account_id uuid,
  last_generated_period_to date, active bool not null default true );

-- ---------- Budgets ----------
create table expense_budgets ( /* STD */ branch_id uuid, category_id uuid not null references expense_categories,
  fiscal_year text not null, month int check (month between 1 and 12),   -- null month = annual
  amount numeric(18,2) not null, over_budget_action text not null default 'REQUIRE_EXTRA_APPROVAL'
     check (over_budget_action in ('WARN','REQUIRE_EXTRA_APPROVAL','BLOCK')),
  unique (org_id, branch_id, category_id, fiscal_year, month) );

-- ---------- Payroll ----------
create table pay_components ( /* STD */ code text not null, name text not null,
  component_type text not null check (component_type in ('EARNING','DEDUCTION','EMPLOYER_CONTRIBUTION','REIMBURSEMENT')),
  calc_method text not null check (calc_method in ('FIXED','PERCENT_OF_BASIC','PERCENT_OF_GROSS','MANUAL','FORMULA_REF')),
  default_value numeric(18,6), is_statutory bool not null default false,   -- PF, ESI, PT, TDS: rates in settings, CONFIRM
  prorate_by_paid_days bool not null default true, taxable bool not null default true,
  gl_account_id uuid not null, sort_order int not null default 0, active bool not null default true, unique (org_id, code) );
-- seed: BASIC, HRA, CONVEYANCE, SPECIAL_ALLOWANCE, FIELD_ALLOWANCE, COLLECTION_INCENTIVE, BONUS, OVERTIME,
--       PF_EMPLOYEE, ESI_EMPLOYEE, PROFESSIONAL_TAX, TDS_SALARY, ADVANCE_RECOVERY, OTHER_DEDUCTION,
--       PF_EMPLOYER, ESI_EMPLOYER, FUEL_REIMBURSEMENT

create table employee_salary_structures ( /* STD */ employee_id uuid not null references employees,
  effective_from date not null, effective_to date, monthly_gross numeric(18,2) not null,
  approved_by uuid not null, revision_reason text,
  exclude using gist (employee_id with =, daterange(effective_from, effective_to, '[]') with &&) );
create table employee_salary_components ( id uuid primary key default gen_random_uuid(),
  structure_id uuid not null references employee_salary_structures, component_id uuid not null references pay_components,
  value numeric(18,6) not null, unique (structure_id, component_id) );

create table payroll_runs ( /* STD */ run_no text not null, branch_id uuid,   -- null = all branches
  period_month date not null,                          -- first day of month
  status text not null default 'DRAFT' check (status in ('DRAFT','COMPUTED','SUBMITTED','APPROVED','PAID','CLOSED','CANCELLED')),
  total_gross numeric(18,2), total_deductions numeric(18,2), total_employer_contrib numeric(18,2), total_net numeric(18,2),
  prepared_by uuid not null, approved_by uuid, paid_by uuid, paid_on date, workflow_instance_id uuid,
  accrual_journal_entry_id uuid, payment_journal_entry_id uuid,
  check (approved_by is null or approved_by <> prepared_by), unique (org_id, run_no) );
create unique index one_payroll_per_period on payroll_runs (org_id, coalesce(branch_id,'00000000-0000-0000-0000-000000000000'::uuid), period_month)
  where status <> 'CANCELLED';

create table payroll_items ( /* STD */ run_id uuid not null references payroll_runs, employee_id uuid not null references employees,
  branch_id uuid not null, structure_id uuid not null references employee_salary_structures,
  days_in_month int not null, paid_days numeric(5,2) not null, lop_days numeric(5,2) not null default 0,  -- attendance source CONFIRM
  gross numeric(18,2) not null, total_deductions numeric(18,2) not null, employer_contrib numeric(18,2) not null default 0,
  net_pay numeric(18,2) not null, payment_mode text not null check (payment_mode in ('BANK_TRANSFER','CASH','CHEQUE','UPI')),
  financial_account_id uuid, payment_reference text,
  status text not null default 'PENDING' check (status in ('PENDING','PAID','ON_HOLD','CANCELLED')),
  payslip_document_id uuid, check (net_pay = gross - total_deductions), unique (run_id, employee_id) );
create table payroll_item_lines ( id uuid primary key default gen_random_uuid(),
  payroll_item_id uuid not null references payroll_items, component_id uuid not null references pay_components,
  amount numeric(18,2) not null, calc_note text );

create table employee_advances ( /* STD */ advance_no text not null, employee_id uuid not null references employees,
  branch_id uuid not null, advance_type text not null check (advance_type in ('SALARY_ADVANCE','TRAVEL_ADVANCE','FESTIVAL_ADVANCE','OTHER')),
  amount numeric(18,2) not null check (amount > 0), given_on date not null, financial_account_id uuid not null,
  monthly_recovery numeric(18,2), recovery_start_month date, reason text not null,
  status text not null default 'REQUESTED' check (status in ('REQUESTED','APPROVED','DISBURSED','RECOVERING','SETTLED','WRITTEN_OFF')),
  approved_by uuid, journal_entry_id uuid, unique (org_id, advance_no) );
-- outstanding = amount − Σ recoveries (payroll ADVANCE_RECOVERY lines + direct repayments) → derived, never stored as truth

create table statutory_remittances ( /* STD */ remittance_type text not null check (remittance_type in ('PF','ESI','PROFESSIONAL_TAX','TDS_SALARY','TDS_VENDOR','GST')),
  period_from date not null, period_to date not null, amount numeric(18,2) not null, challan_no text, paid_on date,
  financial_account_id uuid not null, challan_document_id uuid, journal_entry_id uuid );
```

### 6.15 RLS and grants

```sql
-- For EVERY table above:
alter table <t> enable row level security;
revoke all on <t> from anon, authenticated;
-- No policies for anon/authenticated => deny. The API connects as a dedicated role `app_api` (not superuser):
grant select, insert, update on <business tables> to app_api;
grant select, insert on journal_entries, journal_lines, audit_log, workflow_actions, installment_allocations,
                         sensitive_access_log, auth_events, export_log to app_api;
grant update (reversed_by_entry_id) on journal_entries to app_api;
-- No DELETE grant to app_api on any financial/audit table.
-- Phase 9 hardening: set_config('app.org_id', ...) per transaction + policy (org_id = current_setting('app.org_id')::uuid).
```
Storage: private buckets `kyc`, `loan-docs`, `verification-media`, `receipts`, `expense-bills`, `imports`, `reports`. Access only via API-issued signed URLs (≤ 5 min). Object path = `<org_id>/<uuid>.<ext>`.

---

## 7. CORE BUSINESS LOGIC (implement in `packages/domain` + services)

All functions in `packages/domain` are **pure**, take `Decimal` inputs, return plain objects, and are covered by golden-file and property tests.

### 7.1 Schedule generation — `generateSchedule(input): Installment[]`

Input: `principal, rate, ratePeriod, method, tenure, tenureUnit, frequency, disbursementDate, firstDueDate, holidays, holidayRule, roundingUnit, roundingMode, graceInstallments, installmentTable?`.

Periodic rate `r`:
- `PER_ANNUM`: r = annualRate/100 / periodsPerYear (DAILY 365, WEEKLY 52, FORTNIGHTLY 26, MONTHLY 12).
- `PER_MONTH`: convert to periods by the same logic (monthly × 12 / periodsPerYear).
- `FLAT_TOTAL`: total interest = principal × rate/100 (for the whole tenure).

Number of installments `n` = tenure converted to frequency periods (must be an integer; else 422).

| Method | Per-installment rule |
|---|---|
| FLAT | totalInterest = P × r × n (or FLAT_TOTAL); interest_i = round(totalInterest/n); principal_i = round(P/n); last absorbs residue. |
| REDUCING_EMI | EMI = P·r·(1+r)^n / ((1+r)^n − 1), rounded to unit; interest_i = round(opening_i × r); principal_i = EMI − interest_i; last installment principal = remaining opening. If r = 0, EMI = P/n. |
| REDUCING_EQUAL_PRINCIPAL | principal_i = round(P/n); interest_i = round(opening_i × r). |
| UPFRONT_INTEREST | interest is a sanction charge (UPFRONT_DEDUCT); installments = principal only, P/n. |
| FIXED_INSTALLMENT_TABLE | read table row matching (amount, tenure); copy principal/interest per installment verbatim; validate Σprincipal = P. |

Due dates: first due = `firstDueDate` (aligned to next group meeting ≥ disbursement + min_days_to_first_due when `align_to_group_meeting`); subsequent = previous + one period (MONTHLY uses same day-of-month, clamped to month end). Apply holiday rule; keep `original_due_date`.

Invariants (tests): Σprincipal = P exactly; every closing_principal ≥ 0; last closing = 0; each component ≥ 0.

### 7.2 APR — `computeApr(netDisbursed, installments, dates): Decimal`

Solve IRR for cash flows `[−net_disbursed at t0, +scheduled_total_i at t_i]` using Newton–Raphson with bisection fallback on the periodic rate; annualise: APR = ((1+irr_period)^periodsPerYear − 1) × 100. Net disbursed = sanctioned − **all** upfront deductions (fees, insurance, upfront interest, deposit). Store on sanction and loan; show on KFS and portal. Example to verify with tests: ₹10,000 sanctioned, ₹8,500 net, n installments → APR must be clearly higher than the nominal rate.

### 7.3 Eligibility — `evaluateEligibility(ctx, rules): Result[]`

Rule types: `gender_in, age_between_at_application, age_max_at_maturity, min_group_age_days, min_membership_days, max_active_loans_with_us, max_total_lenders, max_household_obligation_ratio, min_attendance_percent, kyc_types_required, loan_cycle_between, no_overdue_on_existing, amount_within_cycle_limit`. Each → PASS/FAIL/WARN with message. FAIL blocks SUBMIT unless actor has `LOAN_APPLICATION.OVERRIDE_ELIGIBILITY` and gives a reason (stored in `application_eligibility_results`).

Household obligation ratio = (existing monthly obligations + proposed installment normalised to monthly) / monthly household income. Normalise: DAILY×30, WEEKLY×52/12, FORTNIGHTLY×26/12.

### 7.4 Allocation — `allocate(loanState, amount, businessDate, config): AllocationPlan`

```
remaining = amount
due = installments where due_date <= businessDate and outstanding(i) > 0
      order by due_date, installment_no
if config.allocation_scope == OLDEST_DUE_FIRST:
    for i in due:
        for comp in config.allocation_order:            # e.g. CHARGE, PENALTY, INTEREST, PRINCIPAL
            take = min(remaining, outstanding(i, comp)); plan.add(i, comp, take); remaining -= take
            if remaining == 0: return plan
else:  # COMPONENT_ACROSS_INSTALLMENTS
    for comp in config.allocation_order:
        for i in due: (same take logic)
if remaining > 0:
    switch config.advance_payment_rule:
      HOLD_AS_ADVANCE:           plan.advance = min(remaining, futurePayable)
      APPLY_TO_FUTURE_PRINCIPAL: apply to next installments' PRINCIPAL in due-date order (never future interest)
      REDUCE_TENURE:             apply to principal from last installment backwards; flag reamortise
    remaining -= applied
if remaining > 0: plan.refundPayable = remaining          # beyond total payable
assert sum(plan) == amount
```
`outstanding(i, comp)` = scheduled − paid − waived (PENALTY uses penalty_accrued). Property tests: never over-allocate a component; Σ = amount; deterministic; `reverse(apply(plan))` restores identical state.

Advance application: on each due date (job, §11), `allocate(loan, advance_balance, dueDate)` limited to that day's dues; journal Dr Customer Advances / Cr receivables.

### 7.5 DPD, overdue, penalty

- DPD = businessDate − due_date of oldest installment with unpaid scheduled principal+interest (> 0 tolerance ₹0.00); 0 if none.
- Buckets from setting `risk.dpd_buckets` (default `[0,1-30,31-60,61-90,90+]`); NPA flag from setting `risk.npa_dpd` (CONFIRM).
- Daily job: DUE when due_date = today; OVERDUE when today > due_date + overdue_grace_days and unpaid.
- Penalty (if product enabled): accrue per day or per event per `penalty_basis` after `penalty_grace_days`, capped by `penalty_cap`; one `penalty_accruals` row per installment per day; journal Dr Penalty Receivable / Cr Penalty Income. Idempotent via unique (installment_id, accrual_date).

### 7.6 Posting recipes (the ONLY ways money hits the ledger)

Implement `PostingService` with one method per recipe. Each builds lines, asserts balance, inserts entry + lines, links `journal_entry_id` on the source row.

| Event | Debit | Credit |
|---|---|---|
| Disbursement PAID | Loan Principal Receivable (product) = gross | Paying financial account = net; Fee Income = fee; GST Output = gst; Insurance Premium Payable = premium; Security Deposit Liability = deposit; Upfront Interest Income (or Unearned Interest) = upfront interest |
| Collection POSTED (cash) | Agent Cash account = amount | Loan Principal Receivable = principal part; Interest Income = interest part; Penalty Receivable/Income = penalty; Charge Income = charges; Customer Advances = advance; Customer Refund Payable = excess |
| Collection POSTED (non-cash, pending) | Clearing account (UPI/Cheque/Bank) | same as above |
| Non-cash verified | Real bank account | Clearing account |
| Non-cash failed/bounced | automatic reversal of the collection entry (+ optional bounce charge: Dr Charge Receivable / Cr Bounce Fee Income) | |
| Advance applied on due date | Customer Advances | Loan Principal Receivable / Interest Income |
| Agent handover | Branch cash (counted) | Agent Cash (counted) |
| Expense PAID (cash-basis setting) | Expense GL (+ Input GST if claimable) | Financial account (net payable); TDS Payable |
| Expense bill APPROVED (accrual-basis setting) | Expense GL (+ Input GST) | Accounts Payable – vendor (net payable); TDS Payable |
| Expense bill PAID (accrual) | Accounts Payable – vendor | Financial account |
| Capital purchase (category is_capital) | Fixed Assets – category | Financial account / Accounts Payable |
| Rent security deposit paid | Rent Deposits (asset) | Financial account |
| Rent deposit refunded on vacating | Financial account (+ Rent/Repairs expense for deductions) | Rent Deposits |
| Prepaid expense (e.g. yearly subscription) | Prepaid Expenses | Financial account (monthly job: Dr Expense / Cr Prepaid) |
| Petty cash voucher | Expense GL | Petty Cash account |
| Petty cash replenishment | Petty Cash account | Bank / Branch cash (transfer) |
| Employee advance disbursed | Employee Advances (asset) | Financial account |
| Payroll APPROVED | Salary & Wages (earnings), Incentives, Employer PF/ESI expense | Salary Payable (net), PF Payable, ESI Payable, PT Payable, TDS Payable, Employee Advances (recovery) |
| Payroll PAID | Salary Payable | Financial account (per payroll item) |
| Statutory remittance | PF/ESI/PT/TDS/GST Payable | Financial account |
| Staff reimbursement (fuel, travel) | Travel / Fuel expense | Financial account or Employee Payable |
| Transfer COMPLETED | Destination account | Source account (inter-branch: via Inter-branch In-Transit) |
| Waiver approved | Waiver Expense (or Interest Income contra) | Receivable of waived component |
| Write-off approved | Write-off Expense | Loan Principal Receivable (+ Interest Receivable) |
| Variance approved (short) | Cash Shortage Expense or Employee Receivable | Cash account |
| Variance approved (excess) | Cash account | Cash Excess (Other Income / Suspense) |
| Refund paid | Customer Refund Payable / Security Deposit Liability | Financial account |
| Opening balances | per migrated balance | Opening Balance Equity |
| Reversal | exact mirror of original lines on current business date | |

Interest recognition basis (cash vs accrual) is a setting `accounting.interest_recognition` = `CASH` (default for simplicity) | `ACCRUAL` (monthly accrual job: Dr Interest Receivable / Cr Interest Income). **CONFIRM with the client's accountant.**

### 7.7 Collection posting transaction

```
postCollection(actor, dto, idemKey):
  begin
    idempotency.checkOrReturnStored(idemKey)
    lock loan_accounts row FOR UPDATE; lock agent cash account row FOR UPDATE
    assert business day OPEN for branch & dto.business_date
    authz.can(actor, 'COLLECTION.COLLECT', loan)                         # scope + limits
    assert amount <= limit(COLLECTION_PER_TXN); day total + amount <= COLLECTION_PER_DAY
    assert agent cash balance + amount <= CASH_HOLDING (cash mode)       # else 422 HANDOVER_REQUIRED
    mode = payment_modes[dto.mode]; require reference if mode.requires_reference
    insert collections (status CAPTURED, verification PENDING|NOT_REQUIRED)
    if mode.allocate_on == CAPTURE or mode.requires_verification == false:
        plan = domain.allocate(loanState, amount, businessDate, productCfg)
        insert installment_allocations; update installment caches + statuses; upsert loan_balances
        je = posting.collection(plan, account = mode.requires_verification ? clearing : agentCash)
        receipt = receipts.issue(number_series 'RECEIPT')             # gapless
        collections.status = POSTED
        if loan fully paid: close loan (CLOSED/NORMAL), queue closure notice
    update plan item outcome; audit.write; notifications.queue(PAYMENT_RECEIVED)
    idempotency.store(response)
  commit
```

### 7.8 Group collection sheet

`submitSheet`: validate Σ lines = collected_total; Σ denominations = cash_total; each line's loan belongs to the group's active loans (or `payer_type=GROUP` for joint liability); then call `postCollection` for each line **inside one transaction** (all-or-nothing); set sheet POSTED. Absent members get plan outcome CUSTOMER_ABSENT unless paid by group.

### 7.9 Reversal

```
approveAndPostReversal(reversal):
  begin
    lock target + loan
    je = posting.mirror(target.journal_entry_id, businessDate = today)   # never backdated
    original.reversed_by_entry_id = je.id
    for each allocation of target: insert negative allocation (reverses_allocation_id)
    recompute installment caches/status + loan_balances (reopen loan if it was CLOSED by this payment)
    receipt.status = CANCELLED (number retained)
    target.status = REVERSED ; reversal.status = POSTED
    audit ; notify customer (PAYMENT_REVERSED)
  commit
```
Self-reversal without approval allowed only if: same agent, same business day, before handover, within setting `reversal.self_window_minutes` (default 15).

### 7.10 Authorization — `authz.can(actor, permission, record?, ctx) → {allowed, rule}`

```
1. actor active; session valid; device not REVOKED; record.org_id == actor.org_id
2. DENY override matches (permission, scope ∋ record, stage, conditions, time valid)      → DENY
3. GRANT override matches → candidate; else any active role grants (permission, stage, conditions) → candidate; else DENY
4. record ∈ data scope of that grant:
     ORG → true; BRANCH/AREA/CENTER/GROUP → hierarchy_closure lookup;
     ASSIGNED_ONLY → active agent_assignments cover record; OWN_ONLY → created_by/sourced_by = actor
5. business_limits for the action: effective limit = USER-level limit if one exists, else the highest limit among the actor's active roles; amount must be ≤ effective limit
6. segregation-of-duties rules (§7.11)
7. ALLOW (return matching rule id for audit)
```
`authz.scopeFilter(actor, permission)` returns a Kysely `where` fragment using the same scope logic for list queries. Effective permissions are cached per user keyed by `permission_version` (bumped on any change).

### 7.11 Workflow engine

- `start(entity, definition)`: pick `approval_matrix` row (most specific: product+branch → product → branch → default) by amount; freeze `route`; create first task by `assignment_strategy`.
- `act(actor, task, action, payload)`: verify transition exists in `workflow_transitions`; `authz.can(actor, stage.required_permission, entity, {stage})`; enforce `comment_required` / `reason_code_required`; verify `payload.snapshotHash == current snapshot hash` (else 409 STALE_VIEW); record `workflow_actions`.
- APPROVE/RECOMMEND/NOT_RECOMMEND: counts toward `min_approvals`; when met → next stage in route or completion → entity APPROVED.
- REJECT: terminates → entity REJECTED (setting `workflow.reject_requires_second_opinion`).
- SEND_BACK: to `target_stage_code` (default maker) → entity SENT_BACK; editable fields reopen; resubmit restarts from that stage.
- REQUEST_INFORMATION: entity INFO_REQUESTED; SLA paused; ANSWER_INFO resumes same stage.
- Amount decreased by approver → re-route for new amount (remaining stages only). Amount increased by edit → void all approvals, restart.
- SoD (default on, setting `workflow.segregation_of_duties`): sourcing agent, field verifier, and anyone who already acted on the instance cannot act on a later APPROVAL stage; nobody may approve an application where they (or their linked household) are the borrower.
- Approver limit: APPROVE requires `business_limits.APPROVAL_AMOUNT ≥ amount_under_decision`.
- SLA job: overdue tasks → ESCALATED + notify; **never auto-approve**.
- Delegations: active delegation lets `to_user` act with `on_behalf_of_user_id` recorded.

### 7.12 Business day

- Each branch has exactly one open day. All financial writes take `business_date` from it (client-supplied dates must equal it, except offline sync within tolerance).
- `closeDay` checklist: (1) no DRAFT sheets/collections for the day; (2) every agent with non-zero cash has a handover (MATCHED/APPROVED) or approved carry-forward; (3) branch cash count recorded, variance created if ≠ ledger; (4) pending approvals listed; (5) write `account_balance_snapshots`; (6) CLOSED; open next day (skip holidays per setting).
- Reopen requires `BUSINESS_DAY.REOPEN` + a second approver; prefer posting corrections on the current day.

### 7.13 Number series

`nextNumber(tx, org, branch, type, businessDate)` → `SELECT … FOR UPDATE` on `number_series`, format `prefix_pattern` (`{BRANCH}`, `{FY}`, `{YYYY}`), increment, return. Called **inside** the posting transaction so a rollback leaves no gap. Types: CUSTOMER, APPLICATION, SANCTION, LOAN, DISBURSEMENT, COLLECTION, RECEIPT, SHEET, EXPENSE, TRANSFER, REVERSAL, JOURNAL, VARIANCE, HANDOVER, GRIEVANCE.

### 7.14 Offline sync (agent PWA)

- Capturable offline: attendance, collection sheets, individual collections, verification answers + media, customer visit notes.
- Each record gets `client_uuid` + `device_captured_at`; queued in IndexedDB; synced FIFO with `Idempotency-Key = client_uuid`.
- Server accepts if `device_captured_at` within `offline.max_age_hours` (default 48) and the target business day is open; otherwise → supervisor exception queue (not silently dropped).
- Receipt numbers are issued only on server acceptance. Offline, the app shows an "acknowledgement slip" (**CONFIRM** acceptable). Official receipt goes by SMS/portal after sync.
- Conflicts (loan closed/reversed meanwhile) return 409 with details; the app shows them to the agent.

### 7.15 Duplicate detection

`dedupe_key` = normalise(full_name) + DOB (or birth year) + last 4 of primary mobile. On create/KYC: search by exact mobile, `number_hash` of any KYC doc, and fuzzy name (pg_trgm similarity ≥ 0.6) + DOB/spouse. Show matches; proceed only with `CUSTOMER.OVERRIDE_DUPLICATE` + reason.

### 7.16 Disbursement

Preconditions: sanction ACCEPTED, not expired, all conditions fulfilled, mandatory consents present (TERMS, KFS_ACK, AGREEMENT), paying account ACTIVE with sufficient balance (unless allow_negative). Flow: INITIATE (maker) → APPROVE (checker ≠ maker, within DISBURSEMENT_AMOUNT limit) → MARK_PAID (proof; cash requires customer acknowledgement photo/OTP) → in one transaction: generate schedule (§7.1) from actual date, create schedule_version ORIGINAL, loan ACTIVE, loan_balances row, posting (§7.6), sanction DISBURSED, notify.

### 7.17 Foreclosure / prepayment

Quote = overdue dues + principal outstanding + interest per `prepayment_interest_rule` + penalty + charges + prepayment charge (default 0) − advance balance. Quote valid for `valid_until`. Paying ≥ quote total via collection with flag `is_foreclosure` → allocate, then close PREPAID; remaining future installments become SUPERSEDED.

### 7.18 Office expenses and payroll logic

**Expense lifecycle:** DRAFT → SUBMITTED → (workflow by amount via `approval_matrix` for entity EXPENSE, plus extra stage when over budget) → APPROVED → PAID. REJECTED/CANCELLED allowed before PAID; after PAID only reversal.

Validation on SUBMIT:
- Category rules: vendor required (`requires_vendor`), bill document required above `requires_bill_above`, period required (`requires_period`) for rent/EB/internet.
- Rent: `premises_id` required; one bill per premises per period (unique index); amount compared with current `premises_rent_history` rent → mismatch needs a remark.
- EB/utilities: `utility_connection_id` required; meter readings optional but, if entered, current ≥ previous; `last_meter_reading` updated on PAID; consumption shown vs last 6 bills; spike > setting `expense.utility_spike_percent` (default 50%) flags for approver.
- Duplicate guard: same vendor + bill_no rejected; same vendor + amount + bill_date within 7 days warns.
- Budget check: month-to-date Σ(category, branch) + amount vs `expense_budgets` → set `budget_status`; apply `over_budget_action`.
- Loan disbursements can never be recorded as expenses (no such category; API rejects descriptions/categories mapped to loans).
- TDS: suggested from category/vendor defaults, editable by users with `EXPENSE.EDIT_TAX`; rates are settings, never hardcoded (**CONFIRM** with accountant).

On PAID: financial account + payment mode + reference required; posting per §7.6 (cash vs accrual per setting `expense.accounting_basis`, default CASH); budget actuals updated.

**Recurring bills job** (daily): for each active `recurring_expense_templates` row where next due − `create_days_before_due` ≤ today and the period is not yet generated → create expense in DRAFT with `expense_kind = RECURRING`, period, due date, amount (FIXED) or blank amount (VARIABLE, e.g. EB — user enters from the bill), notify branch accountant. Overdue unpaid bills appear on the branch dashboard and day-close checklist (informational).

**Rent:** monthly template auto-created from `premises`; escalation job creates a new `premises_rent_history` row on `next_escalation_date` only after approval (never silently changes rent); lease-expiry reminders at 90/60/30 days.

**Petty cash:** a CASH financial account with `imprest_limit`; vouchers (`expense_kind = PETTY_CASH`) below setting `expense.petty_cash_max_voucher` may be approved by branch manager; replenishment = transfer that tops the account back up to the imprest limit; petty cash counted at day close like branch cash.

**Payroll run** (monthly, per org or branch):
1. Prepare: select period; system loads each ACTIVE employee's structure effective in that month; paid days entered (manual/imported attendance — **CONFIRM** source) with LOP; incentives entered (e.g. collection incentive as MANUAL component, **CONFIRM** formula if any).
2. Compute (`packages/domain/payroll.ts`, pure): earnings prorated by paid_days/days_in_month where `prorate_by_paid_days`; statutory components from settings (`payroll.pf.*`, `payroll.esi.*`, `payroll.pt.slabs`) only if enabled (**CONFIRM** applicability); advance recovery = min(monthly_recovery, outstanding, net before recovery); net ≥ 0 else flag.
3. Review: variance vs previous month per employee highlighted; SUBMIT → APPROVE (approver ≠ preparer, `PAYROLL.APPROVE`) → accrual journal.
4. Pay: per item bank/cash/cheque with reference; mark PAID → payment journal; payslips generated (PDF, TA/EN) and visible to the employee in their staff profile.
5. Exited employees: final settlement run type with pending advance recovery and notice pay (manual component).
- Salary data is **sensitive**: visible only with `PAYROLL.VIEW` (own payslip always visible to the employee); every view of another employee's salary is logged in `sensitive_access_log`.
- A payroll run cannot be edited after APPROVED; corrections = reversal + supplementary run.

**Expense reports:** expense register (branch/category/vendor/month), budget vs actual, rent register & lease calendar, utility consumption and cost trend per branch (units and ₹), vendor ledger & payables ageing, petty cash book, salary register, payslips, statutory payables & remittances, employee advances outstanding, **branch-wise P&L** (interest + fee + penalty income − operating expenses − payroll − provisions), cost-to-income ratio per branch.

---

## 8. MODULE SPECIFICATIONS

For each module build: migration, repository, service, controller/routes, Zod contracts, permissions seed, UI screens, tests. Permission codes follow `RESOURCE.ACTION`.

| Module | Key screens | Key rules / actions | Permissions (examples) |
|---|---|---|---|
| Hierarchy (M01–M04, M61) | Org settings, branch/area/center lists & forms, holiday calendar | Moves recorded in `hierarchy_changes`; closure table maintained by trigger; cannot deactivate with active children | `BRANCH.CREATE/EDIT/VIEW`, `HOLIDAY.MANAGE` |
| Customers (M06–M11) | Customer search (mobile, code, name, masked ID), 360° profile (tabs: profile, KYC, addresses, household, group history, loans, collections, documents, audit), onboarding wizard (mobile-first) | Duplicate check; photo & signature capture; age computed; status changes with reason; profile edits after ACTIVE go through change request if `customer.edit_requires_approval` | `CUSTOMER.CREATE/EDIT/VIEW`, `CUSTOMER.OVERRIDE_DUPLICATE`, `KYC.VERIFY`, `KYC.VIEW_SENSITIVE` |
| Groups (M05, M46, M47) | Group list/map, group profile (members, sub-groups, office bearers timeline, meetings, loans, PAR), meeting attendance screen | Join/leave/transfer/office-bearer changes per §6.6; cannot close with active loans | `GROUP.CREATE/EDIT/VIEW`, `GROUP.MANAGE_MEMBERS`, `GROUP.EXIT_WITH_ACTIVE_LOAN` |
| Products (M11P, M50–M52) | Product list, version editor (tabs: amount, tenure, interest, charges, penalty, allocation, eligibility, documents, workflow), **schedule & APR preview** | Only DRAFT versions editable; activation requires `PRODUCT.APPROVE` by a different user | `PRODUCT.CREATE/EDIT/APPROVE/VIEW` |
| Applications (M12–M13, M58) | Pipeline board by status, application wizard (live-form fields per §17 + architecture fields), document checklist, consent capture, eligibility panel, timeline | Snapshot on SUBMIT and APPROVE; eligibility on SUBMIT; `legacy_payload` preserved | `LOAN_APPLICATION.CREATE/EDIT/SUBMIT/VIEW/WITHDRAW/OVERRIDE_ELIGIBILITY` |
| Workflow & approval (M14, M17) | My tasks inbox, application decision screen (snapshot, verification, credit assessment, eligibility, existing loans, group record, comments), workflow & approval-matrix admin | §7.11 | `LOAN_APPLICATION.RECOMMEND/APPROVE/REJECT/SEND_BACK/REQUEST_INFO`, `WORKFLOW.MANAGE`, `TASK.REASSIGN` |
| Verification (M15) | Assignment board, mobile verification form (checklist, GPS, photos), result review | Verifier ≠ sourcing agent; distance from recorded address computed | `VERIFICATION.ASSIGN/PERFORM/VIEW` |
| Credit review (M16, M57) | Credit assessment form with computed ratios, bureau panel (placeholder adapter) | Ratio uses proposed installment | `CREDIT.ASSESS/VIEW`, `BUREAU.PULL` |
| Sanction (M18) | Sanction screen (terms, itemised charges, net payout, APR, schedule preview), KFS + agreement print (TA/EN), acceptance capture | Expiry job; acceptance consent mandatory | `SANCTION.CREATE/CANCEL/VIEW`, `SANCTION.PRINT` |
| Disbursement (M19) | Disbursement queue, maker/checker screens, proof upload | §7.16 | `DISBURSEMENT.INITIATE/APPROVE/MARK_PAID/VIEW` |
| Loans & schedule (M20, M21, M53, M54) | Loan list with DPD filters, loan 360° (summary, schedule with paid/partial/overdue, collections, events, ledger lines, documents), foreclosure quote, lifecycle event requests | Balances from `loan_balances`; lifecycle events via workflow | `LOAN.VIEW`, `LOAN.RESCHEDULE/RESTRUCTURE/WAIVE/WRITE_OFF/FORECLOSE` |
| Collections (M22–M24, M48) | Agent: today's plan, group collection sheet, individual collection, receipt share (SMS/print); Branch: collection register, pending verification queue | §7.7–7.8; recorded ≠ verified | `COLLECTION.COLLECT/VIEW`, `COLLECTION.VERIFY_PAYMENT`, `RECEIPT.PRINT` |
| Reversals | Reversal request form (reason code mandatory), approval queue | §7.9 | `COLLECTION.REVERSE`, `REVERSAL.APPROVE` |
| Agents (M25–M28) | Agent list/profile (limits, cash in hand, assignments timeline), bulk reassignment, plan generator & editor, plan vs actual, location events map (restricted) | §6.12 | `AGENT.MANAGE`, `ASSIGNMENT.ASSIGN/REASSIGN`, `PLAN.MANAGE`, `AGENT_LOCATION.VIEW` |
| Accounts & ledger (M29–M31, M49, M55) | Chart of accounts, financial accounts (masked numbers), account statement with computed running balance, journal viewer, suspense queue | No manual journal except `JOURNAL.MANUAL_ADJUSTMENT` with approval workflow | `ACCOUNT.MANAGE/VIEW`, `LEDGER.VIEW`, `JOURNAL.MANUAL_ADJUSTMENT` |
| Office expenses (M32) | Expense dashboard (month-to-date by category vs budget, bills due/overdue), expense entry (category-driven form: rent → premises + period; EB → connection + meter readings + bill photo; fuel/travel → employee + km/purpose), approval queue, pay screen, vendor master, premises & lease calendar, utility connections, recurring templates, budgets, petty cash book | §7.18; posting at PAID (or APPROVED if accrual); loan payouts can't be expenses | `EXPENSE.CREATE/SUBMIT/APPROVE/PAY/VIEW/EDIT_TAX`, `VENDOR.MANAGE`, `PREMISES.MANAGE`, `UTILITY.MANAGE`, `BUDGET.MANAGE`, `PETTY_CASH.MANAGE` |
| Payroll & staff advances (M67) | Salary structures (with revision history), payroll run wizard (prepare → compute → review variances → approve → pay), payslips, employee advances, statutory remittances, staff self-view of own payslips | §7.18; approver ≠ preparer; salary is sensitive | `PAYROLL.PREPARE/APPROVE/PAY/VIEW`, `SALARY_STRUCTURE.MANAGE`, `EMPLOYEE_ADVANCE.REQUEST/APPROVE`, `STATUTORY.REMIT` |
| Transfers (M33) | Transfer form, approval, receive (inter-branch) | §7.6 | `TRANSFER.CREATE/APPROVE/RECEIVE` |
| Reconciliation & closing (M34, M35, M56) | Agent handover (denomination counter), branch cash count, variance approval, bank statement upload & match, day-close checklist | §7.12, §6.13 | `HANDOVER.RECEIVE`, `VARIANCE.APPROVE`, `BANK_RECON.PERFORM`, `BUSINESS_DAY.CLOSE/REOPEN` |
| Portal (M36, M60) | Dashboard, profile, group, loans, schedule, payments, receipts, documents, notifications, grievances | Customer id resolved from token only | customer role permissions `PORTAL.*` |
| Notifications (M37) | Template editor (TA/EN, DLT id), rules, delivery log | Send windows; retries | `NOTIFICATION.MANAGE` |
| Reports & dashboards (M38–M39) | Report catalogue with filters, async runs, downloads; role dashboards | Scope-filtered; exports logged | `REPORT.<CODE>.VIEW`, `REPORT.EXPORT` |
| Access control (M40–M43) | Users (employee link, roles, scopes, overrides, limits, devices), roles matrix editor (permissions × stages), **"Why can/can't user X do Y on record Z?" explainer** | §7.10; re-auth for Super Admin changes; last Super Admin protected | `USER.MANAGE`, `ROLE.MANAGE`, `PERMISSION.OVERRIDE` |
| Audit (M44) | Audit search (entity, user, date), record history diff view, sensitive-access log | Read-only | `AUDIT.VIEW` |
| Config (M45, M62, M59) | Settings registry UI, lookups (incl. live-app dropdowns), reason codes, payment modes, number series, document templates | Financial settings versioned by effective date | `CONFIG.MANAGE` |
| Import (M63) | Upload template → dry-run preview with row errors → commit | §15 phase 9 | `IMPORT.RUN` |

---

## 9. API

Base `/api/v1`; portal `/api/v1/portal`; agent-optimised `/api/v1/field`. Actions: `POST /<resource>/{id}/actions/<action>`. Lists: cursor pagination, allow-listed sort, Zod-validated filters. `If-Match` on edits; `Idempotency-Key` on money-moving and offline POSTs; `X-Request-Id` on every response. Generate OpenAPI from Zod contracts (`zod-to-openapi`) into `/docs/api`.

Minimum endpoint set:

```
GET  /me                                  GET /me/permissions
CRUD /branches /areas /centers /holidays
CRUD /groups ; POST /groups/{id}/members ; POST /group-memberships/{id}/actions/{exit|transfer}
POST /groups/{id}/office-bearers ; CRUD /groups/{id}/meetings ; PUT /meetings/{id}/attendance
CRUD /customers ; GET /customers/duplicates ; CRUD /customers/{id}/{kyc-documents|addresses|household-members|references|locations}
POST /kyc-documents/{id}/actions/{verify|reject} ; GET /kyc-documents/{id}/unmasked (logged)
POST /documents/upload-url ; GET /documents/{id}/download-url
CRUD /loan-products ; POST /loan-products/{id}/versions ; POST /loan-product-versions/{id}/actions/{activate|retire}
POST /loan-product-versions/{id}/preview   (schedule + APR)
CRUD /loan-applications ; POST /loan-applications/{id}/actions/{submit|withdraw|cancel|hold|resume}
GET  /loan-applications/{id}/{timeline|eligibility|snapshot}
GET  /tasks?mine=true ; POST /tasks/{id}/actions/{claim|approve|reject|send-back|request-info|answer-info|recommend|not-recommend|reassign}
CRUD /field-verifications ; POST /field-verifications/{id}/actions/{start|submit|reassign}
POST /loan-applications/{id}/credit-assessment
POST /loan-applications/{id}/sanction ; POST /sanctions/{id}/actions/{accept|decline|cancel} ; GET /sanctions/{id}/kfs.pdf
POST /disbursements ; POST /disbursements/{id}/actions/{approve|mark-paid|fail}
GET  /loans ; GET /loans/{id} ; GET /loans/{id}/{schedule|statement|events}
POST /loans/{id}/foreclosure-quote ; POST /loans/{id}/events   (reschedule|restructure|waiver|write-off|death-claim)
GET  /field/plan?date= ; POST /field/collection-sheets ; POST /field/collections ; POST /field/sync (batch)
GET  /collections ; POST /collections/{id}/actions/{verify|bounce}
GET  /receipts/{id} ; GET /receipts/{id}/pdf ; POST /receipts/{id}/actions/resend
POST /reversals ; POST /reversals/{id}/actions/{approve|reject}
CRUD /financial-accounts ; GET /financial-accounts/{id}/statement ; CRUD /gl-accounts ; GET /journal-entries
CRUD /expenses + actions {submit|approve|reject|pay|cancel} ; GET /expenses/due ; GET /expenses/budget-status
CRUD /vendors /premises /utility-connections /recurring-expense-templates /expense-budgets
POST /premises/{id}/rent-revisions ; POST /premises/{id}/actions/{pay-deposit|vacate}
CRUD /pay-components /employees/{id}/salary-structures
POST /payroll-runs ; POST /payroll-runs/{id}/actions/{compute|submit|approve|pay|cancel} ; GET /payroll-runs/{id}/items
GET  /payroll-items/{id}/payslip.pdf ; GET /me/payslips
CRUD /employee-advances + actions {approve|disburse|write-off} ; CRUD /statutory-remittances
 CRUD /transfers + actions {submit|approve|receive|reject}
POST /cash-handovers ; POST /branch-cash-counts ; GET/POST /variances + actions {approve|reject}
POST /bank-statements (upload) ; POST /bank-statements/{id}/auto-match ; POST /bank-recon-matches
GET  /business-days/current ; POST /business-days/{id}/actions/{start-close|close|reopen}
CRUD /users /roles ; PUT /roles/{id}/permissions ; CRUD /users/{id}/{roles|scopes|overrides|limits}
GET  /authz/explain?userId=&permission=&entityType=&entityId=
CRUD /settings /lookups/{list} /reason-codes /payment-modes /workflows /approval-matrix /number-series /templates
POST /reports/{code}/runs ; GET /report-runs/{id}
GET  /audit-log ; GET /sensitive-access-log
POST /imports ; POST /imports/{id}/actions/{validate|commit}
GET  /portal/{dashboard|profile|group|loans|payments|receipts|documents|notifications}
GET  /portal/loans/{id}/schedule ; POST /portal/{grievances|profile-change-requests}
```

---

## 10. FRONTEND

- Route trees: `/app/*` (staff desktop/tablet), `/field/*` (agent PWA, phone-first, offline), `/portal/*` (customer, phone-first).
- Layout: shadcn/ui; sidebar for staff, bottom tab bar for field & portal. Minimum touch target 44px. Works on low-end Android Chrome.
- Data: TanStack Query; keys mirror API resources; mutations invalidate affected loan/schedule/balance/plan queries. Optimistic updates **never** for money.
- Forms: React Hook Form + shared Zod schemas; money input component emits decimal strings; mobile input enforces +91 format.
- Conditional fields: declarative `visibleWhen` map in `packages/contracts` shared with backend validation.
- `<Can permission record>` hides UI only; API is authoritative.
- i18n: Tamil + English toggle; receipts/KFS/agreements rendered in the customer's preferred language.
- Accessibility: labels, focus order, contrast AA, amounts read with currency.
- Agent PWA specifics: offline banner + pending-sync counter; GPS status chip (accuracy, source); camera capture with compression (≤ 1600px, JPEG 0.7); receipt share via SMS link; cash-in-hand vs limit meter.
- Every money screen shows **business date** and **branch** prominently.

---

## 11. BACKGROUND JOBS (pg-boss, idempotent, logged)

| Job | Schedule | Action |
|---|---|---|
| mark-due-overdue | daily 00:30 IST per branch business date | DUE/OVERDUE status, DPD, loan_balances refresh |
| accrue-penalty | daily after above | penalty_accruals + journal (if enabled) |
| apply-advances | daily | apply advance balances to today's dues |
| interest-accrual | month end (if ACCRUAL) | accrual journal |
| generate-collection-plans | daily 19:00 | next-day plans per agent |
| reminders | per notification_rules | SMS before due / overdue within send window |
| sanction-expiry, application-expiry | daily | EXPIRED transitions |
| workflow-sla | hourly | escalations |
| recurring-expenses | daily 06:00 | create DRAFT bills for rent/EB/internet etc.; notify accountant |
| expense-due-reminders | daily | bills due in N days / overdue |
| lease-and-escalation | daily | lease expiry reminders (90/60/30 days); escalation proposals for approval |
| prepaid-amortisation | month end | Dr Expense / Cr Prepaid |
| payroll-reminder | 25th monthly (setting) | prompt to prepare payroll |
| balance-integrity-check | nightly | recompute loan_balances & account balances from source; alert on drift (never auto-fix) |
| snapshots | at day close | account_balance_snapshots |
| audit-partition-maintenance | monthly | create next partitions |
| location-retention | daily | purge expired agent_location_events |
| report-runs | on demand | generate files to private storage |

---

## 12. SECURITY, PRIVACY, COMPLIANCE

- Auth: staff email/password + **TOTP MFA mandatory** for Super Admin, Org Admin, Accountant, approvers; agents bound to registered devices; customers phone OTP (Supabase phone provider with DLT-registered SMS sender). Idle timeout setting (30 min staff, 15 min shared PCs).
- API verifies Supabase JWT signature/expiry every request; loads roles/permissions server-side; never trusts client claims.
- Helmet, strict CORS allow-list, HSTS, CSP; rate limits on auth/OTP; lockout on repeated failures.
- Encryption: app-level AES-256-GCM for ID numbers & bank account numbers (`FIELD_ENCRYPTION_KEY`); HMAC-SHA256 with pepper for dedupe hashes; masked copies for display.
- **Aadhaar:** store last 4 digits + hash only; mask first 8 digits on uploaded images before storage. Changing this requires compliance sign-off (**CONFIRM**).
- Logs: pino JSON with request_id; redact OTPs, tokens, ID numbers, account numbers, full mobiles.
- Uploads: magic-byte type check, size limits, image re-encode (strip EXIF except deliberate geo stored separately).
- Backups: Supabase PITR + daily logical dump to separate storage; quarterly restore drill.
- Personal data (India DPDP Act 2023): purpose-limited fields (religion/caste off by default), versioned consents (TA/EN), portal access & correction requests, grievance officer, retention jobs, breach runbook. Legal to confirm specifics.
- Lending rules (apply if the org is an RBI-regulated lender — **CONFIRM** registration): household income assessment & repayment-obligation cap (eligibility rule), all-inclusive APR + Key Fact Statement before sanction, no prepayment penalty (default 0), no collateral (deposit feature off by default), fair recovery conduct (send windows, audit of agent actions), bureau reporting (adapter placeholder), receipt for every repayment.

---

## 13. SEED DATA

- **Permissions:** every `RESOURCE.ACTION` referenced in §8 (generate from a single TypeScript registry in `packages/contracts/permissions.ts`).
- **Roles:** SUPER_ADMIN (all, system), ORG_ADMIN, BRANCH_MANAGER, ACCOUNTANT, CREDIT_OFFICER, FIELD_VERIFIER, FIELD_OFFICER (agent), AREA_SUPERVISOR, SENIOR_APPROVER, AUDITOR (read-only incl. sensitive with logging), CUSTOMER (portal).
- **Chart of accounts:** Cash (per branch), Bank accounts, Agent cash in hand (control), UPI clearing, Cheque clearing, Bank transfer clearing, Suspense, Inter-branch in transit, Loan principal receivable (per product), Interest receivable, Penalty receivable, Charge receivable, Employee receivable, Customer advances, Customer refunds payable, Security deposits, Insurance premium payable, GST output payable, TDS payable, Unearned interest, Interest income, Processing fee income, Penalty income, Other income / cash excess, Waiver expense, Write-off expense, Cash shortage expense, Operating expense categories (rent, salary, travel, stationery, utilities, other), Opening balance equity, Owner capital, Borrowings.
- **Expense categories (editable; TA/EN names):**
  - PAYROLL: Salary & wages, Collection/field incentives, Bonus, Employer PF, Employer ESI, Staff welfare, Staff training
  - PREMISES: Office rent, Maintenance charges, Repairs & maintenance, Housekeeping/cleaning, Security
  - UTILITIES: Electricity (EB) bill, Water bill, Generator/UPS diesel
  - IT_COMMUNICATION: Internet/broadband, Mobile recharge & phone bills, SMS charges, Software subscriptions
  - TRAVEL: Fuel/petrol for field staff, Bus/auto fare, Two-wheeler maintenance, Outstation travel
  - OFFICE: Stationery & printing, Receipt books & forms, Courier/postage, Tea & refreshments, Meeting expenses
  - PROFESSIONAL: Audit fees, Legal fees, Consultancy, Accounting/ROC fees
  - FINANCE_CHARGES: Bank charges, Interest on borrowings
  - STATUTORY: Licences & registrations, Trade licence, Property tax (if owned)
  - MARKETING: Pamphlets/banners, Group formation meeting costs
  - CAPITAL (is_capital): Furniture, Computers & printers, Mobile devices for agents, Office equipment
  - OTHER: Miscellaneous (requires description + approval)
- **Pay components:** as in §6.16 comment; statutory ones seeded **disabled** until D23 is answered.
- **GL additions:** Accounts payable (vendors), Rent deposits, Utility deposits, Prepaid expenses, Fixed assets (per category), Salary payable, PF/ESI/PT payable, Employee payable, Employee advances, Petty cash (per branch).
- **Payment modes:** CASH (no verification), UPI_MANUAL, BANK_TRANSFER, CHEQUE (verification required → clearing).
- **Reason codes:** REJECT, SEND_BACK, INFO, REVERSAL (wrong amount, wrong loan, duplicate, bounced), WAIVER, VARIANCE, NON_PAYMENT (absent, no money, migrated, dispute), EXIT.
- **Lookups:** relationships, occupations, education levels, loan purposes, office-bearer roles, grievance categories — plus **all dropdown options from the live form** (source = LIVE_APP) once §17 is supplied.
- **Workflow:** LOAN_APPLICATION definition with stages DOCUMENT_CHECK, VERIFICATION, CREDIT_REVIEW, OFFICER, BRANCH_MANAGER, SENIOR_APPROVER; approval_matrix rows with amount thresholds **left NULL/placeholder (CONFIRM X, Y)** and a feature flag preventing activation until set.
- **Demo data (dev/staging only, synthetic):** 1 org, 2 branches, 3 areas, 4 centers, 6 groups with sub-groups, 60 members, 2 products mirroring the observed shapes (₹10,000 with ₹1,500 placeholder deductions; ₹50,000 with fixed installments), loans at various DPD.

---

## 14. TESTING REQUIREMENTS (must exist and pass)

| Layer | Required tests |
|---|---|
| Domain unit (Vitest) | Golden-file schedules for every interest method × frequency; residue on last installment; holiday shifting; APR for known cash flows; eligibility rules; DPD edge cases (partial, waived, holiday) |
| Domain property (fast-check) | `allocate`: Σ = amount, no over-allocation, deterministic, reverse restores state; schedule: Σprincipal = P, non-negative components |
| DB integration (real Postgres) | Unbalanced journal rejected at commit; UPDATE/DELETE on journal_lines rejected; closed-day posting rejected; one active membership; office-bearer overlap rejected; gapless numbering under 20 concurrent postings |
| API | For every action endpoint: 401, 403 (no permission), 404 (out of scope), 409 (version/idempotency), 422 (rule); DENY override beats role GRANT; ASSIGNED_ONLY agent cannot see other agents' loans; customer A cannot read customer B (portal); duplicate `Idempotency-Key` returns original response |
| Concurrency | Two simultaneous collections on one loan → both allocate correctly, no double allocation; two approvers act at once → one gets 409 STALE_VIEW |
| E2E (Playwright) | (1) Onboard member → group → application → verification → 3-level approval with one SEND_BACK → sanction with ₹1,500 deductions → disbursement → schedule visible in portal. (2) Group collection sheet for 6 members incl. one partial and one paid-by-group → receipts → agent handover with ₹500 shortage → variance approval → day close → trial balance balances. (3) Wrong collection → reversal approval → corrected collection → loan state identical to direct correct entry. (4) Offline collection captured, synced twice, only one posting. |
| Expenses & payroll | Rent bill for same premises+period rejected; EB meter current < previous rejected; over-budget triggers extra approval; payroll: proration, advance recovery cap, net = gross − deductions, accrual + payment journals balance, cannot edit APPROVED run; employee sees only own payslip |
| Reconciliation checks | After every E2E: Σ loan principal receivable (GL) = Σ loan_balances.principal_outstanding; agent cash GL = Σ un-handed-over cash collections; trial balance Σdebit = Σcredit |

---

## 15. BUILD PHASES (execute in order; each ends with a phase report)

| Phase | Build | Exit criteria |
|---|---|---|
| **P0 Foundations** | Monorepo, CI, Supabase local, migrations 6.1–6.4 + config/audit/numbering/idempotency tables, auth (staff + MFA), employees, roles, permissions registry & seed, scopes, overrides, limits, `authz.can` + `scopeFilter` + explainer, audit writer, settings registry, business days, hierarchy CRUD + closure triggers | Authz test matrix green; audit rows for every mutation; RLS denies direct anon/authenticated access |
| **P1 Ledger core + office expenses** | 6.11 (GL, financial accounts, journal + triggers), PostingService skeleton, account statement with running balance, opening balances, office expenses with vendors, premises/rent, utility connections/EB, recurring templates, budgets, petty cash (+ workflow engine minimal), transfers, snapshots, day close (without collections) | Trial balance always balances; immutability & closed-day tests green |
| **P2 Members & groups** | Customers, KYC (encryption/masking), addresses, geo, household, references, duplicate detection, groups, sub-groups, memberships, office bearers, meetings/attendance, documents & signed URLs | Membership history intact through transfer; sensitive access logged |
| **P3 Products** | Product versions, charges, interest strategies, schedule + APR preview, eligibility engine | Golden & property tests green; preview matches hand calculation for the two observed product shapes (with placeholder terms) |
| **P4 Origination** | **Requires §17 mapping signed off.** Applications (live fields + architecture fields), documents, consents, snapshots, full workflow engine, approval matrix, verification (mobile), credit assessment, sanction with itemised deductions, KFS/agreement PDFs | E2E (1) up to sanction green |
| **P5 Disbursement & loans** | Disbursement maker-checker, schedule persistence, loan accounts, loan_balances, overdue/DPD/penalty jobs, loan 360° | Journals balance; nightly integrity check zero drift |
| **P6 Collections** | Payment modes, allocation engine, individual collection, group collection sheet, receipts (PDF + SMS), verification/clearing, reversals, agent profiles, assignments, plans, location events, agent handover, variances, full day close, offline PWA sync | E2E (2), (3), (4) green |
| **P7 Portal & notifications** | Customer OTP login, portal pages, profile change requests, grievances, notification templates/rules/queue | Cross-customer isolation tests green |
| **P8 Reports & dashboards** | Registers (disbursement, collection, cash book replacing "CMF Account"), PAR/DPD, trial balance, GL, plan vs actual, pipeline TAT, audit & export logs, role dashboards | Report totals tie to ledger |
| **P8a Payroll & staff advances** | Pay components, salary structures, payroll run wizard, payslips, advances with payroll recovery, statutory remittances, salary register, branch P&L | Payroll journal balances; recovery never exceeds outstanding; salary views logged; approver ≠ preparer enforced |
| **P9 Lifecycle, bank recon, migration, hardening** | Reschedule/restructure/waiver/write-off/death claim/foreclosure, bank statement import & matching, import tool (masters, active loans with paid-to-date, opening balances with explicit opening variance), RLS tenant policies, performance (indexes, EXPLAIN on hot queries), security review, backup drill | Parallel-run reconciliation for one branch signed off |

Migration approach (P9): cut-over after a day close; import masters → active loans with reconstructed schedules and per-installment paid-to-date (`source_type = MIGRATION`) → physically count cash and fetch bank balances → opening journals; any difference between the paper "CMF Account" balance and counted cash is posted as an **explicit OPENING_BALANCE variance** for management approval, never absorbed. Photos of registers are attached as migration evidence documents.

---

## 16. OPEN DECISIONS — DO NOT GUESS

Implement the mechanism, keep the value configurable/unset, and list each in every phase report until answered.

| # | Decision | Where it plugs in |
|---|---|---|
| D1 | Exact live-application fields (screenshots/source) | §17, P4 blocker |
| D2 | Original reference architecture `.md` and the missing tail of the client brief | Diff against this file |
| D3 | Composition of ₹1,500 (₹10,000 sanction vs ₹8,500 payout): fee / GST / insurance / upfront interest / deposit | product_charges, posting recipe, APR |
| D4 | "CMF" vs "SANMAHERA FINANCE": separate legal entities, brand, or branch | organizations vs branches |
| D5 | Registration status (NBFC-MFI / NBFC / other / unregistered) | §12 lending rules, eligibility caps |
| D6 | Meaning of the "5" column in the CMF register | product terms / sub-group size |
| D7 | Is "BHAVANI" an SHG with sub-groups or a center/program | hierarchy mapping in import |
| D8 | Interest method, rate, tenure, frequency, installment table for each current product | product versions |
| D9 | Allocation order & advance-payment practice | product allocation config |
| D10 | Late fee / penalty: charged or not | penalty config |
| D11 | Can a member be in two groups / hold two concurrent loans | `one_active_membership` index, eligibility |
| D12 | Joint liability: does the group pay for a defaulter; how is it recorded/recovered | collection sheet `payer_type = GROUP` |
| D13 | Security deposit / compulsory savings used? | charge type SECURITY_DEPOSIT, refund at closure |
| D14 | Approval levels and thresholds X, Y; approver limits | approval_matrix, business_limits |
| D15 | Offline acknowledgement slip acceptable? | §7.14 |
| D16 | Non-cash credited at capture or after verification | payment_modes.allocate_on |
| D17 | Existing bank accounts; cash count at cut-over | financial_accounts, opening balances |
| D18 | Interest recognition: cash or accrual | `accounting.interest_recognition` |
| D19 | NPA DPD threshold and PAR buckets | risk settings |
| D20 | Statutory retention period (auditor) | retention jobs |
| D21 | Aadhaar storage policy | kyc_document_types.number_storage |
| D22 | Continuous agent tracking wanted? (Recommended: **no**) | §6.12 |
| D23 | PF / ESI / Professional Tax / TDS on salary: applicable? rates & thresholds | payroll statutory components & settings |
| D24 | Salary pay date, pay mode (bank/cash), attendance/LOP source, incentive formula for field staff | payroll run |
| D25 | Expense accounting basis: cash or accrual (bills payable) | `expense.accounting_basis` |
| D26 | Expense approval thresholds & who approves rent/EB/salary | approval_matrix (EXPENSE, PAYROLL) |
| D27 | Monthly budgets per branch/category used? action when exceeded | expense_budgets |
| D28 | TDS on rent/professional fees: applicable rates & thresholds | category/vendor TDS defaults |
| D29 | Petty cash imprest per branch and max voucher amount | financial_accounts.imprest_limit, settings |
| D30 | Current premises list, rents, deposits, EB service connection numbers | premises, utility_connections seed |

---

## 17. EXACT LIVE APPLICATION FIELD MAPPING (mandatory before P4)

Existing app: `https://cozy-stardust-b5debb.netlify.app/` (page title "continnum"). It is a client-rendered SPA; server-side fetch returns no form content. **Do not invent its fields.**

Procedure:
1. If your environment has a browser tool, open the app, walk through **every step**, open every dropdown, trigger every conditional branch, and capture screenshots. Otherwise request screenshots or source code from the client.
2. Fill this table — one row per field, labels **verbatim** (including Tamil text and spelling):

| # | Existing label | Section/step | Control type | Req/Opt | Existing options (verbatim) | Validation | Conditional visibility (when shown/required) | Data category (customer / application / group / KYC / financial / reference / loan) | Proposed table.column | Notes | Needs client confirmation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | | |

3. Mapping rules: stable identity → `customers`; time-varying income/expenses → `household_assessments`; request terms → `loan_applications`; ID proofs → `customer_kyc_documents`; people → `household_members` / `customer_references` / `loan_parties`; duplicates of §6 columns map to the existing column (note the duplicate). No clear home → keep in `loan_applications.legacy_payload` keyed by exact label and add to §16.
4. Seed every dropdown option into `lookup_values` with `source = 'LIVE_APP'`, preserving order and text. Changes only with client approval (deactivate, never delete).
5. Reproduce conditional logic in the shared Zod schema (`visibleWhen` + `superRefine`) so FE and BE behave identically; write one test per conditional rule.
6. Commit the completed table as `/docs/live-app-field-mapping.md` and get sign-off before building the application screen.

---

## 18. DEFINITION OF DONE & REPORTING

A phase is done when: migrations apply cleanly from zero; all tests in §14 relevant to the phase pass in CI; lint/typecheck clean; OpenAPI regenerated; the flows were exercised in the browser (screenshots attached to the phase report); no TODOs in money paths; every CONFIGURABLE value is in settings/config tables; every CONFIRM item is listed.

Each phase report contains: what was built (tables, endpoints, screens), test results, screenshots, deviations from this file with justification, open CONFIRM items, and known risks.

**Final reminder of the non-negotiables:** backend owns all financial logic · double-entry with DB-enforced balance · no updates/deletes of financial rows (reversals only) · computed balances, never typed · idempotent money POSTs · business date per branch · deny-overrides-grant authorization with data scope, stage and limits · segregation of duties · masked sensitive data with logged unmasking · no fabricated GPS, no continuous tracking · never invent live-application fields.
