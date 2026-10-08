# CMF — Architectural Design
**Chennai Microfinance Platform — System Architecture & Technical Design**

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | SPA framework |
| **UI Library** | shadcn/ui + Tailwind CSS | Component library & styling |
| **State Management** | TanStack Query (React Query) | Server state, caching, mutations |
| **Client-side Routing** | React Router v7 | Navigation |
| **Forms** | React Hook Form + Zod | Form validation |
| **Charts** | Recharts | Dashboard analytics |
| **Maps** | Leaflet / React-Leaflet + OpenStreetMap | GPS verification |
| **PDF Generation** | jsPDF | Statements & receipts |
| **Backend** | Express.js (Node.js) | REST API server |
| **Database** | PostgreSQL (Supabase) | Primary data store |
| **Auth** | Express.js + JWT (custom) | Authentication & authorization (JWT in DB) |
| **Token Storage** | `jwt_refresh_tokens` table | Refresh tokens stored in DB |
| **File Storage** | Supabase Storage | Document uploads |
| **Email** | SendGrid / AWS SES | Email notifications |
| **SMS** | MSG91 / Twilio | SMS notifications |
| **Payment** | Razorpay / PayU | Online EMI payments |
| **Hosting** | Vercel (frontend) + Render/Railway (backend) | Deployment |
| **CI/CD** | GitHub Actions | Automated deployment |

---

## 2. Folder Structure

```
CMF/
├── backend/                          # Express.js API Server
│   ├── src/
│   │   ├── config/
│   │   │   └── supabaseClient.js     # Supabase initialization
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── rbac.js               # Role-based access control
│   │   │   ├── validate.js           # Zod schema validation
│   │   │   └── errorHandler.js       # Global error handling
│   │   ├── routes/
│   │   │   ├── auth.js               # Login, logout, token refresh
│   │   │   ├── areas.js              # Area CRUD + leader assignment
│   │   │   ├── applications.js       # Full application lifecycle
│   │   │   ├── loans.js              # Loan creation, EMI schedule
│   │   │   ├── emi.js                # EMI collection, overdue
│   │   │   ├── disbursements.js      # Disbursement with charges
│   │   │   ├── ledger.js             # Chart of accounts, journal entries
│   │   │   ├── reports.js            # All reports
│   │   │   ├── tasks.js              # Task assignment & tracking
│   │   │   ├── verification.js       # Field verification, GPS
│   │   │   ├── communication.js      # SMS & Email logs/templates
│   │   │   ├── users.js              # User CRUD (admin)
│   │   │   ├── settings.js           # Products, charges, approval limits
│   │   │   ├── dashboard.js          # Dashboard stats APIs
│   │   │   └── health.js             # Health check
│   │   ├── services/
│   │   │   ├── emiCalculator.js      # EMI calculation engine (calls calculate_emi)
│   │   │   ├── eligibilityEngine.js  # Eligibility calculation
│   │   │   ├── ledgerEngine.js       # Double-entry bookkeeping
│   │   │   ├── notificationService.js # SMS/Email orchestration
│   │   │   ├── idGenerator.js        # Calls generate_id() for new entities
│   │   │   └── pdfGenerator.js       # Statement/receipt PDFs
│   │   ├── jobs/
│   │   │   └── overdueJob.js         # Cron: detect overdue EMIs daily
│   │   └── server.js                 # App entry point
│   ├── scripts/
│   │   ├── migrations.sql            # Full schema (001: tables, 002: triggers, 003: seed)
│   │   ├── migrations_part1.sql      # Partial: counters + types only
│   │   ├── patch_missing_tables.sql  # Patch: adds disbursements, loans, etc.
│   │   └── clean_database.sql        # Reset: drop all tables & functions
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                          # React SPA
│   ├── src/
│   │   ├── main.jsx                  # App entry, providers
│   │   ├── App.jsx                   # Routes configuration
│   │   ├── lib/
│   │   │   ├── api.js                # Axios instance + interceptors
│   │   │   ├── utils.js              # formatCurrency, formatDate, etc.
│   │   │   └── constants.js          # Enums, role constants
│   │   ├── hooks/
│   │   │   ├── useAuth.js            # Auth context & hook
│   │   │   └── usePermissions.js     # Permission-based rendering
│   │   ├── components/
│   │   │   ├── app-sidebar.jsx
│   │   │   ├── site-header.jsx
│   │   │   ├── nav-main.jsx
│   │   │   ├── nav-user.jsx
│   │   │   ├── data-table.jsx
│   │   │   ├── chart-area-interactive.jsx
│   │   │   ├── section-cards.jsx
│   │   │   └── ui/                   # shadcn/ui components
│   │   │       ├── button.jsx
│   │   │       ├── card.jsx
│   │   │       ├── table.jsx
│   │   │       ├── checkbox.jsx
│   │   │       ├── drawer.jsx
│   │   │       ├── dropdown-menu.jsx
│   │   │       ├── input.jsx
│   │   │       ├── label.jsx
│   │   │       ├── select.jsx
│   │   │       ├── separator.jsx
│   │   │       ├── sheet.jsx
│   │   │       ├── sidebar.jsx
│   │   │       ├── skeleton.jsx
│   │   │       ├── sonner.jsx
│   │   │       ├── badge.jsx
│   │   │       ├── avatar.jsx
│   │   │       ├── breadcrumb.jsx
│   │   │       ├── tabs.jsx
│   │   │       ├── toggle-group.jsx
│   │   │       └── ...
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── applications/
│   │   │   ├── loans/
│   │   │   ├── emi/
│   │   │   ├── disbursements/
│   │   │   ├── ledger/
│   │   │   ├── tasks/
│   │   │   ├── verification/
│   │   │   ├── areas/
│   │   │   ├── communication/
│   │   │   ├── customer/
│   │   │   └── settings/
│   │   └── index.css                 # Global styles + Tailwind
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── components.json               # shadcn/ui config
│   ├── package.json
│   └── index.html
│
├── docs/                              # Documentation
│   ├── 01_Project_Analysis.md
│   ├── 02_Architectural_Design.md
│   ├── 03_Database_Design.md
│   └── 04_Implementation_Plan.md
│
└── .gitignore
```

