# CMF — Project Analysis & Business Requirements

## Continnum Microfinance Private Limited
**Location:** Chennai, Tamil Nadu, India
**Industry:** Microfinance — Priority Sector Lending
**Target Market:** Self-employed, small business owners, women entrepreneurs in Tamil Nadu

---

## 1. Executive Summary

Continnum Microfinance Private Limited (CMF) is a Chennai-based NBFC-MFI (Non-Banking Financial Company — Microfinance Institution) operating in the priority sector lending space. The organization provides small-ticket loans (Rs. 5,000 — Rs. 5,00,000) to underserved segments including self-employed individuals, small business owners, and women entrepreneurs in Tamil Nadu.

### 1.1 Problem Statement

Current microfinance operations in Tamil Nadu face these challenges:
- **Manual processes:** Paper-based applications lead to 7-14 day processing times
- **No centralized system:** Data scattered across spreadsheets and paper files
- **Inefficient field operations:** No GPS-verified field visits, manual attendance
- **Delayed EMI tracking:** Late payments detected only after 30+ days
- **Poor customer experience:** No self-service portal for borrowers
- **Limited credit assessment:** No automated eligibility scoring
- **Manual accounting:** Error-prone ledger maintenance across multiple bank accounts
- **Communication gaps:** No automated SMS/email for reminders and receipts

### 1.2 Solution Overview

The CMF software platform is a comprehensive web-based microfinance management system covering the complete loan lifecycle:

```
Customer Onboarding → Application Submission → Multi-Stage Review → Approval → Disbursement
→ EMI Collection → Ledger Accounting → Overdue Management → NPA Classification
```

### 1.3 Target Users & Roles

| Role | Count (initial) | Responsibility |
|------|-----------------|----------------|
| Super Admin | 1 | Full system control, settings, all branches |
| Branch Admin | 1-3 | Branch-level operations, disbursement approval |
| Team Leader | 2-5 | Area management, application review, team oversight |
| Field Officer | 5-15 | Application creation, field verification, document collection |
| Collection Agent | 5-10 | EMI collection in assigned areas |
| Customer | 1000+ | Self-service: view dues, pay EMI, download receipts |
| Lender/Investor | 2-5 | View portfolio performance, trust scores |

---

## 2. Business Requirements

### 2.1 Module 1: Branch & Area Management

**Purpose:** Organize operations geographically for field force management.

**Requirements:**
- Create hierarchical branches (Head Office → Branch → Service Centers)
- Define service areas within each branch (by PIN code / geography)
- Assign Team Leaders to specific areas
- Assign Field Officers and Collection Agents to areas (area-based access control)
- Track area-level metrics (loan count, disbursement, collection rates)

**Business Rules:**
- Each area belongs to exactly one branch
- A user can be assigned to multiple areas, but has one primary area
- Collection Agents can ONLY access data for their assigned areas
- Field Officers see applications from their areas only

### 2.2 Module 2: Customer Onboarding & KYC

**Purpose:** Register customers with complete KYC and profile data.

**Requirements:**
- **Aadhaar-based authentication:** Aadhaar number entry with last 4-digit masking for display
- **PAN verification:** PAN card entry with validation
- **Personal details:** Name, DOB, gender, marital status, family members
- **Contact information:** Address, phone, email
- **Work details:** Employment type, employer, designation, income
- **Banking details:** Account number, IFSC, bank name, nominee
- **GPS location:** Capture customer's residence coordinates (for verification matching)
- **Photos:** Profile photo, signature, Aadhaar front/back images
- **Referral tracking:** Existing customers can refer new customers (referral bonus)
- **Customer wealth assessment:** Assets, gold holdings, investments

**Business Rules:**
- Customer profile must be 100% complete before loan application can be submitted
- Aadhaar and PAN must be verified by admin/FO before submission
- Customer code auto-generated in format: `CMF0000001`, `CMF0000002`, etc.
- Referral bonus paid only when referred customer gets their first disbursement

### 2.3 Module 3: Loan Product Management

**Purpose:** Define loan products with dynamic pricing and charges.

**Requirements:**
- Create multiple loan products (Personal, Business, Emergency, etc.)
- Set min/max loan amount and tenure per product
- Define interest rate range (min — max, adjustable by Super Admin)
- Configure processing fee: flat amount or percentage of loan amount
- Configure document charges: flat amount per product
- Configure insurance: none / flat / percentage
- Define **dynamic interest rate slabs** (tiered pricing):
  - Tier 1: Rs. 10,000 — Rs. 30,000 → 18% interest
  - Tier 2: Rs. 30,001 — Rs. 70,000 → 15% interest
  - Tier 3: Rs. 70,001 — Rs. 2,00,000 → 14% interest
