# CMF — Implementation Plan
**Chennai Microfinance Platform — 8-Week Development Roadmap**

---

## 1. Development Phases Overview

| Phase | Weeks | Focus | Deliverable |
|-------|-------|-------|-------------|
| **Phase 1** | 1-2 | Foundation — Auth, DB, Core Setup | Working auth, admin dashboard, user/area management |
| **Phase 2** | 3-4 | Application Engine | Complete application lifecycle with all 16 sub-topics |
| **Phase 3** | 5-6 | Loan, EMI & Disbursement | Loan creation, EMI engine, disbursement with dynamic charges |
| **Phase 4** | 7-8 | Accounting, Collection & Ledger | Ledger system, overdue management, collection tracking |
| **Phase 5** | 9-10 | Communication & Advanced | SMS/Email, field verification, reports, customer portal |

---

## 2. Phase 1: Foundation (Weeks 1-2)

### Week 1: Backend Foundation

| Day | Task | Details |
|-----|------|---------|
| 1 | Supabase project setup | Create Supabase project, enable extensions (uuid-ossp, pgcrypto, pg_trgm) |
| 2 | ID numbering system | Create `id_counters` table, `generate_id()` function, `auto_generate_id()` trigger |
| 3 | Database schema — Module 1 | Create `users`, `user_profiles`, `roles`, `permissions`, `role_permissions`, `user_permission_overrides`, `user_areas`, `password_reset_tokens`, `jwt_refresh_tokens`, `login_audit` |
| 4 | Database schema — Module 2 | Create `branches`, `areas`, `loan_products`, `product_slabs` |
| 5 | Auth API setup | `/api/v1/auth` — login, logout, register, refresh, forgot-password |
| 6 | Users API | `/api/v1/users` — CRUD, role assignment, permission overrides |
| 7 | Testing & polish | Postman collection for auth + users + areas + products |

### Week 1: Frontend Foundation

| Day | Task | Details |
|-----|------|---------|
| 1 | Vite + React + Tailwind + shadcn setup | Initialize project, install dependencies |
| 2 | Auth context + Login page | Login form, JWT handling, protected routes |
| 3 | Layout components | Sidebar, Header, routing structure |
| 4 | shadcn components | Install all needed components (button, card, table, form, dialog, select, input, badge, tabs, toast, sheet, skeleton) |
| 5 | User management page | UsersList — table with CRUD, role filter |
| 6 | Area management page | AreaList — CRUD, leader assignment |
| 7 | Responsive polish | Mobile testing, breakpoint fixes |

### Week 2: Backend — Products & Settings

| Day | Task | Details |
|-----|------|---------|
| 1 | Loan products API | `/api/v1/products` — CRUD for `loan_products` |
| 2 | Product slabs API | `/api/v1/products/slabs` — CRUD for `product_slabs` |
| 3 | Approval limits API | `/api/v1/settings/approval-limits` — CRUD for `approval_limits` (references `roles`) |
| 4 | App settings API | `/api/v1/settings` — CRUD for `app_settings` key-value store |
| 5 | EMI calculation service | `emiCalculator.js` — core EMI engine, calls `calculate_emi()` |
| 6 | ID generator service | `idGenerator.js` — wrapper for `generate_id()` from DB |
| 7 | Eligibility engine | `eligibilityEngine.js` — DTI, LTV, net worth calculations |

### Week 2: Frontend — Settings & Products

| Day | Task | Details |
|-----|------|---------|
| 1 | Dashboard page | Stat cards, recent applications list |
| 2 | Products settings page | ProductsList — CRUD with interest slabs, charges |
| 3 | Approval limits config | Role-based approval limits table |
| 4 | App settings page | Key-value configuration |
| 5 | API integration | Hook up all pages to real APIs |
| 6 | Error handling | Global error toast, loading states |
| 7 | Week 2 demo | Full auth flow + CRUD for users, areas, products |

**Phase 1 Milestone:** Multi-user login working, admin can manage users/areas/products, dashboard shows stats.

---

## 3. Phase 2: Application Engine (Weeks 3-4)

### Week 3: Backend — Application Core

