# CMF — Architectural Design Document

## Continnum Microfinance Private Limited
**Version:** 1.0.0 — October 2026

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET / USERS                            │
└──────────┬──────────────┬──────────────┬──────────────┬────────────┘
           │              │              │              │
     ┌─────▼─────┐  ┌────▼────┐  ┌──────▼──────┐  ┌────▼────┐
     │  Browser  │  │ Mobile  │  │  Collection │  │ Admin   │
     │ (React)   │  │ Browser │  │   Mobile    │  │ Laptop  │
     └─────┬─────┘  └────┬────┘  └──────┬──────┘  └────┬────┘
           │              │              │              │
           └──────────────┴──────────────┴──────────────┘
                              │
                    ┌─────────▼──────────┐
                    │    Vite Dev Server  │
                    │  Port 5173 (Frontend) │
                    │  Proxy → :3001     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Express.js API   │
                    │    Port 3001       │
                    │  (Backend Server)  │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐     ┌──────▼──────┐   ┌───────▼──────┐
    │ Supabase  │     │  Twilio API │   │  SMTP/Email  │
    │PostgreSQL │     │   (SMS)     │   │   Server     │
    │  + Auth   │     └─────────────┘   └──────────────┘
    └───────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18.3 | UI framework |
| **Build Tool** | Vite 5 | Development server, bundling |
| **Routing** | React Router DOM 6 | Client-side routing |
| **State Management** | TanStack Query 5 | Server state, caching, background refetch |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **Components** | shadcn/ui | Pre-built accessible components |
| **Icons** | Lucide React | Icon library |
| **Maps** | React Leaflet + OpenStreetMap | GPS verification, field visits |
| **Charts** | Recharts | Dashboard charts |
| **Dates** | date-fns | Date formatting, manipulation |
| **HTTP** | Axios | API communication |

### 2.2 Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 20+ | JavaScript runtime |
| **Framework** | Express.js 4 | REST API server |
| **Database** | PostgreSQL 15 (Supabase) | Primary database |
| **Authentication** | JWT (jsonwebtoken) | Stateless auth with refresh tokens |
| **Password Hashing** | bcrypt | Password security |
| **Validation** | express-validator | Request validation |
| **Security** | Helmet, CORS, express-rate-limit | Security headers, rate limiting |
| **Email** | Nodemailer | SMTP email sending |
| **SMS** | Twilio SDK | SMS notifications |
| **PDF** | pdfkit | Receipt/statement PDF generation |
| **Scheduling** | node-cron | Daily overdue check, EMI reminders |
| **UUID** | uuid | Unique ID generation |

### 2.3 Database & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL 15 (Supabase) | Managed PostgreSQL |
| **Connection** | pg (node-postgres) | Database driver with pooling |
| **Storage** | Supabase Storage | Document uploads, photos, PDFs |
| **Hosting** | Supabase Cloud | Database + future Auth |
| **Backend Host** | Render / Railway / Vercel | Express API deployment |
| **Frontend Host** | Vercel / Netlify | React deployment |
| **CDN** | Vercel Edge / Cloudflare | Static asset delivery |

---

## 3. System Architecture (Layered)

### 3.1 Layers