- Set late payment penalty rate per product
- Configure grace period (days before penalty applies)
- Define required documents per product
- Set eligibility rules (min age, max age, min CIBIL, max DTI ratio)

**Business Rules:**
- Interest slab is automatically selected based on loan amount when application is submitted
- Super Admin can adjust interest rate within the product's min-max range
- Processing fee can have a maximum cap
- Grace period: no penalty charged during grace days after due date
- Prepayment allowed for some products with penalty configurable

### 2.4 Module 4: Loan Application (16-Stage Topic Structure)

**Purpose:** Complete digital loan application with structured data capture.

**Requirements:** A single loan application contains 16 topic areas, each with its own form data:

| # | Topic | Data Captured |
|---|-------|--------------|
| 1 | **Applicant Details** | Name, DOB, gender, marital status, family info |
| 2 | **Basic Details** | Religion, caste, education, family members |
| 3 | **KYC Details** | Aadhaar, PAN, Voter ID, photos |
| 4 | **Work Details** | Employment type, employer, designation, salary |
| 5 | **Banking Details** | Bank account, IFSC, nominee, statements |
| 6 | **Ratio Analysis** | Debt-to-income, loan-to-value, savings ratio |
| 7 | **Obligations** | Existing loans, credit cards, other dues |
| 8 | **Income Details** | Primary/secondary income, total household income |
| 9 | **Customer Wealth** | Movable assets, property, investments, gold |
| 10 | **Product Details** | Loan amount, tenure, purpose, purpose description |
| 11 | **Property Details** | Property type, address, value, ownership |
| 12 | **Eligibility Calculation** | Auto-calculated score, eligible amount, EMI |
| 13 | **Documents** | Uploaded files with verification status |
| 14 | **Verification Checks** | Address, income, document verification |
| 15 | **Notes** | Internal/external notes, review comments |
| 16 | **Query** | Query raised/responded, resolution tracking |

**Application Workflow Stages:**
```
New Application → Document Verification → Field Verification → Credit Assessment
→ Committee Review → Approval → Disbursement
```

**Business Rules:**
- Each topic has a completion percentage
- Application cannot proceed to next stage until current topic is 100% complete
- All 16 topics must be complete before submission for review
- System auto-calculates eligibility score based on all topic data
- Admin can raise queries on any topic — application returns to draft status
- Reviewer can add notes (internal = visible only to staff, external = visible to customer)

### 2.5 Module 5: Application Review & Approval

**Purpose:** Multi-level review with role-based approval limits.

**Requirements:**
- Field Officer creates and submits application
- Team Leader reviews (limit: up to Rs. 50,000)
- Branch Admin reviews (limit: Rs. 50,001 — Rs. 2,00,000)
- Super Admin reviews (above Rs. 2,00,000)
- Each level can: Approve / Reject / Raise Query / Forward
- Approval history tracked with approver name, role, timestamp, amount
- Application shows "Approved by", "Reviewed by", "Disbursed by" in summary

**Business Rules:**
- If loan amount > approver's limit, system auto-forwards to next level
- Team Leader can approve up to Rs. 50,000
- Branch Admin can approve up to Rs. 2,00,000
- Super Admin has no upper limit
- Application can be rejected at any stage with mandatory reason
- Rejected applications go back to the creator with query notes
- All transitions logged in audit trail

### 2.6 Module 6: Dynamic Interest Rate & EMI Calculation

**Purpose:** Flexible EMI calculation with admin-controlled rates.

**Requirements:**
- **EMI Calculation Engine:** Standard reducing balance EMI formula
- **Dynamic EMI months:** Admin/Super Admin can change tenure (within product limits)
- **Dynamic interest rate:** Super Admin can adjust rate within product's min-max range
- **Interest slab auto-selection:** Based on loan amount, the correct slab rate is applied
- **EMI preview:** Show customer the EMI amount, total interest, total payable before approval
- **EMI schedule generation:** Auto-generate month-by-month schedule on disbursement
- **EMI recalculation:** If interest rate changes (before disbursement), recalculate EMI