| Day | Task | Details |
|-----|------|---------|
| 1 | Applications API v1 | `/api/v1/applications` — Create, list (filtered), get detail |
| 2 | Application topics API | `/api/v1/applications/:id/topics` — 16 topic CRUD |
| 3 | Application documents API | `/api/v1/applications/:id/documents` — Upload, verify |
| 4 | Application notes API | `/api/v1/applications/:id/notes` — CRUD |
| 5 | Document storage | Supabase Storage setup, upload service |
| 6 | Stages API | `/api/v1/stages` — Read stage definitions, transitions |
| 7 | Validation & testing | Zod schemas, error handling, Postman tests |

### Week 3: Frontend — Application Form (Part 1)

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Application list page | Table with filters, status badges, search |
| 3-4 | Application form — Topics 1-4 | Applicant Details, Basic Details, KYC Details, Work Details |
| 5 | Application form — Topics 5-8 | Banking Details, Ratio Analysis, Obligations, Income Details |
| 6 | Application form — Topics 9-12 | Customer Wealth, Product Details, Property Details, Eligibility |
| 7 | Document upload & validation | Drag-drop upload, preview, document checklist |

### Week 4: Backend — Application Workflow

| Day | Task | Details |
|-----|------|---------|
| 1 | Stage transitions | `/api/v1/applications/:id/transition` — Advance stage via `stage_transitions` |
| 2 | Approval workflow | `/api/v1/applications/:id/approve`, reject endpoints → `approval_history` |
| 3 | Approval limits enforcement | Middleware check against `approval_limits` table |
| 4 | Application queries | `/api/v1/applications/:id/notes` — Raise/answer queries via `application_notes` |
| 5 | Notification triggers | SMS/Email on stage change (mock provider) |
| 6 | Eligibility calculation API | Auto-calculate on form submission |
| 7 | Integration testing | Full application flow end-to-end |

### Week 4: Frontend — Application Form (Part 2) & Review

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Application form — Topics 13-16 | Documents, Verification Checks, Review Notes, Queries |
| 3-4 | Application detail page | Full 16-section read view with tabs |
| 5-6 | Application review page | Reviewer view with approve/reject/query actions |
| 7 | Week 4 demo | Complete application flow: create → review → approve |

**Phase 2 Milestone:** Full loan application lifecycle works — officer creates → reviewer reviews → manager approves.

---

## 4. Phase 3: Loan, EMI & Disbursement (Weeks 5-6)

### Week 5: Backend — Loan & EMI

| Day | Task | Details |
|-----|------|---------|
| 1 | Loans API | `/api/v1/loans` — Create from approved application, list, detail |
| 2 | EMI schedule generation | Generate `emi_schedules` rows via `generate_id()` and amortization |
| 3 | EMI statement API | `/api/v1/loans/:id/statement` — PDF generation |
| 4 | Receipt generation | `/api/v1/emi/receipt/:id` — PDF receipt |
| 5 | EMI payment API | `/api/v1/emi/pay` — Record payment in `emi_payments`, create `payment_receipts` |
| 6 | EMI engine unit tests | Test all EMI calculations |
| 7 | Overdue detection | `/api/v1/emi/overdues` — Automated overdue detection (uses `emi_schedules.is_overdue`) |

### Week 5: Frontend — Loans & EMI

| Day | Task | Details |
|-----|------|---------|
| 1 | Loan list page | Table of all active loans with status |
| 2 | Loan detail page | Full amortization schedule, payment history |
| 3 | EMI collection page | Agent view: list due EMIs, record payment, print receipt |
| 4 | Overdues page | Overdue loans table with aging, actions |
| 5 | Customer dues page | End-user: own EMI schedule, payment history |
| 6 | Pay EMI page (customer) | Online payment flow |
| 7 | Week 5 demo | Loan creation → EMI schedule → payment → receipt |

### Week 6: Backend — Disbursement

| Day | Task | Details |
|-----|------|---------|
| 1 | Disbursements API v1 | `/api/v1/disbursements` — Create from approved loan |
| 2 | Dynamic charges calculation | Calculate processing/document/insurance/GST into `disbursement_charges` rows |
| 3 | Disbursement approval | `/api/v1/disbursements/:id/approve` — Update status |
| 4 | Journal entry on disbursement | Create `ledger_entries` + `ledger_entry_lines` for Dr: Loan A/c, Cr: Bank + Charges |
| 5 | Statement generation | Full disbursement statement PDF |
| 6 | Bank account management API | CRUD for `bank_accounts` |
| 7 | Integration testing | Full flow: application → loan → disbursement → ledger |