```
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  React Components (shadcn/ui) + Tailwind CSS               │
│  Route Guards, Role-Based UI Rendering                     │
└────────────────────────┬───────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────┐
│                     API GATEWAY LAYER                       │
│  Express.js Router + CORS + Rate Limiting + Helmet         │
│  Request Validation (express-validator)                    │
└────────────────────────┬───────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────┐
│                   MIDDLEWARE LAYER                          │
│  JWT Authentication → Permission Check → Request Logger    │
│  Async Error Handler → Custom Error Responses              │
└────────────────────────┬───────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────┐
│                   SERVICE LAYER                             │
│  authService.js | applicationService.js | loanService.js   │
│  emiService.js | disbursementService.js | ledgerService.js │
│  communicationService.js | commonService.js                │
│  dashboardService.js                                       │
└────────────────────────┬───────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────┐
│                   DATA ACCESS LAYER                         │
│  PostgreSQL Connection Pool (pg Pool)                      │
│  Parameterized Queries (SQL Injection Prevention)          │
│  Transaction Management (withTransaction)                  │
└────────────────────────┬───────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────┐
│                   DATABASE LAYER                            │
│  PostgreSQL (Supabase) — 48 Tables                         │
│  Functions (generate_id, auto_generate_id)                 │
│  Triggers (19 triggers for auto-numbering)                 │
│  Views (v_customer_portal, v_dashboard_loan_summary)       │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow: Loan Application Submission

```
Customer (React)
  │ POST /api/applications
  │ Headers: Authorization: Bearer <token>
  │ Body: {product_id, loan_amount, tenure_months, ...}
  ▼
Express Router (routes/applications.js)
  │ validate() → asyncHandler()
  ▼
Middleware: authenticate() → loadPermissions()
  │ Verify JWT, attach user to req
  ▼
Controller → applicationService.createApplication()
  │ INSERT INTO applications ...
  │ INSERT INTO application_topics (16 topics, all as draft)
  │ INSERT INTO application_stages
  │ INSERT INTO audit_logs
  ▼
Database (PostgreSQL via Supabase)
  │ Triggers: auto_generate_id() → sets application_number
  ▼
Response: {id, application_number, status: "draft", topics: [...]}
  │ JSON response
  ▼
React → Update UI state, show application created
```

### 3.3 Data Flow: EMI Payment Recording

```
Collection Agent (React mobile)
  │ POST /api/emi/pay
  │ Body: {loan_id, emi_schedule_id, payment_amount, payment_method, ...}
  ▼
Express Router (routes/emi.js)
  ▼
Middleware: authenticate() → authorize('collection_agent', ...)
  ▼
Controller → emiService.recordEmiPayment()
  │ withTransaction:
  │   BEGIN
  │   INSERT INTO emi_payments
  │   UPDATE emi_schedules SET is_paid = true
  │   UPDATE loans SET principal_paid += ..., emi_paid_count += 1
  │   INSERT INTO payment_receipts
  │   createEmiLedgerEntry():
  │     INSERT INTO ledger_entries
  │     INSERT INTO ledger_entry_lines (2 lines: Debit EMI Collections, Credit Bank)
  │     UPDATE ledger_accounts SET current_balance
  │     INSERT INTO bank_statement_entries
  │   INSERT INTO audit_logs
  │   COMMIT
  ▼
Database (all changes atomically committed)
  ▼
Response: {paymentId, receiptId}
  │ Generate receipt PDF
  ▼
React → Show receipt, send SMS/email confirmation
```

---

## 4. Authentication & Authorization

### 4.1 JWT Flow

```
1. Login
   POST /api/auth/login
   {identifier, password}
   → Server verifies bcrypt hash
   → Returns {token (15min), refreshToken (7days), user}

2. Subsequent requests
   Authorization: Bearer <token>
   → Middleware verifies JWT
   → Attaches user to req.user

3. Token Refresh
   POST /api/auth/refresh
   {refreshToken}
   → Server validates refresh token from DB
   → Issues new access token

4. Logout
   → Client discards tokens
   → Server marks refresh token as revoked
```

### 4.2 Permission System

```
Roles (7) → Permissions (38) → Role_Permissions (junction)
                                    ↓
                          User Permission Overrides
                          (per-user grant/deny)
                                    ↓
                    authorize() middleware checks
                    req.user.permissions.has('module.action')
```

**Permission checking order:**
1. User-specific override (if set, use this)
2. Role-based permissions
3. Deny if no match

---

## 5. Database Architecture

### 5.1 Connection Management

```
┌─────────────────────────────────────┐
│     Supabase PostgreSQL             │
│  (Managed, connection-pooled)       │
│  Host: db.xxx.supabase.co:5432      │
└─────────────────────────────────────┘
          ▲
          │ pg Pool (min: 2, max: 20)
          │ idleTimeoutMillis: 30000
          │ connectionTimeoutMillis: 5000
