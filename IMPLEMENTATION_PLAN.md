# CMF — Implementation Plan

## Continnum Microfinance Private Limited
**Location:** Chennai, Tamil Nadu, India
**Plan Version:** 1.0.0 — October 2026
**Estimated Timeline:** 12-16 weeks

---

## Phase 0: Foundation & Infrastructure (Week 1-2)

### Objectives
- Set up development environment
- Deploy database schema
- Create project structure
- Configure deployment pipelines

### Tasks

#### Week 1

**Day 1-2: Database Setup**
- [ ] Create Supabase project (Chennai region recommended for low latency)
- [ ] Execute all 48 table creation migrations
- [ ] Create database functions: `generate_id()`, `auto_generate_id()`, `update_emi_overdue()`, `update_ledger_balance()`
- [ ] Create all 19 triggers
- [ ] Create views: `v_customer_portal`, `v_dashboard_loan_summary`, `v_emi_portal`
- [ ] Seed 7 roles and 38 permissions
- [ ] Seed 12 ledger accounts
- [ ] Seed 7 application workflow stages
- [ ] Seed 8 SMS templates and 8 email templates
- [ ] Seed 3 loan products with 8 interest slabs
- [ ] Seed 2 bank accounts
- [ ] Seed 3 branches and 5 areas
- [ ] Verify all constraints and indexes

**Day 3-4: Backend Foundation**
- [ ] Initialize Node.js project with package.json
- [ ] Install dependencies (Express, pg, bcrypt, JWT, etc.)
- [ ] Create project directory structure (src/config, src/routes, src/services, src/middleware, src/utils)
- [ ] Set up database connection pool (pg Pool)
- [ ] Create environment configuration (.env.example, config files)
- [ ] Create Express server entry point (src/server.js)
- [ ] Set up CORS, Helmet, rate limiting middleware
- [ ] Create error handling middleware
- [ ] Create async handler wrapper
- [ ] Set up health check endpoint