### Week 6: Frontend — Disbursement

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Disbursement list page | Table with status, actions |
| 3-4 | Disbursement form page | Select loan → show charges breakdown (from `disbursement_charges`) → select bank → submit |
| 5 | Disbursement detail | Full statement view, PDF download |
| 6 | Bank account management | Admin: manage `bank_accounts` |
| 7 | Week 6 demo | Complete disbursement with charges and ledger entries |

**Phase 3 Milestone:** Loan creation, EMI schedule, disbursement with dynamic charges, online payments all functional.

---

## 5. Phase 4: Accounting, Collection & Ledger (Weeks 7-8)

### Week 7: Backend — Ledger System

| Day | Task | Details |
|-----|------|---------|
| 1 | Chart of Accounts | `/api/v1/ledger/accounts` — CRUD for `ledger_accounts` (5 account groups: assets, liabilities, income, expenses, equity) |
| 2 | Chart of Accounts (data) | Seed standard COA (assets, liabilities, equity, income, expenses) |
| 3 | Journal entry API | `/api/v1/ledger/journal` — Create `ledger_entries` header + `ledger_entry_lines` |
| 4 | Auto journal on EMI payment | Dr: Bank/Cash, Cr: Loan A/c (principal) + Interest A/c |
| 5 | Journal on expenses | Dr: Expense A/c, Cr: Bank A/c |
| 6 | Late fee journal entries | Auto-create on overdue |
| 7 | Ledger report APIs | Account statement, day book, trial balance |

### Week 7: Frontend — Ledger

| Day | Task | Details |
|-----|------|---------|
| 1-2 | Chart of accounts page | Hierarchical tree view |
| 3 | Account ledger page | Account-wise transaction list with running balance |
| 4 | Journal entry form | Debit/Credit entry form |
| 5 | Journal entries list | Filterable list of all entries |
| 6 | Trial balance | Auto-generated trial balance table |
| 7 | Day book | Date-filtered all transactions |

### Week 8: Backend — Overdue & Enhanced Collection

| Day | Task | Details |
|-----|------|---------|
| 1 | Penalties API | `/api/v1/penalties` — CRUD for `penalties` (late_payment, bounced_cheque, legal) |
| 2 | Overdue detection | Cron: scan `emi_schedules` where `is_overdue = true` and `is_paid = false` |
| 3 | Overdue notifications | Auto-SMS/Email to customer + admin + team leader |
| 4 | Collection session API | `/api/v1/emi/collection-session` — Agent collection tracking |
| 5 | Enhanced repayment API | Support partial payments, late fee integration |
| 6 | Report APIs | Disbursement, collection, overdue, portfolio reports |
| 7 | Performance & optimization | Query optimization, caching |

### Week 8: Frontend — Reports & Overdue

| Day | Task | Details |
|-----|------|---------|
| 1 | Enhanced overdue page | Aging analysis, escalation actions |
| 2 | Disbursement report | Date/branch/officer-wise filterable report |
| 3 | Collection report | Agent-wise, area-wise collection summary |
| 4 | Portfolio report | Outstanding, NPA, portfolio at risk |
| 5 | Settings pages | Late fee rules, EMI interest configuration |
| 6 | Data validation | End-to-end testing of all calculations |
| 7 | Week 8 demo | Complete accounting: disbursement → EMI → payment → ledger → overdue → reports |

**Phase 4 Milestone:** Complete double-entry ledger, overdue detection, late fee auto-calculation, all reports functional.

---

## 6. Phase 5: Communication, Verification & Customer Portal (Weeks 9-10)

### Week 9: Communication & Verification

| Day | Task | Details |
|-----|------|---------|
| 1 | SMS templates API | `/api/v1/sms/templates` — CRUD for `sms_templates` |
| 2 | SMS sending service | `/api/v1/sms/send` — Insert records into `sms_logs` |
| 3 | Email templates API | `/api/v1/email/templates` — CRUD for `email_templates` |
| 4 | Email sending service | `/api/v1/email/send` — Insert records into `email_logs` |
| 5 | Trigger automation | Automated sends on: application status change, EMI due, overdue, disbursement, payment |
| 6 | Tasks API | `/api/v1/tasks` — CRUD, assignment, status updates |
| 7 | Communication log | History of all sent messages |

### Week 9: Frontend — Communication & Tasks

| Day | Task | Details |
|-----|------|---------|
| 1-2 | SMS panel | Template management, send SMS, logs |
| 3-4 | Email panel | Template management, send email, logs |
| 5-6 | Task list page | Assigned tasks, status updates, priority |
| 7 | Notification settings | Admin: configure auto-trigger settings |