---

## 3. Authentication & Authorization Flow

```
┌──────────┐       ┌──────────────┐       ┌─────────────┐
│  Client   │──POST──▶  Express.js  │──verify▶ Password / JWT Check │
│ (React)   │       │  /api/auth   │       │             │
└──────────┘       └──────┬───────┘       └─────────────┘
                           │
                    Returns JWT + user role
                           │
              ┌────────────▼────────────┐
              │   Frontend stores       │
              │   token in memory       │
              └────────────┬────────────┘
                           │
              All subsequent requests:
              Authorization: Bearer <jwt>
                           │
              ┌────────────▼────────────┐
              │  RBAC Middleware        │
              │  1. Verify JWT         │
              │  2. Extract role       │
              │  3. Check permission   │
              │  4. Apply RLS filter   │
              └────────────────────────┘
```

### 3.1 Permission Middleware

```javascript
// middleware/rbac.js
// Permissions are stored in the database (roles, permissions, role_permissions,
// user_permission_overrides). The middleware loads effective permissions per user
// from the database and caches them in Redis/memory.

async function checkPermission(userId, requiredPermission) {
  // 1. Get user role
  const user = await db.users.findById(userId)
  if (user.role === 'super_admin') return true  // Bypass all checks

  // 2. Check role-level permissions
  const rolePerms = await db.role_permissions.findByRole(user.role)
  if (rolePerms.includes(requiredPermission)) return true

  // 3. Check user-level overrides
  const overrides = await db.user_permission_overrides.findByUser(userId)
  if (overrides.hasOwnProperty(requiredPermission)) {
    return overrides[requiredPermission]  // true or false
  }

  return false
}
```

**Role-based permission matrix (from `roles` + `permissions` tables):**

| Role | Module Access |
|------|---------------|
| **super_admin** | All modules — bypass all checks |
| **branch_admin** | Dashboard, branches, areas, users, products, applications, disbursements, emi, ledger, banks, reconciliation, tasks, sms, email, reports, settings |
| **team_leader** | Dashboard, areas, users, applications, emi, tasks, reports |
| **field_officer** | Dashboard, areas, applications (create/edit), emi, tasks |
| **collection_agent** | Dashboard, emi (collect), tasks |
| **customer** | Own dashboard, own applications, own loans, own EMI, own payments |
| **lender** | Dashboard, reports (loan portfolio) |

---

## 4. API Design (RESTful)

### 4.1 Base URL
```
/api/v1
```

### 4.2 Authentication Headers
```
Authorization: Bearer <jwt_token>
```

### 4.3 Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": { "page": 1, "total": 50 }
}
```

### 4.4 Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Aadhaar number is required",
    "details": { "field": "aadhaar_number" }
  }
}
```

### 4.5 Core Endpoints

#### Applications
```
POST   /api/v1/applications              Create application
GET    /api/v1/applications              List (filtered by role)
GET    /api/v1/applications/:id          Get detail
PUT    /api/v1/applications/:id          Update application
POST   /api/v1/applications/:id/upload   Upload documents
POST   /api/v1/applications/:id/stage    Advance stage
POST   /api/v1/applications/:id/query    Raise query
POST   /api/v1/applications/:id/approve  Approve application
POST   /api/v1/applications/:id/reject   Reject application
```