**Day 5: Version Control**
- [ ] Initialize Git repository
- [ ] Create .gitignore
- [ ] Create initial commit
- [ ] Set up branch strategy (main, develop, feature/*)
- [ ] Create setup_master.js for database seeding

#### Week 2

**Day 6-7: Authentication & Authorization**
- [ ] Implement login endpoint (bcrypt comparison)
- [ ] Implement JWT token generation (access + refresh)
- [ ] Implement refresh token flow
- [ ] Create authenticate() middleware
- [ ] Create authorize() role-based middleware
- [ ] Create loadPermissions() middleware
- [ ] Implement logout (revoke refresh token)
- [ ] Implement change password flow
- [ ] Implement forgot/reset password flow

**Day 8-10: Core Services**
- [ ] authService.js — login, refresh, profile CRUD
- [ ] applicationService.js — CRUD, topics, notes, transitions
- [ ] loanService.js — create, read, schedule generation
- [ ] emiService.js — payment recording, overdue detection
- [ ] disbursementService.js — creation, charge calculation
- [ ] ledgerService.js — double-entry, accounts, trial balance
- [ ] commonService.js — areas, tasks, products, referrals
- [ ] communicationService.js — SMS/email logs, templates
- [ ] dashboardService.js — stats, collection metrics

**Day 11-12: Core Routes**
- [ ] auth.js routes
- [ ] applications.js routes (with all sub-routes)
- [ ] loans.js routes
- [ ] emi.js routes
- [ ] disbursements.js routes
- [ ] ledger.js routes
- [ ] dashboard.js routes
- [ ] communication.js routes
- [ ] tasks.js routes
- [ ] areas.js routes

**Day 13-14: Testing & Validation**
- [ ] Test all endpoints with Postman/Thunder Client
- [ ] Verify JWT flow end-to-end
- [ ] Test role-based access control
- [ ] Test database triggers (auto ID generation)
- [ ] Verify connection pooling
- [ ] Load test with 10 concurrent requests

**Deliverables:**
- Fully functional Express API with 10 route modules
- Complete database with seed data
- Authentication system with JWT + refresh tokens
- All 19 database triggers working

---

## Phase 1: Frontend Foundation (Week 3-4)

### Objectives
- Set up React project with Vite + Tailwind + shadcn/ui
- Create layout components and routing
- Implement authentication flow

### Tasks

#### Week 3

**Day 15-16: Project Setup**
- [ ] Initialize Vite + React project
- [ ] Install all frontend dependencies
- [ ] Configure Tailwind CSS with theme variables
- [ ] Install and configure shadcn/ui (Button, Card, Input, Label, Table, Dialog, Select, Tabs, Toast, Avatar, Badge, Separator, Skeleton)
- [ ] Configure Vite proxy for API
- [ ] Create directory structure (pages, components, lib, hooks, services)
- [ ] Create theme configuration (light/dark mode)
- [ ] Set up Axios with interceptors (attach JWT, handle 401)

**Day 17-18: Core Components**
- [ ] App.jsx — Router setup + Layout
- [ ] Layout.jsx — Sidebar + Header + Main content area
- [ ] Sidebar.jsx — Role-based navigation menu
- [ ] Header.jsx — User info, notifications, logout
- [ ] PageHeader.jsx — Reusable page header with breadcrumb
- [ ] DataTable.jsx — Generic data table with sorting/pagination
- [ ] StatusBadge.jsx — Color-coded status badges
- [ ] RoleGuard.jsx — Route protection component
- [ ] LoadingSkeleton.jsx — Loading states

**Day 19-21: Authentication Pages**
- [ ] Login page (email/phone + password)
- [ ] Forgot password page
- [ ] Reset password page
- [ ] authService.js — Axios-based API calls
- [ ] useAuth.js hook — Auth state management
- [ ] Auth context provider
- [ ] Protected route wrapper
- [ ] Token refresh logic
- [ ] Auto-logout on 401

#### Week 4

**Day 22-24: Dashboard Pages**
- [ ] Dashboard layout (role-specific widgets)
- [ ] Super Admin dashboard (all branches, overall stats)
- [ ] Branch Admin dashboard (branch-specific)
- [ ] Team Leader dashboard (area metrics)
- [ ] Collection Agent dashboard (today's collections)
- [ ] Customer dashboard (my loans, next EMI)
- [ ] Stats cards component
- [ ] Chart components (Recharts)
- [ ] Recent activity widget
- [ ] Quick actions widget

**Day 25-26: Common Layout Features**
- [ ] Notification dropdown
- [ ] User profile dropdown
- [ ] Search bar (global search)
- [ ] Breadcrumb navigation
- [ ] Page transitions

**Day 27-28: Testing**
- [ ] Test login flow
- [ ] Test role-based navigation
- [ ] Test token refresh
- [ ] Test logout
- [ ] Test protected routes
- [ ] Responsive design check (mobile, tablet, desktop)

**Deliverables:**
- Complete React frontend with routing
- Login/logout working with backend
- Role-based navigation and UI
- Dashboard with real data from API

---

## Phase 2: Application Management (Week 5-6)

### Objectives
- Complete loan application lifecycle UI
- 16-topic structured form
- Multi-stage approval workflow

### Tasks

#### Week 5

**Day 29-31: Application List & Detail**
- [ ] ApplicationList page (table with filters)
- [ ] Application filters (status, product, branch, date range)
- [ ] ApplicationDetail page (summary view)
- [ ] Application status timeline
- [ ] Topic progress indicators
- [ ] Action buttons (approve, reject, query, forward)

**Day 32-35: 16-Topic Application Form**
- [ ] Topic stepper component (16 steps)
- [ ] Applicant Details form (Topic 1)
- [ ] Basic Details form (Topic 2)
- [ ] KYC Details form with Aadhaar/PAN (Topic 3)
- [ ] Work Details form (Topic 4)
- [ ] Banking Details form (Topic 5)
- [ ] Ratio Analysis auto-calculation (Topic 6)
- [ ] Obligations form (Topic 7)
- [ ] Income Details form (Topic 8)
- [ ] Customer Wealth form (Topic 9)
- [ ] Product Details form (Topic 10)
- [ ] Property Details form (Topic 11)
- [ ] Eligibility Calculation display (Topic 12)
- [ ] Documents upload with verification (Topic 13)
- [ ] Verification Checks form (Topic 14)
- [ ] Notes section (Topic 15)
- [ ] Query section (Topic 16)
- [ ] Auto-save drafts per topic
- [ ] Completion percentage tracking

#### Week 6

**Day 36-38: Review & Approval Flow**
- [ ] Review queue page (list of pending applications)
- [ ] Review page with all 16 topics displayed
- [ ] Approve/Reject/Query action buttons
- [ ] Approval limits display per role
- [ ] Query raise form with topic selection
- [ ] Query response form
- [ ] Approval history timeline
- [ ] Notes system (internal vs external)
- [ ] Stage transition tracking

**Day 39-42: Testing & Refinement**
- [ ] End-to-end application flow test
- [ ] Test all 16 topics save/load
- [ ] Test approval workflow with different roles
- [ ] Test query raise/response cycle
- [ ] Test document upload
- [ ] Mobile responsive testing

**Deliverables:**
- Complete application management UI
- 16-topic form with auto-save
- Multi-level approval workflow
- Review queue with filtering

---

## Phase 3: Loan & Disbursement (Week 7-8)

### Objectives
- Loan creation and management
- Dynamic EMI calculation
- Disbursement with dynamic charges

### Tasks

#### Week 7

**Day 43-45: Loan Management**
- [ ] LoanList page with filters
- [ ] LoanDetail page (comprehensive view)
- [ ] EMI Schedule display (monthly table)
- [ ] Loan summary cards
- [ ] Loan status management
- [ ] Foreclosure option
- [ ] Top-up loan option (future)

**Day 46-47: Disbursement Process**
- [ ] DisbursementList page
- [ ] DisbursementForm page
- [ ] Dynamic charge calculator UI
- [ ] Bank account selector (multi-bank)
- [ ] Charge breakdown display
- [ ] Net amount calculation display
- [ ] UTR number entry
- [ ] Disbursement approval workflow
- [ ] Disbursement reversal capability

**Day 48: EMI Calculator**
- [ ] EMI Calculator widget
- [ ] Dynamic EMI months selector
- [ ] Dynamic interest rate slider (admin)
- [ ] Slab-based rate auto-selection
- [ ] Total interest display
- [ ] Total payable display
- [ ] Year-by-year amortization table

#### Week 8

**Day 49-51: Ledger & Accounting**
- [ ] Chart of Accounts page
- [ ] Journal Entry form (double-entry)
- [ ] Ledger Entries list
- [ ] Ledger Account detail view
- [ ] Trial Balance report
- [ ] Bank Accounts management
- [ ] Bank Reconciliation page
- [ ] Bank Statement display

**Day 52-54: Testing**
- [ ] End-to-end loan creation flow
- [ ] Test EMI calculation accuracy
- [ ] Test dynamic charge calculation
- [ ] Test ledger entry creation
- [ ] Test bank reconciliation
- [ ] Test multi-bank disbursement

**Deliverables:**
- Loan management UI
- Disbursement process with dynamic charges
- EMI calculator with dynamic rate/months
- Ledger accounting UI

---

## Phase 4: Collection & EMI (Week 9-10)

### Objectives
- EMI collection interface
- Overdue tracking and escalation
- Customer self-service portal

### Tasks

#### Week 9

**Day 55-57: EMI Collection**
- [ ] CollectionAgentDashboard (today's targets, collections)
- [ ] EMI Collection form (select loan, enter payment)
- [ ] Payment method selector (cash, UPI, bank, card)
- [ ] GPS capture at payment location
- [ ] Collection receipt generation
- [ ] Payment history for customer
- [ ] Partial payment handling
- [ ] Overdue EMI list (area-filtered)

**Day 58-60: Overdue Management**
- [ ] Overdue dashboard (all overdue EMIs)
- [ ] Aging analysis (1-7 days, 8-15 days, 16-30 days, 30+ days)
- [ ] Customer detail view with full payment history
- [ ] Penalty calculation and display
- [ ] Penalty waiver option (admin)
- [ ] Overdue escalation notifications
- [ ] Bulk notification send (SMS/email)

#### Week 10

**Day 61-63: Customer Portal**
- [ ] Customer login (same as staff, different dashboard)
- [ ] My Loans page (active loans summary)
- [ ] EMI Schedule page (all EMIs with status)
- [ ] My Dues page (overdue + upcoming)
- [ ] Pay EMI page (online payment integration)
- [ ] Payment Receipts list (download PDF)
- [ ] Application Status tracker
- [ ] Profile page (view/edit)

**Day 64-70: Communication Module**
- [ ] SMS Template management
- [ ] Email Template management
- [ ] Send SMS from application/loan page
- [ ] Send email with attachments
- [ ] SMS/Email log viewer
- [ ] Bulk send panel (filter recipients, send)
- [ ] Overdue notification automation
- [ ] Template variable system ({customer_name}, {emi_amount}, etc.)

**Deliverables:**
- EMI collection interface
- Overdue tracking dashboard
- Customer self-service portal
- SMS/Email communication panel

---

## Phase 5: Verification & Tasks (Week 11)

### Objectives
- Task assignment workflow
- Field verification with GPS
- OpenStreetMap integration

### Tasks

**Day 71-73: Task Management**
- [ ] TaskList page (with status filters)
- [ ] Task creation form (type, assignee, priority, date)
- [ ] Task detail view
- [ ] Task completion form
- [ ] Task status tracking (assigned → in_progress → completed)
- [ ] Overdue task alerts
- [ ] Area-based task filtering

**Day 74-76: Field Verification**
- [ ] Verification form (16+ fields)
- [ ] GPS coordinate capture
- [ ] OpenStreetMap display (expected vs actual location)
- [ ] Haversine distance calculation
- [ ] GPS mismatch warning (>500m)
- [ ] Selfie photo capture
- [ ] Document photo upload during visit
- [ ] Verification rating (1-5)
- [ ] Recommendation field

**Day 77-78: Area Management**
- [ ] AreaList page
- [ ] Area creation form
- [ ] Area member management
- [ ] Team Leader assignment to area
- [ ] Area performance metrics
- [ ] Map view of areas with member density

**Deliverables:**
- Task assignment and tracking
- Field verification with GPS
- OpenStreetMap integration
- Area management

---

## Phase 6: Advanced Features (Week 12)

### Objectives
- NPA management
- Referral system
- Trust scores
- Reports

### Tasks

**Day 79-81: NPA Management**
- [ ] NPA Dashboard
- [ ] NPA classification buckets (Standard, Sub-standard, Doubtful, Loss)
- [ ] Provision calculation display
- [ ] Recovery tracking
- [ ] Write-off workflow
- [ ] NPA aging chart

**Day 82-84: Referrals & Trust Scores**
- [ ] Referral tracking page
- [ ] Referral creation form
- [ ] Referral status tracking
- [ ] Bonus calculation and payment tracking
- [ ] Trust Score calculation engine
- [ ] Trust Score display on customer profile
- [ ] Grade display (A/B/C/D)

**Day 85-86: Reports**
- [ ] Disbursement report (daily/monthly)
- [ ] Collection report (branch/area/agent)
- [ ] Overdue aging report
- [ ] Loan portfolio report
- [ ] NPA report
- [ ] Agent performance report
- [ ] P&L statement
- [ ] Report export (PDF via pdfkit)

**Deliverables:**
- NPA management module
- Referral system
- Trust scoring
- Reporting suite

---

## Phase 7: Polish & Production (Week 13-14)

### Objectives
- Production deployment
- Performance optimization
- Bug fixes
- Documentation

### Tasks

#### Week 13

**Day 87-89: Testing**
- [ ] End-to-end testing of all flows
- [ ] Load testing (100 concurrent users)
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Mobile responsive testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Database query optimization (add missing indexes)

**Day 90-91: Performance**
- [ ] Frontend code splitting
- [ ] Image optimization
- [ ] API response caching strategy
- [ ] Database connection pool tuning
- [ ] CDN setup for static assets

#### Week 14

**Day 92-94: Deployment**
- [ ] Deploy backend to Render/Railway
- [ ] Deploy frontend to Vercel
- [ ] Configure production environment variables
- [ ] Set up SSL certificates
- [ ] Configure Supabase for production
- [ ] Set up backup schedule
- [ ] Configure monitoring (health checks, error tracking)

**Day 95-98: Documentation**
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User manual for each role
- [ ] Admin guide
- [ ] Deployment guide
- [ ] Database ER diagram
- [ ] Code documentation (JSDoc)

**Deliverables:**
- Production-ready application
- Full documentation suite
- Deployed and accessible

---

## Phase 8: Pilot & Training (Week 15-16)

### Objectives
- User training
- Pilot deployment
- Feedback collection
- Bug fixes

### Tasks

**Day 99-101: Training**
- [ ] Train Super Admin (full system)
- [ ] Train Branch Admin (branch operations)
- [ ] Train Team Leaders (review, area management)
- [ ] Train Field Officers (application creation, verification)
- [ ] Train Collection Agents (EMI collection)
- [ ] Create role-specific quick reference guides
- [ ] Record training videos

**Day 102-105: Pilot**
- [ ] Deploy to pilot branch (Chennai Main)
- [ ] Process 20-30 real loan applications
- [ ] Monitor system performance
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Adjust workflows based on feedback

**Day 106-112: Refinement**
- [ ] Address pilot feedback
- [ ] Implement high-priority improvements
- [ ] Performance tuning
- [ ] Final security review
- [ ] Go-live checklist
- [ ] Roll out to all branches

---

## Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase connection limits | High | Low | Use connection pooling, upgrade plan if needed |
| Complex EMI calculation errors | High | Medium | Unit tests for all calculation scenarios, manual verification |
| GPS verification unreliable | Medium | Medium | Fallback to manual address verification, allow supervisor override |
| User adoption resistance | Medium | Medium | Training, intuitive UI, role-specific onboarding |
| Twilio/SMS delivery failures | Low | Low | Retry mechanism, fallback to email notifications |
| Large dataset performance | Medium | Low | Database indexes, query optimization, pagination |
| Security breach | High | Low | Parameterized queries, JWT, rate limiting, HTTPS |
| Concurrent EMI payments | Medium | Low | Database transactions, row-level locking |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Loan processing time | < 7 days | Submitted → Disbursed |
| Application approval rate | > 60% | Approved / Submitted |
| Collection efficiency | > 95% | Collected / Due amount |
| NPA ratio | < 5% | NPA loans / Total active |
| System uptime | > 99.5% | Health check monitoring |
| API response time | < 500ms | 95th percentile |
| User satisfaction | > 4/5 | Post-training survey |
| Mobile usability | > 80% | Mobile responsive testing |

---

## Post-Launch Roadmap

### v1.1 (Month 4)
- Online EMI payment (UPI integration)
- Aadhaar e-KYC verification
- CIBIL score integration
- WhatsApp notifications
- Advanced analytics dashboard

### v1.2 (Month 5)
- Mobile app (React Native)
- Group loan support
- Multi-language (English + Tamil)
- Advanced reporting with scheduled delivery
- Loan top-up feature

### v1.3 (Month 6)
- OCR for document processing
- Automated credit scoring
- Predictive NPA analysis
- Multi-branch hierarchical reporting
- Branch comparison analytics

### v2.0 (Month 7+)
- Agent mobile app with offline mode
- Biometric attendance for field visits
- AI-powered application scoring
- Customer chatbot
- WhatsApp bot for EMI reminders and payments

---

*Document version: 1.0.0 | Last updated: October 2026*