┌─────────────────────────────────────┐
│     Express Backend                 │
│  src/config/db.js → pool.query()    │
│  withTransaction() for atomic ops   │
└─────────────────────────────────────┘
```

### 5.2 ID Generation Strategy

```
Application → application_number: APP0000001, APP0000002, ...
User → customer_code: CMF0000001, CMF0000002, ...
Loan → loan_number: LON0000001, LON0000002, ...
Disbursement → disbursement_number: DSB0000001, ...
EMI Payment → payment_number: PAY0000001, ...
EMI Receipt → receipt_number: RCP0000001, ...
Penalty → penalty_number: PEN0000001, ...
Ledger Entry → entry_number: LDG0000001, ...
Task → task_number: TSK0000001, ...
Verification → verification_number: VER0000001, ...
SMS → sms_number: SMS0000001, ...
Email → email_number: EML0000001, ...
Referral → referral_number: REF0000001, ...
Charge → charge_number: CHG0000001, ...
NPA → npa_number: NPA0000001, ...
Bank Reco → reconciliation_number: REC0000001, ...
Audit → audit_number: AUD0000001, ...
Branch → branch_code: BRN0000001, ...
Area → area_code: ARE0000001, ...
Product → product_code: PRD0000001, ...
Slab → slab_code: SLB0000001, ...
Bank Account → account_code: BNK0000001, ...
Ledger Account → account_code: LAC0000001, ...
```

**Implementation:**
- `id_counters` table tracks current sequence per prefix
- `generate_id(prefix)` function increments counter and returns formatted ID
- `auto_generate_id()` trigger fires BEFORE INSERT on relevant tables
- Separate IF/ELSIF blocks per table name to avoid cross-table field errors

### 5.3 Triggers

| Trigger | Table | Timing | Function | Purpose |
|---------|-------|--------|----------|---------|
| `trg_users_gen_id` | users | BEFORE INSERT | auto_generate_id | Generate customer_code |
| `trg_applications_gen_id` | applications | BEFORE INSERT | auto_generate_id | Generate application_number |
| `trg_loans_gen_id` | loans | BEFORE INSERT | auto_generate_id | Generate loan_number |
| `trg_disbursements_gen_id` | disbursements | BEFORE INSERT | auto_generate_id | Generate disbursement_number |
| `trg_emi_payments_gen_id` | emi_payments | BEFORE INSERT | auto_generate_id | Generate payment_number |
| `trg_payment_receipts_gen_id` | payment_receipts | BEFORE INSERT | auto_generate_id | Generate receipt_number |
| `trg_penalties_gen_id` | penalties | BEFORE INSERT | auto_generate_id | Generate penalty_number |
| `trg_ledger_entries_gen_id` | ledger_entries | BEFORE INSERT | auto_generate_id | Generate entry_number |
| `trg_verification_tasks_gen_id` | verification_tasks | BEFORE INSERT | auto_generate_id | Generate task_number |
| `trg_verifications_gen_id` | verifications | BEFORE INSERT | auto_generate_id | Generate verification_number |
| `trg_sms_logs_gen_id` | sms_logs | BEFORE INSERT | auto_generate_id | Generate sms_number |
| `trg_email_logs_gen_id` | email_logs | BEFORE INSERT | auto_generate_id | Generate email_number |
| `trg_referrals_gen_id` | referrals | BEFORE INSERT | auto_generate_id | Generate referral_number |
| `trg_disbursement_charges_gen_id` | disbursement_charges | BEFORE INSERT | auto_generate_id | Generate charge_number |
| `trg_npa_classifications_gen_id` | npa_classifications | BEFORE INSERT | auto_generate_id | Generate npa_number |
| `trg_bank_reconciliations_gen_id` | bank_reconciliations | BEFORE INSERT | auto_generate_id | Generate reconciliation_number |
| `trg_audit_logs_gen_id` | audit_logs | BEFORE INSERT | auto_generate_id | Generate audit_number |
| `trg_emi_schedules_overdue` | emi_schedules | BEFORE INSERT OR UPDATE | update_emi_overdue | Mark EMIs overdue |
| `trg_ledger_entry_lines_balance` | ledger_entry_lines | AFTER INSERT | update_ledger_balance | Update account balances |

---

## 6. API Architecture

### 6.1 Endpoint Structure

```
/api
  /auth
    POST /login              — Login
    POST /refresh            — Refresh token
    GET  /me                 — Current user profile
    PUT  /profile            — Update profile
    POST /change-password    — Change password
    GET  /users              — List users (admin)
    POST /users              — Create user (admin)

  /applications
    GET  /                   — List applications (with filters)
    GET  /:id                — Get application detail
    POST /                   — Create application
    PUT  /:id                — Update application
    GET  /:id/topics         — Get all 16 topics
    PUT  /:id/topics/:code   — Update specific topic
    GET  /:id/notes          — Get notes
    POST /:id/notes          — Add note
    POST /:id/approve        — Approve/reject/query

  /loans
    GET  /                   — List loans (with filters)
    GET  /:id                — Get loan detail
    GET  /:id/schedule       — Get EMI schedule
    GET  /summary/:customerId — Customer loan summary
    POST /                   — Create loan (disburse)
    POST /:id/foreclose      — Foreclose loan

  /emi
    POST /pay                — Record EMI payment
    GET  /customer/:id       — Customer EMI history
    GET  /customer/:id/dues  — Customer pending dues
    GET  /overdues           — All overdue EMIs (admin)
    POST /penalties          — Create penalty
    POST /update-overdue     — Trigger overdue update (cron)

  /disbursements
    GET  /                   — List disbursements
    POST /                   — Create disbursement
    POST /calculate-charges  — Calculate dynamic charges
    POST /calculate-emi      — Calculate EMI
    POST /check-eligibility  — Check eligibility

  /ledger
    GET  /accounts           — List ledger accounts
    GET  /entries            — List ledger entries
    POST /entries            — Create journal entry
    GET  /trial-balance      — Trial balance report
    GET  /bank-accounts      — List bank accounts
    POST /bank-accounts      — Add bank account

  /dashboard
    GET  /stats              — Dashboard statistics
    GET  /collection-stats   — Collection metrics
    GET  /approval-limits    — User's approval limits
    GET  /npa-stats          — NPA statistics

  /communication
    GET  /email-templates    — Email templates
    GET  /sms-templates      — SMS templates
    GET  /email-logs         — Email log history
    GET  /sms-logs           — SMS log history
    POST /send-email         — Send email
    POST /send-sms           — Send SMS
    POST /send-overdue-notifications — Bulk overdue notifications

  /tasks
    GET  /                   — List tasks (area-filtered)
    POST /                   — Create task
    PUT  /:id/complete       — Complete task

  /areas
    GET  /                   — List areas
    POST /                   — Create area
    GET  /:id/members        — Area members
    POST /:id/assign-leader  — Assign area leader