#### Loans
```
POST   /api/v1/loans                     Create loan from approved application
GET    /api/v1/loans                     List loans
GET    /api/v1/loans/:id                 Loan detail with EMI schedule
GET    /api/v1/loans/:id/statement       Download EMI statement PDF
```

#### EMI
```
GET    /api/v1/emi                       List EMI schedules
POST   /api/v1/emi/pay                   Record EMI payment
GET    /api/v1/emi/overdues              Overdue EMIs
GET    /api/v1/emi/receipt/:id           Download receipt PDF
POST   /api/v1/emi/online-payment        Initiate online payment
```

#### Disbursements
```
POST   /api/v1/disbursements             Create disbursement
GET    /api/v1/disbursements             List
GET    /api/v1/disbursements/:id         Detail
POST   /api/v1/disbursements/:id/approve Approve disbursement
POST   /api/v1/disbursements/:id/confirm Confirm disbursement
GET    /api/v1/disbursements/:id/statement Download statement PDF
```

#### Ledger
```
GET    /api/v1/ledger/accounts           Chart of accounts
GET    /api/v1/ledger/accounts/:id       Account ledger
POST   /api/v1/ledger/journal            Create journal entry
GET    /api/v1/ledger/trial-balance      Trial balance
GET    /api/v1/ledger/day-book           Day book
POST   /api/v1/ledger/banks              Manage bank accounts
GET    /api/v1/ledger/bank-reconciliation Bank reconciliation
```

#### Tasks & Verification
```
GET    /api/v1/tasks                     Assigned tasks
POST   /api/v1/tasks                     Create task (admin)
PUT    /api/v1/tasks/:id/status          Update task status
POST   /api/v1/verification/submit        Submit verification report
POST   /api/v1/verification/gps          Submit GPS coordinates
```

#### Communication
```
GET    /api/v1/sms/templates             SMS templates
POST   /api/v1/sms/templates             Create template
POST   /api/v1/sms/send                  Send SMS
GET    /api/v1/sms/logs                  SMS history
GET    /api/v1/email/templates           Email templates
POST   /api/v1/email/templates           Create template
POST   /api/v1/email/send                Send email
GET    /api/v1/email/logs                Email history
```

#### Dashboard & Reports
```
GET    /api/v1/dashboard/stats           Dashboard statistics
GET    /api/v1/reports/disbursement      Disbursement report
GET    /api/v1/reports/collection        Collection report
GET    /api/v1/reports/overdue           Overdue report
GET    /api/v1/reports/portfolio         Portfolio report
```

---

## 5. Frontend Architecture

### 5.1 Component Hierarchy

```
App.jsx
├── AuthProvider (context)
├── QueryClientProvider (React Query)
├── Sidebar
│   ├── NavMain (primary navigation)
│   ├── NavDocuments
│   ├── NavSecondary
│   └── NavUser (profile, logout)
├── Header
└── Routes
    ├── /login → Login
    ├── / → Dashboard
    ├── /applications → ApplicationList
    ├── /applications/:id → ApplicationDetail
    ├── /applications/new → ApplicationForm
    ├── /loans → LoanList
    ├── /loans/:id → LoanDetail
    ├── /emi/collection → EmiCollection
    ├── /emi/overdues → Overdues
    ├── /emi/my-dues → CustomerDues
    ├── /disbursements → DisbursementList
    ├── /disbursements/new → DisbursementForm
    ├── /ledger/accounts → LedgerAccounts
    ├── /ledger/journal → JournalEntry
    ├── /ledger/trial-balance → TrialBalance
    ├── /tasks → TaskList
    ├── /verification/field-visit → FieldVisit
    ├── /areas → AreaList
    ├── /sms → SmsPanel
    ├── /email → EmailPanel
    ├── /portal → CustomerPortal
    ├── /portal/pay → PayEmi
    └── /settings/* → UsersList, ProductsList
```

### 5.2 State Management Strategy

| State Type | Tool | Scope |
|-----------|------|-------|
| **Server State** | TanStack Query | All API data (cached, auto-refetch) |
| **Auth State** | React Context + useAuth hook | Current user, login status |
| **UI State** | useState / useReducer | Modals, form inputs, filters |
| **Form State** | React Hook Form | Complex multi-step forms |
| **URL State** | React Router params | Current page, selected IDs |

### 5.3 Data Flow Pattern

```
User Action
    │
    ▼
React Component
    │
    ▼
useMutation (React Query)
    │
    ▼
api.post('/endpoint', data)
    │
    ▼
Axios interceptor adds JWT
    │
    ▼
Express Route Handler
    │
    ▼
Business Logic Service
    │
    ▼
Supabase PostgreSQL Query (with RLS)
    │
    ▼
Response → React Query cache update → UI re-render
```