### Week 10: Field Verification & Customer Portal

| Day | Task | Details |
|-----|------|---------|
| 1 | Verification tasks API | `/api/v1/verification` — CRUD for `verification_tasks` (field_verification, document_verification, address_verification) |
| 2 | Verification results API | `/api/v1/verification/results` — CRUD for `verifications` |
| 3 | Field visit API | `/api/v1/verification/field-visits` — CRUD |
| 4 | OpenStreetMap integration | Frontend: map component for GPS capture |
| 5 | Customer portal API | Dedicated endpoints for end-user data |
| 6 | Web portal | Self-service: EMI schedule, payment, receipts |
| 7 | Final integration | End-to-end testing of all modules |

### Week 10: Final Polish

| Day | Task | Details |
|-----|------|---------|
| 1 | Performance optimization | Code splitting, lazy loading, image optimization |
| 2 | Security hardening | Input sanitization, rate limiting, RBAC policy review |
| 3 | Documentation | API docs (Swagger), deployment guide |
| 4 | Data seeding | Seed script for Chennai-based test data |
| 5 | UAT | User acceptance testing with Chennai team |
| 6 | Bug fixes | Based on UAT feedback |
| 7 | Deployment | Production deployment, CI/CD setup |

**Phase 5 Milestone:** Complete system with all features, deployed to production.

---

## 7. Database Seeding Plan

### 7.1 Seed Data (Chennai-specific)

The actual schema uses 10-digit alphanumeric IDs auto-generated by `generate_id()`. Use the migrations.sql seed sections (MIGRATION 003) for roles, permissions, SMS/email templates.

```sql
-- Branches (IDs auto-generated, but branch_code is manually set)
INSERT INTO branches (branch_code, branch_name, branch_type, address, city, state, pincode, phone, email) VALUES
('BRN0000001', 'T Nagar Branch', 'branch', '123 GN Chetty Road', 'Chennai', 'Tamil Nadu', '600017', '+914412345678', 'tnagar@cmf.in'),
('BRN0000002', 'Adyar Branch', 'branch', '45 Sardar Patel Road', 'Chennai', 'Tamil Nadu', '600020', '+914423456789', 'adyar@cmf.in'),
('BRN0000003', 'Velachery Branch', 'branch', '78 Velachery Bypass', 'Chennai', 'Tamil Nadu', '600042', '+914434567890', 'velachery@cmf.in');

-- Super Admin user (customer_code auto-generated: CMF1000001)
-- password_hash: bcrypt of 'ChangeMe123!'
INSERT INTO users (username, email, phone, password_hash, role, is_active, is_verified) VALUES
('admin', 'admin@cmf.in', '+919876543210', '$2b$10$...', 'super_admin', true, true);

-- Areas (T Nagar, auto-generated area_code via trigger)
INSERT INTO areas (area_code, area_name, area_type, branch_id, pincode, city) VALUES
('ARE0000001', 'T Nagar North', 'urban', '<branch_id>', '600017', 'Chennai'),
('ARE0000002', 'T Nagar South', 'urban', '<branch_id>', '600018', 'Chennai');

-- Products (product_code set explicitly)
INSERT INTO loan_products (product_code, product_name, category, min_loan_amount, max_loan_amount, min_tenure_months, max_tenure_months, min_interest_rate, max_interest_rate) VALUES
('PRD0000001', 'Personal Loan', 'personal', 10000, 100000, 3, 36, 18.00, 24.00),
('PRD0000002', 'Business Loan', 'business', 50000, 500000, 6, 60, 22.00, 28.00),
('PRD0000003', 'Gold Loan', 'agriculture', 5000, 200000, 3, 18, 15.00, 18.00);

-- 7 Standard Stages (already seeded in migrations.sql)
-- 'new_application', 'document_verification', 'field_verification',
-- 'credit_assessment', 'committee_review', 'approval', 'disbursement'

-- 7 System Roles (already seeded in migrations.sql)
-- 'super_admin', 'branch_admin', 'team_leader', 'field_officer',
-- 'collection_agent', 'customer', 'lender'

-- 40+ Permissions (already seeded in migrations.sql)

-- 10 SMS Templates + 6 Email Templates (already seeded in migrations.sql)
```

### 7.2 Chart of Accounts (Standard COA)

Insert into `ledger_accounts` with `account_group` as the type:

| Code | Account Name | account_group |
|------|-------------|---------------|
| 1001 | Cash in Hand | assets |
| 1002 | HDFC Bank Account | assets |
| 1003 | ICICI Bank Account | assets |
| 1010 | Loans Receivable | assets |
| 1011 | Interest Receivable | assets |
| 1020 | Late Fees Receivable | assets |
| 1100 | Fixed Assets | assets |
| 2001 | Loan Portfolio | liabilities |
| 2002 | GST Payable | liabilities |
| 3001 | Capital Account | equity |
| 4001 | Interest Income | income |
| 4002 | Late Fee Income | income |
| 4003 | Processing Fee Income | income |
| 4004 | Document Fee Income | income |
| 4005 | Other Income | income |
| 5001 | Salary Expense | expenses |
| 5002 | Rent Expense | expenses |
| 5003 | Utilities Expense | expenses |
| 5004 | Marketing Expense | expenses |
| 5005 | Office Supplies Expense | expenses |
| 5099 | Other Expenses | expenses |

---

## 8. Key Business Logic Implementation Details

### 8.1 EMI Schedule Generation Algorithm

```javascript
// services/emiCalculator.js

function generateEMISchedule(principal, annualRate, tenureMonths, firstEmiDate) {
  const monthlyRate = annualRate / 12 / 100
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1)

  const schedule = []
  let balance = principal

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = balance * monthlyRate
    const principalPaid = emi - interest
    balance -= principalPaid

    // Calculate due date: same day of month as first EMI date
    const dueDate = addMonths(new Date(firstEmiDate), i - 1)

    schedule.push({
      installment_no: i,
      due_date: formatDate(dueDate),
      principal_component: round(principalPaid),
      interest_component: round(interest),
      emi_amount: round(emi),
      opening_balance: round(balance + principalPaid),
      closing_balance: round(balance),
      status: 'pending'
    })
  }

  return { schedule, monthly_emi: round(emi) }
}
```

### 8.2 Dynamic Charges Calculation

```javascript
// services/loanEngine.js

function calculateDisbursementCharges(loanAmount, product) {
  // Find applicable slab based on loan amount
  const slab = product.charges.find(
    c => loanAmount >= c.applicable_from_amount &&
         loanAmount <= c.applicable_to_amount
  ) || product.charges[0]  // Default to first slab

  const processingFee = Math.max(
    product.processing_fee_min,
    loanAmount * product.processing_fee_rate / 100
  )

  const documentFee = Math.max(
    product.document_fee_min,
    loanAmount * product.document_fee_rate / 100
  )

  const gstAmount = (processingFee + documentFee + product.insurance_fee) *
                     product.gst_rate / 100

  return {
    gross_amount: loanAmount,
    processing_fee: round(processingFee),
    document_fee: round(documentFee),
    insurance_fee: product.insurance_fee,
    gst_amount: round(gstAmount),
    total_deductions: round(processingFee + documentFee + product.insurance_fee + gstAmount),
    net_disbursed: round(loanAmount - processingFee - documentFee - product.insurance_fee - gstAmount)
  }
}
```

### 8.3 Ledger Entry Creation (Disbursement)

```javascript
// services/ledgerEngine.js

function createDisbursementJournalEntries(disbursement) {
  const entries = []

  // Entry 1: Dr Loan Receivable, Cr Bank
  entries.push({
    debit: disbursement.net_disbursed,
    debit_account: '1010',  // Loans Receivable
    credit: disbursement.net_disbursed,
    credit_account: getBankAccountCode(disbursement.bank_account_id),
    narration: `Disbursement ${disbursement.disbursement_number} to customer`
  })

  // Entry 2: Dr Processing Fee Receivable, Cr Processing Fee Income
  if (disbursement.processing_fee > 0) {
    entries.push({
      debit: disbursement.processing_fee,
      debit_account: '1022',  // Processing Fee Receivable
      credit: disbursement.processing_fee,
      credit_account: '4003',  // Processing Fee Income
      narration: `Processing fee for ${disbursement.disbursement_number}`
    })
  }

  // Entry 3: Dr Document Fee Receivable, Cr Document Fee Income
  if (disbursement.document_fee > 0) {
    entries.push({
      debit: disbursement.document_fee,
      debit_account: '1023',
      credit: disbursement.document_fee,
      credit_account: '4004',
      narration: `Document fee for ${disbursement.disbursement_number}`
    })
  }

  // Entry 4: Dr GST Receivable, Cr GST Payable
  if (disbursement.gst_amount > 0) {
    entries.push({
      debit: disbursement.gst_amount,
      debit_account: '1024',
      credit: disbursement.gst_amount,
      credit_account: '2002',  // GST Payable
      narration: `GST for ${disbursement.disbursement_number}`
    })
  }

  return entries
}
```

