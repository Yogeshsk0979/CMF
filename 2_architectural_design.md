# Continumm Micro Finance Pvt Ltd
# Architectural Design — System Design Document v2.0

**Document Version:** 2.0  
**Date:** October 2026  
**Architecture:** Layered REST API + React SPA  
**Database:** PostgreSQL 48 tables, UUID PKs, 10-digit IDs

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [System Architecture](#2-system-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Integration Architecture](#7-integration-architecture)
8. [File Storage Architecture](#8-file-storage-architecture)
9. [Scheduler Architecture](#9-scheduler-architecture)
10. [API Design](#10-api-design)
11. [Error Handling](#11-error-handling)
12. [Security Architecture](#12-security-architecture)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Performance & Scalability](#14-performance--scalability)
15. [Monitoring & Observability](#15-monitoring--observability)

---

## 1. Architecture Principles

| Principle | Application |
|-----------|-------------|
| **Separation of Concerns** | Routes → Services → DB layers independent |
| **Single Responsibility** | Each service handles one domain |
| **Transaction Safety** | All financial ops use DB transactions |
| **Audit Everything** | Every mutation logged to audit_logs |
| **Fail-Safe Defaults** | Deny by default, RBAC on every endpoint |
| **Idempotency** | Retry-safe operations |

### Architecture Pattern
```
Client Request → CORS/Helmet/RateLimit → Auth Middleware → Authorize Middleware
  → Route Handler (asyncHandler) → Service Layer → Data Access Layer → PostgreSQL
```

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INTERNET / USERS                                │
│  React SPA (shadcn/ui) │ Mobile Web │ Customer Portal │ Lender Portal    │
└──────────────────────────┬────────────────────┬──────────────────────────┘
                           │                    │
                    ┌──────▼────────────────────▼──────────┐
                    │    SUPABASE CLOUD PLATFORM            │
                    │  ┌─────────────────────────────────┐  │
                    │  │  Express.js (14 route modules)   │  │
                    │  │  15 service modules (130+ funcs) │  │
                    │  │  PostgreSQL (48 tables, UUID PKs) │  │
                    │  │  Supabase Auth + Storage          │  │
                    │  └─────────────────────────────────┘  │
                    └──────────────────────────────────────┘
                           │
                    ┌──────▼──────────────────────┐
                    │   EXTERNAL APIs              │
                    │  Aadhaar eKYC │ PAN │ SMS   │
                    │  MSG91 │ Email SMTP │ OSM    │
                    └──────────────────────────────┘
```

---

## 3. Backend Architecture

### 3.1 Directory Structure
```
backend/
├── src/
│   ├── config/db.js                    # PostgreSQL pool
│   ├── middleware/auth.js               # JWT verification
│   ├── middleware/validation.js         # Error handler, async wrapper
│   ├── routes/ (14 files)
│   │   ├── auth.js, applications.js, loans.js, emi.js
│   │   ├── disbursements.js, ledger.js, dashboard.js
│   │   ├── communication.js, tasks.js, areas.js
│   │   ├── settings.js, cron.js, reports.js, upload.js, notifications.js
│   ├── services/ (15 files)
│   │   ├── authService.js (8 funcs)
│   │   ├── applicationService.js (15 funcs)
│   │   ├── loanService.js (8 funcs)
│   │   ├── emiService.js (8 funcs)
│   │   ├── disbursementService.js (6 funcs)
│   │   ├── ledgerService.js (21 funcs)
│   │   ├── communicationService.js (14 funcs)
│   │   ├── pdfService.js (6 funcs)
│   │   ├── cronService.js (6 funcs)
│   │   ├── commonService.js (areas, products, tasks)
│   │   ├── dashboardService.js (7 funcs)
│   │   ├── reportsService.js (7 funcs)
│   │   ├── uploadService.js (3 funcs)
│   │   ├── notificationService.js (6 funcs)
│   ├── server.js                       # Express entry point
├── scripts/
│   ├── migrations.sql                   # 48 tables, functions, triggers
│   ├── patch_missing_tables.sql         # Additional tables
│   ├── patch_notifications.sql          # Notifications table
│   ├── seed_data.sql                    # Basic seed
│   ├── seed_chennai_data.sql            # Chennai sample data
│   ├── clean_database.sql               # Drop all tables
│   ├── setup.sh                         # Setup script
├── .env.example                         # Environment template
└── package.json                         # Dependencies
```

### 3.2 Service Layer (130+ functions)

| Service | Functions | Purpose |
|---------|-----------|---------|
| authService.js | 8 | Auth, users, RBAC |
| applicationService.js | 15 | Applications, topics, stages, approval |
| loanService.js | 8 | Loan CRUD, schedule, summary, foreclosure |
| emiService.js | 8 | Payment, overdue, penalties, dues |
| disbursementService.js | 6 | Disbursement, charges, EMI calc, eligibility |
| ledgerService.js | 21 | Double-entry, accounts, bank, balances |
| communicationService.js | 14 | SMS, Email, templates, logs |
| pdfService.js | 6 | Receipts, statements HTML generation |
| cronService.js | 6 | Scheduled jobs, scheduler |
| commonService.js | 12 | Areas, products, tasks, referrals |
| dashboardService.js | 7 | Stats, stages, NPA |
| reportsService.js | 7 | Portfolio, collection, NPA, branch |
| uploadService.js | 3 | Document upload mock |
| notificationService.js | 6 | Create, read, mark read notifications |

### 3.3 Layered Request Flow

```
Client Request
  → CORS/Helmet/RateLimit (security)
  → Body Parser (JSON, 10MB)
  → Auth Middleware (JWT → req.user)
  → Authorize Middleware (role check)
  → Route Handler (validation, response formatting)
  → Service Layer (business logic, transactions)
  → Data Access Layer (parameterized queries)
  → PostgreSQL (Supabase)
```

---

## 4. Frontend Architecture

### 4.1 Tech Stack
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| React Router 6 | Client-side routing |
| shadcn/ui (40+ components) | Component library |
| Tailwind CSS | Styling |
| Recharts | Data visualization |
| Axios | HTTP client |
| React Hook Form | Form management |
| React-Leaflet | OpenStreetMap |
| Sonner | Toast notifications |
| Lucide React | Icons |
| date-fns | Date formatting |
| @tanstack/react-query | Server state |

### 4.2 Directory Structure
```
frontend/src/
├── App.jsx                    # Main app with role-based routing
├── main.jsx                   # Entry point
├── hooks/
│   ├── useAuth.js             # Authentication hook
│   ├── useApi.js              # API call hooks
│   └── usePermissions.js      # Permission checking
├── components/
│   ├── Sidebar.jsx, Header.jsx, RoleGuard.jsx
│   ├── SectionCards.jsx, ChartAreaInteractive.jsx, DataTable.jsx
│   └── ui/                    # 40+ shadcn/ui components
├── lib/
│   ├── api.js                 # Axios instance with interceptor
│   └── utils.js               # Helpers
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── applications/ (ApplicationList, ApplicationForm, ApplicationDetail)
│   ├── loans/ (LoanList, LoanDetail, EmiSchedule)
│   ├── emi/ (EmiCollection, Overdues, CustomerDues)
│   ├── disbursements/ (DisbursementList, DisbursementForm)
│   ├── ledger/ (LedgerPage, LedgerDetail, JournalEntry, LedgerAccounts, TrialBalance)
│   ├── tasks/ (TaskList)
│   ├── areas/ (AreaList)
│   ├── customers/ (CustomerList)
│   ├── products/ (ProductList)
│   ├── reports/ (ReportsPage)
│   ├── settings/ (SettingsPage, UsersList)
│   ├── verification/ (VerificationList, FieldVisit)
│   ├── communication/ (SmsPanel, EmailPanel)
│   ├── customer/ (CustomerPortal, PayEmi)
│   ├── notifications/ (NotificationPage)
```

### 4.3 Routing

```
Staff Layout (authenticated, non-customer)
  ├── /dashboard → Dashboard
  ├── /applications → ApplicationList
  ├── /applications/new → ApplicationForm
  ├── /applications/:id → ApplicationDetail
  ├── /loans → LoanList
  ├── /loans/:id → LoanDetail
  ├── /loans/:id/schedule → EmiSchedule
  ├── /emi → EmiCollection
  ├── /emi/overdues → Overdues
  ├── /disbursements → DisbursementList
  ├── /disbursements/new/:loanId → DisbursementForm
  ├── /ledger → LedgerPage
  ├── /ledger/:accountId → LedgerDetail
  ├── /tasks → TaskList
  ├── /areas → AreaList
  ├── /products → ProductList
  ├── /reports → ReportsPage
  ├── /customers → CustomerList
  ├── /settings → SettingsPage
  ├── /notifications → NotificationPage
  └── /verification → VerificationList

Customer Layout
  └── /customer/portal → CustomerPortal
```

### 4.4 State Management
| Data Type | Approach | Tool |
|-----------|----------|------|
| Auth State | React Context | useAuth hook |
| Server State | React Query | Custom hooks with axios |
| Form State | Local | React Hook Form |
| UI State | Local | useState |

---

## 5. Database Architecture

### 5.1 Schema Design Philosophy
1. **UUID Primary Keys** — All tables use UUID v4
2. **10-digit Human-readable IDs** — Via `generate_id()` function + id_counters
3. **JSONB for Flexibility** — Addresses, topic data, verification findings
4. **Enum Types** — user_role_enum, gender_enum, marital_status_enum, etc.
5. **Audit Everywhere** — created_at, updated_at on all tables
6. **Soft Delete** — is_active flags
7. **Reference Integrity** — FKs with CASCADE/RESTRICT as appropriate

### 5.2 ID System
```sql
-- Counter table (17 prefixes)
INSERT INTO id_counters (prefix, entity_name) VALUES
  ('CMF', 'customer'), ('APP', 'application'), ('LON', 'loan'),
  ('DSB', 'disbursement'), ('PAY', 'emi_payment'), ('RCP', 'payment_receipt'),
  ('PEN', 'penalty'), ('LDG', 'ledger_entry'), ('TSK', 'verification_task'),
  ('VER', 'verification_report'), ('SMS', 'sms_log'), ('EML', 'email_log'),
  ('REF', 'referral'), ('CHG', 'disbursement_charge'),
  ('NPA', 'npa_classification'), ('REC', 'bank_reconciliation'), ('AUD', 'audit_log');

-- Usage: SELECT generate_id('APP') → 'APP1000001'
```

### 5.3 Key Database Features
- **Stage Workflow Engine:** Configurable stages with required_roles, SLA hours
- **Product Slabs:** Dynamic charge brackets per loan amount range
- **Application Topics:** 16 JSONB sections per application
- **Approval Limits:** Per-role, per-product limits with effective dates
- **Double-Entry Ledger:** Balanced journal entries with account groups
- **Trust Scores:** Multi-factor scoring (team, community, repayment)
- **Login Audit:** Complete authentication history

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow
```
1. POST /api/auth/login → verify username + bcrypt hash
2. Return JWT access_token + refresh_token
3. Store in localStorage (cmf_token, cmf_refresh)
4. All API calls: Authorization: Bearer <token>
5. On 401: POST /api/auth/refresh → new access_token
6. Password: bcrypt with gen_salt('bf')
```

### 6.2 Authorization Model
| Layer | Mechanism |
|-------|-----------|
| Route Level | `authorize('role1', 'role2')` middleware |
| Row Level | Supabase RLS policies |
| Field Level | Service-level checks |
| Limit Level | approval_limits table (financial thresholds) |

### 6.3 Role Enum
```sql
CREATE TYPE user_role_enum AS ENUM (
  'super_admin', 'branch_admin', 'team_leader',
  'field_officer', 'collection_agent', 'customer', 'lender'
);
```

---

## 7. Integration Architecture

### 7.1 External Integrations
| Service | Purpose | Auth |
|---------|---------|------|
| Aadhaar eKYC | Customer identity verification | AUA/KUA license |
| PAN (NSDL/UTIITSL) | PAN validation | API Key |
| MSG91/Twilio | SMS delivery | API Key |
| SMTP/Resend | Email delivery | API Key |
| OpenStreetMap | Field verification coordinates | Free |

### 7.2 OpenStreetMap Integration
- Leaflet for map display
- GPS coordinate capture at field visits
- Coordinate verification against applicant's stated address
- Flag if > 5km from stated address

---

## 8. File Storage Architecture

### 8.1 Supabase Storage Structure
```
cmf-documents bucket
├── kyc/aadhaar_front_{code}_{timestamp}.jpg
├── kyc/aadhaar_back_{code}_{timestamp}.jpg
├── kyc/pan_{code}_{timestamp}.jpg
├── photos/customer_photo_{code}_{timestamp}.jpg
├── statements/bank_statement_{code}_{month}.pdf
├── applications/{docType}_{number}_{index}.pdf
├── verification/site_photo_{taskId}_{index}.jpg
```

---

## 9. Scheduler Architecture

### 9.1 Cron Jobs
```
Every hour at :07:
  1. runOverdueDetection()
     → Update is_overdue=true, days_overdue
     → Apply penalties
     → Auto-classify 90+ day loans as NPA
     → Notify branch admins

  2. runEmiReminders()
     → Find EMIs due in next 3 days
     → Send SMS + email reminders

  3. runDailyCollectionReport()
     → Daily collection summary
```

### 9.2 Safety
- `isSchedulerActive` flag prevents concurrent runs
- Error isolation per job
- Job history tracking
- Manual trigger via `/api/cron/run-all`

---

## 10. API Design

### 10.1 Complete API Reference

```
AUTH
  POST   /api/auth/login
  POST   /api/auth/refresh
  GET    /api/auth/profile
  PUT    /api/auth/profile
  POST   /api/auth/change-password
  GET    /api/auth/permissions

APPLICATIONS
  GET    /api/applications
  POST   /api/applications
  GET    /api/applications/:id
  PUT    /api/applications/:id
  GET    /api/applications/:id/topics
  PUT    /api/applications/:id/topics/:code
  POST   /api/applications/:id/submit
  POST   /api/applications/:id/approve
  POST   /api/applications/:id/reject
  POST   /api/applications/:id/query
  GET    /api/applications/:id/notes
  POST   /api/applications/:id/notes
  GET    /api/applications/:id/documents
  POST   /api/applications/:id/documents
  DELETE /api/applications/documents/:id
  GET    /api/applications/:id/history
  GET    /api/applications/approval-limits

LOANS
  GET    /api/loans
  POST   /api/loans
  GET    /api/loans/:id
  GET    /api/loans/:id/schedule
  GET    /api/loans/summary/:customerId
  POST   /api/loans/:id/foreclose

EMI
  POST   /api/emi/pay
  GET    /api/emi/customer/:id
  GET    /api/emi/customer/:id/dues
  GET    /api/emi/overdues
  POST   /api/emi/penalties
  POST   /api/emi/update-overdue

DISBURSEMENTS
  GET    /api/disbursements
  POST   /api/disbursements
  GET    /api/disbursements/:id
  POST   /api/disbursements/calculate
  POST   /api/disbursements/eligibility

LEDGER
  GET    /api/ledger/accounts
  POST   /api/ledger/accounts
  GET    /api/ledger/entries
  POST   /api/ledger/entries
  GET    /api/ledger/trial-balance
  GET    /api/ledger/bank-accounts
  POST   /api/ledger/bank-accounts

DASHBOARD
  GET    /api/dashboard/stats
  GET    /api/dashboard/collection
  GET    /api/dashboard/approval-limits
  GET    /api/dashboard/npa
  GET    /api/dashboard/stages
  GET    /api/dashboard/stages/:appId

COMMUNICATION
  GET    /api/communication/email-templates
  GET    /api/communication/sms-templates
  GET    /api/communication/email-logs
  GET    /api/communication/sms-logs
  POST   /api/communication/send-email
  POST   /api/communication/send-sms
  POST   /api/communication/send-bulk-sms
  POST   /api/communication/overdue-notifications
  POST   /api/communication/render-template

TASKS
  GET    /api/tasks
  POST   /api/tasks
  PUT    /api/tasks/:id/complete

AREAS
  GET    /api/areas
  POST   /api/areas
  POST   /api/areas/:id/assign-leader
  GET    /api/areas/:id/members

SETTINGS
  GET    /api/settings/products
  POST   /api/settings/products
  PUT    /api/settings/products/:id
  DELETE /api/settings/products/:id
  GET    /api/settings/users
  POST   /api/settings/users
  PUT    /api/settings/users/:id

CRON
  POST   /api/cron/run-all
  POST   /api/cron/overdue-detection
  POST   /api/cron/emi-reminders
  POST   /api/cron/daily-report
  GET    /api/cron/history

REPORTS
  GET    /api/reports/portfolio
  GET    /api/reports/collection
  GET    /api/reports/npa
  GET    /api/reports/branch/:id
  GET    /api/reports/agent/:id
  GET    /api/reports/ledger
  GET    /api/reports/dashboard

UPLOAD
  POST   /api/upload/upload
  GET    /api/upload/application/:id
  GET    /api/upload/customer/:id
  DELETE /api/upload/:id

NOTIFICATIONS
  GET    /api/notifications
  PUT    /api/notifications/:id/read
  PUT    /api/notifications/read-all
  DELETE /api/notifications/:id
  GET    /api/notifications/unread-count
```

---

## 11. Error Handling

### Error Response Format
```json
{
  "error": "Validation Error",
  "message": "Loan amount exceeds product maximum",
  "statusCode": 400,
  "details": { "field": "loan_amount", "max_allowed": 100000, "provided": 150000 }
}
```

### Known Error Codes
| PG Error Code | Meaning | HTTP Status |
|---------------|---------|-------------|
| 23505 | Unique violation | 409 |
| 23503 | Foreign key violation | 400 |
| 23502 | Not null violation | 400 |

---

## 12. Security Architecture

### Security Layers
| Layer | Implementation |
|-------|---------------|
| Transport | HTTPS/TLS 1.3 |
| Authentication | Supabase Auth JWT |
| Authorization | RBAC via role_permissions + authorize() middleware |
| Data Access | Supabase RLS policies |
| Input Validation | Express validation middleware |
| SQL Injection | Parameterized queries ONLY |
| Rate Limiting | express-rate-limit (100/15min) |
| CORS | Whitelisted origins |
| Headers | Helmet.js |
| Secrets | Environment variables |

### Financial Transaction Safety
```javascript
withTransaction(async (client) => {
  await client.query('SELECT ... FOR UPDATE', [params]);
  // validate
  // insert/update
  // create ledger entries
  // update balances
  // log audit
  // auto-commit or auto-rollback
});
```

---

## 13. Deployment Architecture

```
Domain: cmf.app
  └── Vercel (CDN + React SPA)
       └── Railway/Render (Express.js API)
            └── Supabase Cloud (PostgreSQL + Auth + Storage)
```

### Environment Variables
| Variable | Purpose |
|----------|---------|
| SUPABASE_URL | Project URL |
| SUPABASE_ANON_KEY | Public key |
| SUPABASE_SERVICE_KEY | Server admin key |
| PORT | Backend port (3001) |
| NODE_ENV | production/development |
| FRONTEND_URL | CORS origin |
| SMS_API_KEY | MSG91/Twilio key |
| EMAIL_API_KEY | Resend/SendGrid key |

---

## 14. Performance & Scalability

| Metric | Target | Strategy |
|--------|--------|----------|
| API response | < 500ms | Connection pooling, indexes |
| Page load | < 2s | Code splitting, CDN |
| DB query | < 100ms | Index optimization |
| Concurrent users | 10,000 | Connection pool scaling |

### Scalability Roadmap
```
v1: Monolithic on Supabase (current)
v2 (10K users): Pool=50, read replicas, Redis cache
v3 (50K users): Read/write DBs, BullMQ, CDN
v4 (100K+ users): Microservices, Kafka, sharding
```

---

## 15. Monitoring & Observability

| Tool | Purpose |
|------|---------|
| Supabase Dashboard | DB performance, auth |
| Vercel Analytics | Frontend performance |
| Railway Logs | Backend logs |
| Sentry (optional) | Error tracking |
| UptimeRobot | Uptime monitoring |

---

*End of Architectural Design v2.0*
*Continumm Micro Finance Pvt Ltd — Chennai*