```

### 6.2 Response Format

**Success:**
```json
{ "success": true, "data": { ... }, "message": "..." }
```

**Error:**
```json
{ "error": "Error message", "details": "..." }
```

**List:**
```json
{ "total": 100, "limit": 50, "offset": 0, "data": [...] }
```

---

## 7. Frontend Architecture

### 7.1 Directory Structure

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx                    # App entry point
│   ├── App.jsx                     # Router + Layout
│   ├── index.css                   # Tailwind + theme
│   ├── pages/
│   │   ├── Login.jsx               # Login page
│   │   ├── Dashboard.jsx           # Role-based dashboard
│   │   ├── Applications/
│   │   │   ├── ApplicationList.jsx
│   │   │   ├── ApplicationForm.jsx
│   │   │   └── ApplicationDetail.jsx
│   │   ├── Loans/
│   │   │   ├── LoanList.jsx
│   │   │   └── LoanDetail.jsx
│   │   ├── EMI/
│   │   │   ├── EmiCollection.jsx
│   │   │   ├── Overdues.jsx
│   │   │   └── CustomerDues.jsx
│   │   ├── Disbursement/
│   │   │   ├── DisbursementList.jsx
│   │   │   └── DisbursementForm.jsx
│   │   ├── Ledger/
│   │   │   ├── Accounts.jsx
│   │   │   ├── JournalEntry.jsx
│   │   │   └── TrialBalance.jsx
│   │   ├── Areas/
│   │   │   ├── AreaList.jsx
│   │   │   └── AreaDetail.jsx
│   │   ├── Verification/
│   │   │   ├── TaskList.jsx
│   │   │   └── FieldVisit.jsx
│   │   ├── Communications/
│   │   │   ├── SmsPanel.jsx
│   │   │   └── EmailPanel.jsx
│   │   ├── Customer/
│   │   │   ├── CustomerPortal.jsx
│   │   │   └── PayEmi.jsx
│   │   └── Settings/
│   │       ├── Users.jsx
│   │       ├── Products.jsx
│   │       └── SystemSettings.jsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── PageHeader.jsx
│   │   ├── DataTable.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── RoleGuard.jsx         # Route protection
│   │   └── MapView.jsx           # Leaflet map
│   ├── lib/
│   │   ├── utils.js              # cn() helper
│   │   └── api.js                # Axios instance + interceptors
│   └── hooks/
│       ├── useAuth.js            # Auth state management
│       ├── usePermissions.js     # Permission checking
│       └── useApi.js             # API query helpers
```