**Business Rules:**
- EMI = P × r × (1+r)^n / ((1+r)^n - 1) where r = monthly rate, n = tenure
- Interest slab determined by loan amount at time of application submission
- Rate can be changed by Super Admin within product's min-max range
- If rate changes after application, EMI is recalculated and applicant is notified
- EMI schedule is locked upon disbursement (cannot change thereafter)
- First EMI date = 1st of month after 30 days from disbursement

### 2.7 Module 7: Disbursement & Dynamic Charges

**Purpose:** Process loan disbursement with dynamically calculated charges.

**Requirements:**
- Select bank account for disbursement (multi-bank support)
- Calculate **Processing Fee** dynamically:
  - If percentage: `loan_amount × processing_fee_value%`
  - If flat: fixed amount
  - Can have a maximum cap
- Calculate **Document Charge** dynamically:
  - Flat amount per product
  - Can be waived by Super Admin
- Calculate **Insurance** (if applicable):
  - Percentage of loan amount
- Calculate **GST** on charges (if applicable):
  - CGST + SGST or IGST
- Calculate **Net Disbursement** = Loan Amount - Total Charges
- Disbursement modes: Bank Transfer (NEFT/RTGS/IMPS), UPI, Cash, Cheque
- UTR number entry for bank transfers
- Reversal capability for erroneous disbursements

**Business Rules:**
- Total charges calculated before disbursement
- Customer sees gross amount, all charges, and net amount before confirmation
- Processing fee and document charge values can be overridden per disbursement
- Admin can set different charge structures for different branches
- GST applicable on processing fee and document charge only (not on loan amount)
- Net amount credited to customer's bank account

### 2.8 Module 8: EMI Collection & Payment Tracking

**Purpose:** Track monthly EMI payments and initiate collection for overdue accounts.

**Requirements:**
- EMI schedule displayed as calendar with due dates
- Collection Agent records payment with:
  - Payment method (cash, bank transfer, UPI, card, cheque)
  - Amount received
  - Bank account (if bank transfer)
  - GPS location at time of collection
  - Selfie / photo proof
- Payment split: Principal component + Interest component + Penalty component
- **Overdue detection:** Daily cron job marks EMIs as overdue
- **Overdue escalation:**
  - Day 1-7: SMS reminder to customer
  - Day 8-15: SMS + Email to customer + notification to assigned Collection Agent
  - Day 16-30: Notification to Team Leader + Field Officer + Branch Admin
  - Day 30+: NPA classification process begins
- Late payment fee: `overdue_amount × penalty_rate%` (per month or per day)
- Partial payments accepted (applied to interest first, then principal)
- Payment receipt generation (PDF) with customer details

**Business Rules:**
- If payment >= EMI amount: full EMI marked paid
- If payment < EMI amount: partial payment recorded, remainder stays overdue
- Penalty calculated on overdue amount only
- Penalty stops accruing once EMI is fully paid
- Overdue EMIs highlighted in red on dashboard and customer portal
- System sends auto-reminders 3 days before due date and on due date

### 2.9 Module 9: Dynamic Ledger Logic

**Purpose:** Complete double-entry bookkeeping system.

**Requirements:**
- **Chart of Accounts:** Pre-seeded with 12 accounts:
  - Assets: Cash, Bank — SBI, Bank — HDFC, Loans Disbursed, Interest Receivable, EMI Collections
  - Income: Processing Fee Income, Interest Income, Document Charges Income, Penalty Income
  - Expenses: Salary Expenses, Rent Expenses
- **Double-entry transactions:** Every financial event creates balanced entries
- **Ledger entry types:**
  - Disbursement: Debit Loans Disbursed, Credit Bank Account
  - EMI received: Debit Bank Account / EMI Collections, Credit Interest Income, Credit Principal
  - Salary payment: Debit Salary Expenses, Credit Bank Account
  - Rent payment: Debit Rent Expenses, Credit Bank Account
  - Processing fee: Debit Bank Account, Credit Processing Fee Income
- **Multi-bank support:** Multiple bank accounts, each with own ledger account and statement
- **Bank reconciliation:** Match ledger entries with bank statement entries
- **Trial balance:** Auto-generated balance sheet
- **Running balances:** Each ledger account shows current balance updated on every entry
- **Bank statements:** Auto-generated from ledger entries + manual entries
- **Journal entries:** For manual adjustments (with mandatory narration)

