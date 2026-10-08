# Continumm Micro Finance Pvt Ltd
# Implementation Plan — Sprint-by-Sprint Guide v2.0

**Document Version:** 2.0  
**Date:** October 2026  
**Methodology:** Agile (2-week sprints)  
**Timeline:** 15 weeks (~3.5 months)  
**Location:** Chennai, Tamil Nadu

---

## Table of Contents

1. [Implementation Overview](#1-implementation-overview)
2. [Phase 0: Setup & Infrastructure](#2-phase-0-setup--infrastructure)
3. [Phase 1: Foundation (Sprint 1-2)](#3-phase-1-foundation-sprint-1-2)
4. [Phase 2: Customer Onboarding (Sprint 3-4)](#4-phase-2-customer-onboarding-sprint-3-4)
5. [Phase 3: Loan Application (Sprint 5-6)](#5-phase-3-loan-application-sprint-5-6)
6. [Phase 4: Disbursement (Sprint 7-8)](#6-phase-4-disbursement-sprint-7-8)
7. [Phase 5: EMI Collection (Sprint 9-10)](#7-phase-5-emi-collection-sprint-9-10)
8. [Phase 6: Ledger & Reports (Sprint 11-12)](#8-phase-6-ledger--reports-sprint-11-12)
9. [Phase 7: Polish & Launch (Sprint 13-14)](#9-phase-7-polish--launch-sprint-13-14)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Checklist](#11-deployment-checklist)
12. [Post-Launch Plan](#12-post-launch-plan)

---

## 1. Implementation Overview

### 1.1 Approach
Bottom-up: data layer → backend services → frontend pages → E2E integration.

### 1.2 Sprint Structure
- Days 1-2: Planning & design
- Days 3-6: Development (backend + frontend)
- Days 7-8: Testing & bug fixes
- Days 9-10: Demo & retrospective

### 1.3 Environments
| Environment | URL |
|-------------|-----|
| Local | localhost:3001 |
| Staging | staging.cmf.app |
| Production | app.cmf.app |

---

## 2. Phase 0: Setup & Infrastructure (1 week)

### Task 0.1: Repository
```bash
mkdir cmf-microfinance && cd cmf-microfinance
git init
mkdir backend frontend docs scripts
```

### Task 0.2: Supabase Project
```bash
npm install -g supabase
supabase init && supabase login
supabase link --project-ref <project-id>
```

### Task 0.3: Backend Init
```bash
cd backend && npm init -y
npm install express cors helmet dotenv pg
npm install axios uuid
npm install -D nodemon
mkdir -p src/{config,middleware,routes,services,utils}
mkdir -p scripts tests
```

### Task 0.4: Frontend Init
```bash
cd frontend && npm create vite@latest . -- --template react
npm install react-router-dom axios recharts
npm install leaflet react-leaflet date-fns lucide-react sonner
npx shadcn@latest init
npx shadcn@latest add button card input label table dialog select
```

### Task 0.5: CI/CD
```yaml
# .github/workflows/ci.yml
# Test backend + frontend on push to main/staging
```

### Deliverables
- [x] Repository structure
- [x] Supabase project
- [x] Backend skeleton (Express)
- [x] Frontend skeleton (React + shadcn/ui)
- [x] CI/CD pipeline

---

## 3. Phase 1: Foundation (Sprint 1-2, 2 weeks)

### Sprint 1: Database & Authentication (Week 1)

#### Task 1.1: Database Schema (Day 1-3)
```bash
# Run migrations
cd backend/scripts
# Apply migrations.sql (48 tables, functions, triggers, enums, indexes)
# Apply patch_missing_tables.sql
# Apply patch_notifications.sql

# Seed initial data
psql $SUPABASE_DB_URL -f seed_data.sql
```

**Tables (50 total):**
- Core: id_counters, users, user_profiles, roles, permissions, role_permissions, user_permission_overrides
- Auth: password_reset_tokens, jwt_refresh_tokens, login_audit
- Business: branches, areas, user_areas, bank_accounts, loan_products, product_slabs
- Applications: applications, application_topics, application_notes, application_documents
- Workflow: stages, application_stages, stage_transitions, approval_limits, approval_history
- Loans: loans, emi_schedules, emi_payments, payment_receipts, penalties
- Disbursement: disbursements, disbursement_charges
- Ledger: ledger_accounts, ledger_entries, ledger_entry_lines, ledger_account_balances
- Banking: bank_statement_entries, bank_reconciliations
- Verification: verification_tasks, verifications
- NPA: npa_classifications
- Communication: sms_templates, sms_logs, email_templates, email_logs
- Other: referrals, trust_scores, audit_logs, app_settings, notifications

**Verification:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- Should show 50 tables
```

#### Task 1.2: DB Connection (Day 2)
```javascript
// backend/src/config/db.js
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
export const query = (text, params) => pool.query(text, params);
export const withTransaction = async (fn) => { /* ... */ };
```

#### Task 1.3: Auth Service (Day 3-5)
```javascript
// authService.js functions:
login(), refreshAccessToken(), getUserProfile(), updateUserProfile(),
getUsers(), createUser(), changePassword(), hasPermission()
```
- Username/password login with bcrypt
- JWT + refresh tokens
- Role-based access

**Frontend:**
- Login page
- Auth context provider
- Protected routes (RoleGuard)
- Token management (localStorage)

#### Task 1.4: Middleware (Day 4-5)
```javascript
// auth.js: authenticate() - JWT verify, authorize() - role check
// validation.js: asyncHandler(), errorHandler()
```

#### Task 1.5: Dashboard (Day 5-7)
```javascript
// dashboardService.js: getDashboardStats(), getStages(), getCollectionStats(),
// getApprovalLimits(), getNpaStats()
```
- Stat cards (disbursed, outstanding, overdue, repaid)
- Recent applications
- Collection trends

#### Task 1.6: Settings — Users & Roles (Day 6-7)
```javascript
// commonService.js: getUsers(), createUser(), getRoles(), getPermissions()
```
- Users list with search/filter
- Role assignment
- Permission matrix

### Sprint 2: Core Services (Week 2)

#### Task 2.1: Area Management (Day 8-9)
```javascript
// getAreas(), createArea(), assignAreaLeader(), getAreaMembers()
```
- Area list with OpenStreetMap
- Area creation form
- Leader/agent assignment

#### Task 2.2: Loan Products (Day 9-10)
```javascript
// getLoanProducts(), createLoanProduct(), updateLoanProduct()
// Product slabs for dynamic charges
```
- Product list
- Product create/edit with slabs
- Active/Inactive toggle

#### Task 2.3: File Upload (Day 10)
```javascript
// uploadService.js: uploadDocument(), deleteDocument(), getDocuments()
```
- Mock Supabase Storage upload
- File metadata tracking

#### Task 2.4: Communication Templates (Day 10)
```javascript
// communicationService.js (partial): getSmsTemplates(), getEmailTemplates(), renderTemplate()
```

### Sprint 1-2 Deliverables
- [x] 50 database tables with UUID PKs
- [x] ID numbering system (10-digit codes)
- [x] Enum types (role, gender, marital, education, etc.)
- [x] JWT authentication with refresh tokens
- [x] Role-based authorization
- [x] Dashboard with stats
- [x] Area management with OSM
- [x] Loan product + slab management
- [x] User management
- [x] SMS/Email template infrastructure

---

## 4. Phase 2: Customer Onboarding (Sprint 3-4, 2 weeks)

### Sprint 3: Customer Registration & KYC (Week 3)

#### Task 3.1: Customer Registration API (Day 1-2)
```javascript
// authService.js: registerCustomer(data)
// 1. Create user (role: customer)
// 2. Create user_profile
// 3. Auto-assign customer_code via trigger
// 4. Link to area if provided
// 5. Send welcome SMS
```

#### Task 3.2: Aadhaar Verification (Day 2-3)
```javascript
// kycService.js: verifyAadhaar(aadhaarNumber, otp)
// 1. Call UIDAI eKYC API
// 2. Parse XML response
// 3. Update customer_kyc + user_profiles
```

#### Task 3.3: PAN Verification (Day 3-4)
```javascript
// kycService.js: verifyPAN(panNumber, name)
// Call NSDL/UTIITSL API
```

#### Task 3.4: Customer Profile (Day 4-5)
```javascript
// customerService.js: createCustomerProfile(), updateProfile()
// Combines: user_profiles, customer_banking, customer_wealth, customer_obligations
```

**Frontend:**
- Multi-step customer registration
- Aadhaar verification flow (OTP)
- PAN verification
- Profile edit page
- Document upload

### Sprint 4: Banking, Wealth & Referrals (Week 4)

#### Task 4.1: Customer Banking (Day 8-9)
```javascript
// addBankAccount(), updateBankAccount(), getBankAccounts()
```

**Frontend:**
- Bank account form
- Bank statement upload
- Account verification status

#### Task 4.2: Wealth & Obligations (Day 9-10)
```javascript
// updateCustomerWealth(), addObligation(), getObligations()
```

**Frontend:**
- Assets & wealth form
- Obligations form
- Auto-total calculation

#### Task 4.3: Referrals & Trust Scores (Day 10)
```javascript
// createReferral(), getReferrals(), getTrustScore(), calculateTrustScore()
```

**Frontend:**
- Referral creation
- Trust score display

### Sprint 3-4 Deliverables
- [x] Customer registration flow
- [x] Aadhaar eKYC (sandbox)
- [x] PAN verification
- [x] Complete profile (KYC, banking, wealth, obligations)
- [x] Referral system
- [x] Trust score calculation
- [x] Customer list (admin)

---

## 5. Phase 3: Loan Application (Sprint 5-6, 2 weeks)

### Sprint 5: Application Core (Week 5)

#### Task 5.1: Application Service (Day 1-3)
```javascript
// applicationService.js:
createApplication()     // Creates app + 16 topics
getApplications()       // List with filters
updateApplication()     // Update amount, status
getApplicationTopics()  // Get all 16 topics
updateTopic()           // Update individual topic JSONB
submitApplication()     // Validate + submit
```

#### Task 5.2: Stage Workflow (Day 2-4)
```javascript
// 7 stages: new_application → document_verification → field_verification
//   → credit_assessment → committee_review → approval → disbursement

transitionStage()       // Move to next stage
approveStage()          // Approve with limit check
getStageHistory()       // Full transition audit
```

#### Task 5.3: Approval Limits (Day 4-5)
```javascript
// Seed limits per role
// field_officer: ₹0-25K, team_leader: ₹0-50K, branch_admin: ₹0-200K, super_admin: unlimited
// Enforced in approveStage()
```

**Frontend:**
- 16-topic wizard form
- Progress bar
- Stage visualization
- Approval with limit check

### Sprint 6: Review & Documents (Week 6)

#### Task 6.1: Notes & Queries (Day 8-9)
```javascript
// addApplicationNote(), getApplicationNotes(), raiseQuery()
```

**Frontend:**
- Notes panel
- Query raise/resolve

#### Task 6.2: Document Management (Day 9-10)
```javascript
// uploadDocument(), getApplicationDocuments(), verifyDocument()
```

**Frontend:**
- Document upload section
- Preview/verification

#### Task 6.3: Application Detail (Day 10)
```javascript
// Combined view: topics + notes + documents + stages + approvals
```

### Sprint 5-6 Deliverables
- [x] 16-topic application form
- [x] Stage workflow engine
- [x] Approval limits enforcement
- [x] Query/reject functionality
- [x] Document management
- [x] Application detail view

---

## 6. Phase 4: Disbursement (Sprint 7-8, 2 weeks)

### Sprint 7: Disbursement Logic (Week 7)

#### Task 7.1: Dynamic Charges (Day 1-2)
```javascript
// disbursementService.js: calculateCharges()
// Uses product_slabs for bracket-based charges
// processing_fee (percentage/flat/slab)
// document_charge (percentage/flat)
// insurance (none/percentage/flat)
// CGST + SGST on top
```

#### Task 7.2: EMI Calculation (Day 2-3)
```javascript
// calculateEmi(principal, annualRate, tenureMonths)
// Reducing balance: P * r * (1+r)^n / ((1+r)^n - 1)
// generateEmiSchedule() — full schedule with opening/closing balance
```

#### Task 7.3: Disbursement Creation (Day 3-5)
```javascript
// createDisbursement() — in transaction:
// 1. Calculate charges from slabs
// 2. Create disbursement record
// 3. Create disbursement_charges lines
// 4. Post to ledger (double-entry)
// 5. Create loan record
// 6. Generate EMI schedule
// 7. Update application → 'disbursed'
// 8. Send notifications
```

**Frontend:**
- Disbursement form
- Charge preview
- EMI schedule preview
- Bank account selection

### Sprint 8: Ledger & Notifications (Week 8)

#### Task 8.1: Double-Entry Ledger (Day 11-12)
```javascript
// ledgerService.js: postDisbursement(), postEmiPayment(), postPenalty(), postExpense()
// Dr/Cr entries with balancing validation
```

#### Task 8.2: Communication (Day 12-13)
```javascript
// sendEmail(), sendSms(), sendEmiReminder(), sendEmiOverdueAlert(),
// sendDisbursementNotification(), sendPaymentReceipt()
```

#### Task 8.3: Notifications (Day 13-14)
```javascript
// notificationService.js: createNotification(), getNotifications(), markAsRead()
```

### Sprint 7-8 Deliverables
- [x] Dynamic charge calculation (slabs)
- [x] EMI calculation engine
- [x] Disbursement flow
- [x] Double-entry ledger
- [x] EMI schedule generation
- [x] SMS/Email notifications
- [x] In-app notifications
- [x] PDF receipt/statement generation

---

## 7. Phase 5: EMI Collection (Sprint 9-10, 2 weeks)

### Sprint 9: Payment Recording (Week 9)

#### Task 9.1: EMI Payment (Day 1-3)
```javascript
// recordEmiPayment() — in transaction:
// 1. Lock EMI schedule row (FOR UPDATE)
// 2. Validate not already paid
// 3. Calculate allocation (principal/interest/penalty)
// 4. Record payment
// 5. Update EMI schedule
// 6. Create receipt
// 7. Post to ledger
// 8. Update loan balances
// 9. Create notification
// 10. Send receipt (SMS + Email)
```

#### Task 9.2: Overdue Detection (Day 3-4)
```javascript
// runOverdueDetection():
// UPDATE emi_schedules SET is_overdue=true, days_overdue=...
// WHERE is_paid=false AND due_date < CURRENT_DATE
// Apply penalties for overdue
```

#### Task 9.3: Customer Dues (Day 4-5)
```javascript
// getCustomerDues() — unpaid EMIs for customer portal
```

### Sprint 10: Collection (Week 10)

#### Task 10.1: Overdue Management (Day 8-9)
```javascript
// getOverdues() — with area/branch filters
```

#### Task 10.2: Collection Agent (Day 9-10)
```javascript
// Area-scoped overdue list for collection agents
```

#### Task 10.3: Loan Summary (Day 10)
```javascript
// getLoanSummary() — customer's complete loan portfolio
// Statement download
```

### Sprint 9-10 Deliverables
- [x] EMI payment recording
- [x] Payment receipt (PDF)
- [x] Overdue detection (cron)
- [x] Penalty management
- [x] Customer dues view
- [x] Overdues management
- [x] Collection agent dashboard
- [x] Loan summary/statements

---

## 8. Phase 6: Ledger & Reports (Sprint 11-12, 2 weeks)

### Sprint 11: Ledger (Week 11)

#### Task 11.1: Chart of Accounts (Day 1-2)
```sql
-- 15 seed accounts:
-- Assets: Cash, Bank-SBI, Bank-HDFC, Loan Portfolio, Customer Receivables
-- Liabilities: Payables, Provisions
-- Income: Interest, Processing Fee, Document Charge, Penalty
-- Expense: Salary, Rent, Office, Marketing, NPA Provision
-- Equity: Capital
```

#### Task 11.2: Journal Entries (Day 2-4)
```javascript
// createLedgerEntry() — validate SUM(dr) = SUM(cr)
```

#### Task 11.3: Auto-Posting (Day 4-5)
```javascript
// postDisbursement(), postEmiPayment(), postPenalty(), postExpense()
```

### Sprint 12: Reports (Week 12)

#### Task 12.1: Reports (Day 8-10)
```javascript
// getPortfolioReport() — total, by product, by branch, NPA stats
// getCollectionReport() — collected, rate, trends, by agent
// getNpaReport() — classifications with details
// getBranchReport() — per-branch comprehensive
// getAgentPerformance() — per-agent KPIs
// getLedgerReport() — income vs expenses
// getDashboardStats() — quick KPIs
```

### Sprint 11-12 Deliverables
- [x] Chart of accounts
- [x] Double-entry journal entries
- [x] Auto-posting
- [x] Account balances
- [x] Portfolio/Collection/NPA reports
- [x] PDF generation

---

## 9. Phase 7: Polish & Launch (Sprint 13-14, 2 weeks)

### Sprint 13: Customer Portal (Week 13)

#### Task 13.1: Customer Self-Service (Day 1-4)
```javascript
// getCustomerDashboard() — loans, dues, upcoming EMIs
// My Loans, My Dues, Payment History, Statements, Pay EMI
```

#### Task 13.2: Field Verification (Day 5-7)
```javascript
// Verification tasks with OSM + GPS
```

### Sprint 14: Testing & Launch (Week 14)

#### Task 14.1: Testing (Day 1-4)
| Type | Coverage | Tool |
|------|----------|------|
| Unit | All calculations | Jest |
| Integration | All API endpoints | Jest + supertest |
| E2E | Critical flows | Playwright |
| Load | Concurrent payments | Artillery |

#### Task 14.2: Data Migration (Day 5-6)
```sql
-- Export from old system, map to new schema, validate
```

#### Task 14.3: Chennai Go-Live (Day 7-10)
- All 50 tables created
- Super admin + Chennai HQ branch
- 3 areas (T Nagar, Adyar, Velachery)
- 3 loan products
- SMS + Email configured
- 10 pilot customers

### Sprint 13-14 Deliverables
- [x] Customer portal
- [x] Field verification with OSM
- [x] Test suite
- [x] Data migration scripts
- [x] Chennai go-live

---

## 10. Testing Strategy

### Critical Test Scenarios (P0)
| Scenario | Type |
|----------|------|
| EMI calculation (flat vs reducing) | Unit |
| Double-entry balancing | Integration |
| Approval limit enforcement | Unit |
| Overdue detection cron | Integration |
| Concurrent EMI payments | Load |
| Customer login + dues view | E2E |

### Coverage Targets
- Unit: 50%
- Integration: 15%
- E2E: 5%

---

## 11. Deployment Checklist

### Infrastructure
- [ ] Supabase project + migrations
- [ ] RLS policies
- [ ] Storage bucket

### Backend
- [ ] Env vars set
- [ ] Server starts
- [ ] Health check passes
- [ ] CORS configured

### Frontend
- [ ] Build succeeds
- [ ] Auth flow works
- [ ] Mobile responsive

### External
- [ ] SMS gateway configured
- [ ] Email SMTP configured
- [ ] Test SMS + Email sent

---

## 12. Post-Launch Plan

### Week 1: Monitoring
- Daily health checks
- Error log review
- Cron job verification

### Month 2: Scale
- 100+ customers
- 2nd branch
- UPI payment integration

### Month 3-6: Expansion
- Multi-branch
- WhatsApp integration
- AI credit scoring
- Mobile app (React Native)

---

## Implementation Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| Phase 0: Setup | 1 week | Infrastructure |
| Phase 1: Foundation | 2 weeks | 50 tables, Auth, Dashboard, Settings |
| Phase 2: Customer | 2 weeks | KYC, Banking, Wealth, Referrals |
| Phase 3: Application | 2 weeks | 16 topics, Workflow, Approval |
| Phase 4: Disbursement | 2 weeks | Dynamic charges, Ledger, EMI schedule |
| Phase 5: Collection | 2 weeks | Payments, Overdue, Penalties |
| Phase 6: Reports | 2 weeks | Ledger, Portfolio, NPA reports |
| Phase 7: Launch | 2 weeks | Customer portal, Testing, Go-live |
| **Total** | **15 weeks** | **Complete platform** |

---

*End of Implementation Plan v2.0*
*Continumm Micro Finance Pvt Ltd — Chennai*