### 7.2 State Management Strategy

```
┌──────────────────────────────────────────────────┐
│              React Query (TanStack Query)          │
│  — Server state (API data)                       │
│  — Caching, background refetch                   │
│  — Optimistic updates                            │
│  — Query keys for cache invalidation             │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              React Context                         │
│  — Auth context (user, token, login/logout)       │
│  — Theme context (dark/light mode)               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              Component State                       │
│  — useState for local UI state                    │
│  — useReducer for complex forms (application)    │
└──────────────────────────────────────────────────┘
```

### 7.3 Routing & Access Control

```
Route                         | Roles Allowed
──────────────────────────────|─────────────────────────
/login                        | All (unauthenticated)
/dashboard                    | All authenticated
/applications                 | All (view), FO+ (create)
/applications/:id             | All (view), FO+ (edit)
/loans                        | All (view), Admin+ (create)
/emi/collection               | CA, TL, Admin, Super
/emi/customer/:id/dues        | Customer (own only)
/disbursements                | Branch Admin, Super Admin
/ledger                       | Admin, Super Admin
/verification/tasks           | FO, CA (own), Admin+ (all)
/communication                | All (send: Admin+)
/customer/portal              | Customer only
/settings/users               | Admin, Super Admin
```

---

## 8. Security Architecture

### 8.1 Authentication Security

| Aspect | Implementation |
|--------|----------------|
| Password Storage | bcrypt with cost factor 10 |
| Access Token | JWT, 15-minute expiry |
| Refresh Token | JWT, 7-day expiry, stored in DB |
| Token Rotation | New refresh token on each refresh |
| Account Lockout | 5 failed attempts → lock for 15 minutes |
| Password Policy | Minimum 8 characters |
| Session Management | Refresh tokens stored in DB, revocable |

### 8.2 Authorization Security