**Business Rules:**
- Every transaction must have equal debits and credits
- Minimum 2 lines per entry
- Disbursement creates: Debit Loans Disbursed + Debit Processing Fee Expense, Credit Bank Account
- EMI payment creates: Debit Bank, Credit Interest Income + Credit Principal (reduces Loans Disbursed)
- All charges create: Debit Bank / Cash, Credit respective Income accounts
- Office expenses (rent, salary): Debit Expense, Credit Bank
- Bank statement balance = Opening Balance + Σ Credits - Σ Debits
- Account balances auto-update via trigger on ledger_entry_lines INSERT

### 2.10 Module 10: Verification & Field Visits

**Purpose:** Physical and document verification with GPS tracking.

**Requirements:**
- Admin/Team Leader assigns verification tasks to Field Officers
- Task types: Field Verification, Document Verification, Post-Disbursement Check
- Field Officer marks task with:
  - GPS coordinates (from browser/mobile)
  - Address verification (auto-filled from GPS, matches expected address?)
  - Person met (name, relation to borrower)
  - Duration at address
  - Residence type (owned/rented/family)
  - Family verification
  - Income verification
  - Document verification
  - Neighbor inquiry
  - Selfie photo
  - Overall rating (1-5)
- **OpenStreetMap integration:**
  - Expected customer location from profile
  - Actual GPS from field officer
  - Distance calculated using Haversine formula
  - Flag if distance > 500m (possible fake visit)
- **Overdue task tracking:** Tasks not completed within SLA hours flagged
- **Collection tasks:** Assigned to Collection Agents with area restriction

**Business Rules:**
- Task SLA hours set per stage type (e.g., Field Verification = 48 hours)
- Overdue tasks auto-escalated to Team Leader
- GPS mismatch > 500m: task flagged for review, requires supervisor approval
- Field Officer can only see tasks assigned to their areas
- Collection Agent can only see collection tasks in their areas

### 2.11 Module 11: Communication (SMS & Email)

**Purpose:** Automated and manual communication with customers.

**Requirements:**
- **SMS Templates (8 pre-configured):**
  - Welcome SMS (on registration)
  - Application Received
  - Application Approved
  - Application Rejected
  - Query Raised
  - EMI Due Reminder (3 days before due date)
  - EMI Overdue Notification
  - EMI Payment Receipt
- **Email Templates:** Same categories with HTML formatting
- **Manual send:** Admin/FO can trigger SMS/email from application or loan detail page
- **Bulk send:** Send EMI reminders to all due customers
- **Template variables:** `{customer_name}`, `{loan_number}`, `{emi_amount}`, `{due_date}`, etc.
- **Communication log:** All sent messages logged with timestamp, recipient, status
- **Delivery tracking:** Track sent, delivered, failed, bounced status

**Business Rules:**
- SMS sent from registered sender ID (e.g., "CMFMSG")
- Tamil language templates available for all message types
- Email includes PDF attachment for receipts
- All communications logged in audit trail
- Failed SMS/emails retried once, then marked as failed

### 2.12 Module 12: Customer Portal (Self-Service)

**Purpose:** Allow end customers to view their loan status and pay EMIs.

**Requirements:**
- **Login:** Email/phone + password (same as staff login)
- **Dashboard:** Shows active loans, next EMI due, outstanding amount
- **EMI Statement:** Month-by-month breakdown with due dates, amounts paid, balance
- **Payment Dues:** List of all unpaid EMIs with overdue status and penalties
- **Pay EMI:** Online payment (UPI integration) or record cash payment
- **Payment Receipts:** Download PDF receipts for all payments
- **Application Status:** Track application progress through stages
- **Profile Management:** Update contact details, view KYC status

**Business Rules:**
- Customer sees only their own data
- Payment requires OTP confirmation
- Online payments auto-update EMI schedule and ledger
- Cash payments require Collection Agent confirmation
- Receipt generated immediately upon payment

### 2.13 Module 13: NPA Management

**Purpose:** Classify and manage non-performing assets per RBI guidelines.

**Requirements:**
- **Automatic NPA classification:**
  - 0-89 days: Standard
  - 90-179 days: Sub Standard
  - 180-364 days: Doubtful
  - 365+ days: Loss
- **Provision calculation:**
  - Standard: 0%
  - Sub Standard: 15%
  - Doubtful: 25-40% (based on age)
  - Loss: 100%
- **Recovery tracking:** Record recovery actions and amounts
- **Write-off:** Flag for write-off after 365+ days with approval
- **NPA dashboard:** Show NPA buckets, provision amounts, recovery rates