---

## 6. Security Architecture

### 6.1 Authentication
- **Custom JWT Auth** (email/password + phone/OTP)
- JWT tokens stored in `jwt_refresh_tokens` table
- JWT tokens (1-hour expiry) with auto-refresh
- Secure, HttpOnly cookies for web (optional)

### 6.2 Authorization Layers

| Layer | Implementation |
|-------|---------------|
| **Route-level** | Frontend route guards (`<ProtectedRoute>`) |
| **API-level** | Express middleware verifying JWT + role |
| **Database-level** | Supabase RLS policies per table |

### 6.3 Authorization at Application Layer

Authorization is handled at the Express middleware layer (not via Supabase RLS). The middleware loads the user's effective permissions from `role_permissions` + `user_permission_overrides` tables and enforces them on every API request.

```sql
-- Effective permissions for a user
SELECT p.name
FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p.id
JOIN roles r ON r.id = rp.role_id
JOIN users u ON u.role = r.name
WHERE u.id = $1 AND rp.is_granted = true
UNION
SELECT p.name
FROM permissions p
JOIN user_permission_overrides upo ON upo.permission_id = p.id
WHERE upo.user_id = $1 AND upo.is_granted = true;
```

### 6.4 Other Security Measures
- Rate limiting on auth endpoints
- Input validation via Zod schemas
- SQL injection prevention (parameterized queries via Supabase)
- CORS configuration
- Helmet.js for security headers
- File upload validation (type, size)

---

## 7. Database Connection Strategy

**Database URL:**
```
postgres://postgres:Continnum@2026@db.kwkdpkewxldxcekeaaoh.supabase.co:5432/postgres
```

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────┐
│   React SPA  │──API──▶  Express.js API   │──query▶  Supabase    │
│  (Vercel)    │       │   (Render/Railway) │       │  PostgreSQL  │
└──────────────┘       └───────────────────┘       └──────────────┘
```

- **Connection pooling**: Via `pg-pool` or Supabase built-in connection pooler
- **Direct PostgreSQL**: Direct connection to Supabase PostgreSQL instance
- **Migrations**: Managed via versioned SQL files in `backend/scripts/migrations.sql`

---

## 8. Caching Strategy

| Cache Layer | Technology | What's Cached |
|-------------|-----------|---------------|
| **Client Cache** | TanStack Query | API responses (5 min stale, 10 min gc) |
| **CDN** | Vercel Edge | Static assets, API responses (public endpoints) |
| **Application Cache** | In-memory (LRU) | Dropdown lists, product configs, EMI rates |

---

## 9. Error Handling

### 9.1 Backend Error Categories

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `UNAUTHORIZED` | Missing/invalid JWT | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Duplicate entry, state conflict | 409 |
| `BUSINESS_RULE` | Violates business logic | 422 |
| `INTERNAL_ERROR` | Server error | 500 |

### 9.2 Frontend Error Handling
- Toast notifications for user-facing errors
- Error boundaries for component crashes
- Retry logic for network failures (3 retries with exponential backoff)
- Graceful degradation for offline mode

---

## 10. Performance Considerations

| Concern | Solution |
|---------|----------|
| **Large customer lists** | Pagination (cursor-based), virtual scrolling for tables |
| **Document uploads** | Chunked upload, progress indicator |
| **Dashboard load time** | Parallel queries, skeleton loaders |
| **EMI schedule generation** | Background job, cache result |
| **PDF generation** | Server-side with streaming response |
| **Map performance** | Leaflet with clustering for many markers |

---

## 11. Deployment Architecture

### 11.1 Environments

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Development** | localhost:5173 | localhost:3001 | Supabase (dev project) |
| **Staging** | Vercel preview | Render (staging) | Supabase (staging project) |
| **Production** | Vercel (custom domain) | Render (production) | Supabase (production project) |

### 11.2 CI/CD Pipeline (GitHub Actions)

```
Push to main
    │
    ▼
Run tests (backend + frontend)
    │
    ▼
Run database migrations
    │
    ▼
Deploy backend to Render
    │
    ▼
Build + Deploy frontend to Vercel
```

---

## 12. Scalability Considerations

| Aspect | Current | Future Scaling |
|--------|---------|----------------|
| **Database** | Supabase (shared pool) | Dedicated Supabase plan → read replicas |
| **API** | Single Express instance | Horizontal scaling on Render, load balancer |
| **File Storage** | Supabase Storage | CDN integration for document delivery |
| **Background Jobs** | In-process (node-cron) | Separate worker process (BullMQ + Redis) |
| **Notifications** | Synchronous | Queue-based (Redis + worker) |