| Aspect | Implementation |
|--------|----------------|
| RBAC | Role-based permissions via middleware |
| Data Filtering | Area-based row-level filtering |
| API Protection | All routes except /auth/* require authentication |
| CORS | Whitelist specific origins |
| Rate Limiting | 100 requests per 15 minutes per IP |

### 8.3 Data Security

| Aspect | Implementation |
|--------|----------------|
| SQL Injection | Parameterized queries only (pg prepared statements) |
| XSS Prevention | React auto-escaping, Helmet CSP headers |
| PII Encryption | Aadhaar, PAN encrypted at rest (Supabase) |
| HTTPS Only | Enforce HTTPS in production |
| Audit Logging | Every financial action logged with user, IP, timestamp |

---

## 9. Deployment Architecture

### 9.1 Development Environment

```
┌──────────────────────────────────────┐
│         Developer Machine            │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ Vite :5173  │  │ Express     │   │
│  │ (Frontend)  │◄─│ :3001       │   │
│  │             │  │ (Backend)   │   │
│  └─────────────┘  └──────┬──────┘   │
│                          │           │
│                   ┌──────▼──────┐   │
│                   │ Supabase    │   │
│                   │ PostgreSQL  │   │
│                   └─────────────┘   │
└──────────────────────────────────────┘
```

### 9.2 Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    CDN (Vercel/Cloudflare)               │
│              Static assets, React build                  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│              Frontend (Vercel/Netlify)                   │
│              React SPA, served as static                 │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│              Backend (Render/Railway)                    │
│              Express.js API Server                       │
│              - Auto-scaling                              │
│              - Health checks                             │
│              - Environment variables                     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│              Supabase Cloud                              │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │   PostgreSQL    │  │   Storage       │               │
│  │   (Managed)     │  │   (Files)       │               │
│  └─────────────────┘  └─────────────────┘               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         External Services                               │
│  Twilio (SMS) | SMTP (Email) | OSM (Maps)               │
└─────────────────────────────────────────────────────────┘
```

### 9.3 Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgres://...        # Supabase connection string
JWT_SECRET=<strong-random-key>     # JWT signing key
PORT=3001                           # Server port
NODE_ENV=production                 # Environment
FRONTEND_URL=https://cmf.app       # CORS origin
TWILIO_ACCOUNT_SID=...              # Twilio credentials
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+91...
SMTP_HOST=smtp.gmail.com            # Email SMTP
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.cmf.app/api
VITE_GOOGLE_MAPS_API_KEY=...
VITE_APP_NAME=CMF
```

---

## 10. Background Jobs & Scheduling

### 10.1 Cron Jobs (node-cron)

| Job | Schedule | Function |
|-----|----------|----------|
| **Overdue Update** | Daily at 00:00 | Mark EMIs as overdue, calculate penalties |
| **EMI Reminder SMS** | Daily at 09:00 | Send SMS for EMIs due in 3 days |
| **EMI Due SMS** | Daily at 09:00 | Send SMS for EMIs due today |
| **Overdue Notification** | Daily at 10:00 | Escalate overdue EMIs (customer + agents + TL) |
| **Cleanup** | Weekly at 02:00 | Clean expired tokens, old logs |

### 10.2 Trigger-Based Automation

| Trigger | Event | Action |
|---------|-------|--------|
| `before_emi_schedule_insert` | New EMI created | Calculate overdue if due_date < today |
| `after_ledger_entry_lines_insert` | Entry created | Update ledger account balance |

---

## 11. Error Handling & Logging

### 11.1 Error Response Format

```json
{
  "error": "Validation Error",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "status": 400
}
```

### 11.2 Error Categories

| Code | Category | Handling |
|------|----------|----------|
| 400 | Validation | express-validator |
| 401 | Auth | Token missing/invalid/expired |
| 403 | Authorization | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate unique value |
| 422 | Business Rule | Validation fails business logic |
| 429 | Rate Limit | Too many requests |
| 500 | Server Error | Unexpected error, logged |

---

*Document version: 1.0.0 | Last updated: October 2026*