**Business Rules:**
- NPA classification is automatic based on overdue_days
- Loan marked as NPA updates status and flags for recovery team
- Provision amount calculated on outstanding principal
- Write-off requires Super Admin approval
- NPA loans excluded from active loan counts in dashboard

### 2.14 Module 14: Dashboard & Reporting

**Purpose:** Real-time operational dashboard for management.

**Requirements:**
- **Super Admin Dashboard:**
  - All branches summary
  - Total disbursements, outstanding, collections
  - Application pipeline (pending, approved, rejected)
  - NPA overview
  - Collection efficiency %
- **Branch Admin Dashboard:**
  - Branch-specific metrics
  - FO/Agent performance
  - Area-wise collection rates
- **Team Leader Dashboard:**
  - Area metrics
  - Pending applications
  - Team performance
- **Collection Agent Dashboard:**
  - Today's collections
  - Overdue customers in assigned area
  - Collection targets

**Reports:**
- Daily/Monthly disbursement report
- EMI collection report (branch/area/agent-wise)
- Overdue report with aging
- Loan portfolio report
- Ledger trial balance
- P&L statement
- NPA report
- Agent performance report

### 2.15 Module 15: Approval Limits & RBAC

**Purpose:** Role-based access control with approval authority limits.

**Requirements:**
- 7 roles with granular permissions (38 permissions)
- Custom permission overrides per user
- Approval limits per role:
  - Team Leader: up to Rs. 50,000
  - Branch Admin: up to Rs. 2,00,000
  - Super Admin: unlimited
- Area-based data access:
  - Collection Agent: only their assigned areas
  - Field Officer: only their assigned areas
  - Team Leader: full access to all areas under them
  - Branch Admin: full access to their branch
  - Super Admin: all branches

---

## 3. Non-Functional Requirements

### 3.1 Performance
- API response time: < 500ms for 95th percentile
- Dashboard load: < 2 seconds
- Support 1000+ concurrent users
- Database connection pooling (min: 2, max: 20)

### 3.2 Security
- JWT-based authentication with 15-minute access tokens + 7-day refresh tokens
- Password hashing: bcrypt (cost factor 10)
- Rate limiting: 100 requests per 15 minutes per IP
- CORS restricted to frontend origin
- Helmet.js security headers
- SQL injection prevention via parameterized queries
- All financial data encrypted at rest in Supabase

### 3.3 Scalability
- Supabase PostgreSQL with connection pooling
- API stateless — horizontally scalable
- Frontend CDN-ready (Vite build)
- Background jobs for overdue detection, notifications

### 3.4 Compliance
- Complete audit trail for all financial transactions
- RBI NPA classification rules implemented
- Data retention: 7 years for financial records
- Customer data: encrypted PII (Aadhaar, PAN)
- Consent tracking for communications (SMS/email)

### 3.5 Availability
- Target: 99.5% uptime (leverage Supabase managed hosting)
- Health check endpoint at `/api/health`
- Graceful shutdown handling

---

## 4. Integration Points

| System | Type | Purpose |
|--------|------|---------|
| **Supabase** | Database + Auth | PostgreSQL database, future SSO |
| **Twilio** | SMS API | Automated SMS notifications |
| **SMTP (Gmail/Amazon SES)** | Email API | Email notifications, receipts |
| **OpenStreetMap** | Maps API | GPS verification, distance calculation |
| **Aadhaar XML API** | KYC | Aadhaar verification (future) |
| **CIBIL API** | Credit Bureau | Credit score pull (future) |
| **Razorpay/PayU** | Payment Gateway | Online EMI payments (future) |
| **Supabase Storage** | File Storage | Document uploads, photos, receipts |

---

## 5. Key Metrics & KPIs

| Metric | Formula | Target |
|--------|---------|--------|
| Disbursement per branch | Sum of loan_amount | Monthly target |
| Collection efficiency | (Collected / Due) × 100 | > 95% |
| NPA ratio | NPA loans / Total loans | < 5% |
| Average loan size | Total disbursed / Loan count | Product-dependent |
| Processing time | Submit → Disburse | < 7 days |
| Application approval rate | Approved / Submitted | > 60% |
| Customer retention | Repeat borrowers | > 40% |
| Field verification SLA | On-time completions | > 90% |

---

*Document version: 1.0.0 | Last updated: October 2026*