### 8.4 EMI Payment Journal Entry

```javascript
function createEMIPaymentEntries(repayment) {
  const principalEntry = {
    debit: repayment.principal_paid,
    debit_account: '1002',    // Bank account
    credit: repayment.principal_paid,
    credit_account: '1010',   // Loans Receivable
    narration: `EMI payment ${repayment.receipt_number} - Principal`
  }

  const interestEntry = {
    debit: repayment.interest_paid,
    debit_account: '1002',    // Bank account
    credit: repayment.interest_paid,
    credit_account: '4001',   // Interest Income
    narration: `EMI payment ${repayment.receipt_number} - Interest`
  }

  const entries = [principalEntry, interestEntry]

  if (repayment.late_fee_paid > 0) {
    entries.push({
      debit: repayment.late_fee_paid,
      debit_account: '1002',
      credit: repayment.late_fee_paid,
      credit_account: '4002',  // Late Fee Income
      narration: `Late fee for ${repayment.receipt_number}`
    })
  }

  return entries
}
```

---

## 9. Technology Decisions & Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Backend Framework** | Express.js | Familiar to team, fast development, huge ecosystem |
| **Database** | Supabase (PostgreSQL) | Managed PostgreSQL, built-in auth, RLS, real-time, storage |
| **Frontend Framework** | React 18 + Vite | Industry standard, great DX, fast HMR |
| **UI Library** | shadcn/ui | Copy-paste components, Tailwind-based, highly customizable |
| **State Management** | TanStack Query | Eliminates need for Redux, built-in caching + optimistic updates |
| **Forms** | React Hook Form + Zod | Type-safe validation, excellent DX |
| **Maps** | Leaflet + OpenStreetMap | Free, no API key needed, works offline |
| **PDF** | jsPDF | Client-side PDF, no server dependency for receipts |

---

## 10. Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Aadhaar API delays** | Medium | High | Build with mock data first, integrate real API when credentials are available |
| **Payment gateway setup** | Medium | Medium | Start with cash/cheque mode, add online payment later |
| **Supabase RLS complexity** | Medium | High | Test all policies thoroughly, use Supabase dashboard's policy tester |
| **Team skill gaps** | Low | Medium | Document patterns, pair programming, use well-documented libraries |
| **Performance at scale** | Low | Medium | Pagination from day 1, add indexes early, monitor query performance |
| **Data migration** | Low | High | Seed script from day 1, validate data at each phase |

---

## 11. Testing Strategy

### 11.1 Backend Tests

| Test Type | Tool | Coverage |
|-----------|------|---------|
| **Unit Tests** | Jest | EMI calculator, eligibility engine, charge calculator, ledger engine |
| **Integration Tests** | Jest + Supertest | All API endpoints with mock DB |
| **E2E Tests** | Playwright | Critical user flows (login → create app → approve → disburse → pay EMI) |

### 11.2 Frontend Tests

| Test Type | Tool | Coverage |
|-----------|------|---------|
| **Component Tests** | Vitest + React Testing Library | Key components (forms, tables) |
| **E2E Tests** | Playwright | Full user journeys |

### 11.3 Manual Testing Checklist
- [ ] Full application lifecycle (create → review → approve → disburse)
- [ ] EMI payment with cash and online
- [ ] Overdue detection and notification
- [ ] Ledger balancing (debits = credits)
- [ ] Report accuracy vs manual calculation
- [ ] Role-based access (each role can only see what they should)
- [ ] Mobile responsiveness on tablets

---

## 12. Go-Live Checklist

- [ ] All Phase 5 features complete
- [ ] UAT passed by Chennai team
- [ ] Security audit completed
- [ ] Backup strategy configured
- [ ] Monitoring & alerting setup (Sentry for errors)
- [ ] SSL certificates configured
- [ ] CI/CD pipeline operational
- [ ] User training completed
- [ ] Documentation finalized (user manual, admin manual, API docs)
- [ ] Staging environment tested with production-like data
- [ ] Performance testing completed
- [ ] Data backup and restore tested
