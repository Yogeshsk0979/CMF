# CMF — Project Analysis
**Chennai Microfinance Platform — Complete Business & Functional Analysis**

---

## 1. Executive Summary

This document defines the complete business analysis for **CMF (Chennai Microfinance)**, a cloud-based microfinance management platform built for a Chennai-based non-banking finance company. The system covers the full loan lifecycle: from area creation and customer onboarding → KYC verification → loan application with dynamic stage review → eligibility calculation → disbursement with configurable charges → EMI collection → overdue tracking → accounting ledger.

---

## 2. Company Profile

| Attribute | Detail |
|-----------|--------|
| **Name** | Chennai Microfinance (CMF) |
| **Vertical** | Microfinance / Non-Banking Financial Company |
| **Geography** | Chennai, Tamil Nadu, India |
| **Primary Language** | Tamil + English |
| **Scale** | Multi-branch, multi-area, field-force driven |
| **Tech Stack** | React (shadcn/ui) + Express.js + PostgreSQL (Supabase) |

---

## 3. User Roles & Permissions

### 3.1 Role Matrix

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **super_admin** | Full system control, typically owner/CEO | All CRUD, system config, approval limits, EMI rates, charges, all modules |
| **branch_admin** | Manages a single branch | Area creation, user creation within branch, application review, disbursement approval, report viewing |
| **team_leader** | Leads field collection agents | Assigned-area access, collection tracking, team oversight, overdue follow-up |
| **field_officer** | On-ground EMI collection & field verification | Area-restricted access, customer visits, payment receipt, field verification |
| **collection_agent** | EMI collection | Area-restricted access, EMI payment receipt, collection tracking |
| **customer** | Loan customer / End User | View own EMI schedule, pay dues, download receipts, view loan summary |
| **lender** | Investor / Funder | Portfolio view, disbursement tracking, report viewing |

### 3.2 Permission Architecture

- **Database-driven RBAC** via 5 tables: `roles`, `permissions`, `role_permissions`, `user_permission_overrides`, `user_areas`
- **7 system roles**: super_admin, branch_admin, team_leader, field_officer, collection_agent, customer, lender
- **40+ granular permissions** across modules: dashboard, branches, areas, users, products, applications, disbursements, emi, ledger, banks, reconciliation, tasks, sms, email, reports, settings
- **Per-user overrides**: Admin can grant/revoke individual permissions per user via `user_permission_overrides`
- **Area-level access**: Users assigned to areas via `user_areas` table; queries scoped to assigned areas

---

## 4. Module-by-Module Feature Breakdown

### 4.1 Area & User Management

| Feature | Description |
|---------|-------------|
| **Area Creation** | Define collection areas with name, code, pincode, city, branch assignment, geo-fence polygon |
| **Area Leader Assignment** | Each area has a designated Team Leader |
| **User Management** | CRUD for all roles, profile photo, contact, status (active/inactive) |
| **Permission Configuration** | Per-user custom permission flags |
| **Branch Management** | Multi-branch support with independent data isolation |

### 4.2 Loan Application Engine

The application is the **core entity** — a single loan application contains all the following sub-modules:

#### 4.2.1 Application Stages (Dynamic Pipeline)

```
1. NEW → 2. DOCUMENTS_UPLOADED → 3. VERIFICATION_PENDING →
4. VERIFIED → 5. ELIGIBILITY_CHECK → 6. ELIGIBLE →
7. MANAGER_REVIEW → 8. APPROVED → 9. DISBURSED
```

- Each stage is **dynamically configurable** by Admin/Super Admin
- Stage transitions trigger automated notifications (SMS/Email)
- Stage history is logged with user, timestamp, and remarks

#### 4.2.2 Application Sub-Topics

| # | Sub-Topic | Data Fields |
|---|-----------|-------------|
| 1 | **Applicant Details** | First name, last name, father/husband name, DOB, gender, age, photo |
| 2 | **Basic Details** | Address, pincode, city, state, mobile, alternate mobile, email, religion, caste, education |
| 3 | **KYC Details** | Aadhaar number, Aadhaar XML/Auth API verification, PAN number, voter ID, driving licence |
| 4 | **Work Details** | Employment type (salaried/self-employed/business), occupation, employer name, monthly income, years in current job |
| 5 | **Banking Details** | Bank name, account number, IFSC, account type, passbook upload, bank statement upload |
| 6 | **Ratio Analysis** | Debt-to-income ratio, loan-to-value ratio, net worth ratio, calculated automatically from entered data |
| 7 | **Obligations** | Existing credit cards (outstanding, limit), current loans (lender, amount, EMI, balance) |
| 8 | **Income Details** | Primary income, secondary income, family income, other income sources |
| 9 | **Customer Wealth** | Land value, building value, vehicle value, gold value, other assets, total net worth |
| 10 | **Product Details** | Loan product, loan amount requested, tenure (months), purpose of loan |
| 11 | **Property Details** | Property type (owned/rented), address, area, market value |
| 12 | **Eligibility Calculation** | Auto-calculated: max eligible amount, EMI affordability, score |
| 13 | **Documents** | Uploaded files per category (Aadhaar, PAN, income proof, address proof, photo, etc.) |
| 14 | **Verification Checks** | Aadhaar biometric verification, address verification, income verification, reference check |
| 15 | **Review Notes** | Reviewer's remarks, rejection reason, queries raised |
| 16 | **Queries** | Raised by reviewer, answered by applicant, re-upload documents, query history |

#### 4.2.3 Approval Workflow

```
Loan Officer → (submits) → Branch Manager Review → (approves/rejects)
→ Super Admin Approval (if amount > branch limit)
→ Approved (ready for disbursement)
```

- **Approval limits**: Configurable per branch/role. E.g., Branch Manager can approve up to ₹50,000; above that, Super Admin approval required
- Quarantine/hold: Application can be put on hold for further review

### 4.3 Dynamic EMI Configuration (Super Admin)

| Feature | Description |
|---------|-------------|
| **EMI Tenure Selection** | Dynamic tenure options per product (3, 6, 12, 18, 24, 36 months) — configurable |
| **Interest Rate Management** | Per-product base rate, per-customer risk-based adjustment, age-based rate |
| **EMI Calculation Engine** | Reducing balance method: `EMI = P × r × (1+r)^n / ((1+r)^n - 1)` |
| **Interest Calculation** | Daily interest on outstanding balance for overdue amounts |
| **Grace Period** | Configurable grace days before late fee applies |

### 4.4 Disbursement & Charges

| Feature | Description |
|---------|-------------|
| **Disbursement Creation** | Select approved application, enter actual disbursement amount (may differ from approved amount) |
| **Processing Charges** | Dynamic percentage or flat per loan amount slab — configurable by Super Admin |
| **Document Charges** | Dynamic per loan amount — configurable |
| **Insurance Charges** | Optional — configurable |
| **Net Disbursement** | Loan amount minus all charges (credited to customer bank account) |
| **Multi-Bank Support** | Select bank account at time of disbursement from managed bank accounts |
| **Disbursement Approval** | Required before funds release |
| **Disbursement Statement** | Auto-generated PDF with full breakdown |

### 4.5 EMI Collection & Overdue Management

| Feature | Description |
|---------|-------------|
| **EMI Schedule Generation** | Auto-generated from disbursement date with day-of-month |
| **Monthly Collection** | Agent marks EMI as paid (cash/online), generates receipt |
| **Online Payment Integration** | Payment gateway link for customer self-payment |
| **Overdue Detection** | Automated: EMI unpaid past due date → flagged |
| **Late Payment Fee** | Calculated per overdue day: `late_fee = overdue_days × daily_rate` |
| **Penalty Charges** | Configurable flat or percentage penalty for overdue |
| **Admin/Team Leader Alerts** | Auto SMS/Email on overdue, escalation after N days |
| **Collection Report** | Agent-wise, area-wise, branch-wise daily/monthly collection summary |
| **Receipt Generation** | PDF receipt for every payment (print/download) |

### 4.6 Dynamic Ledger System

| Feature | Description |
|---------|-------------|
| **Chart of Accounts** | Hierarchical: Assets, Liabilities, Income, Expenses, Equity |
| **Multi-Bank Account Management** | Each bank account is a ledger account (Asset → Bank) |
| **Disbursement Journal Entry** | Dr: Loan Account, Cr: Bank Account (net amount) + Cr: Processing Fee Income + Cr: Document Charge Income |
| **EMI Receipt Entry** | Dr: Bank/Cash, Cr: Loan Account (principal portion) + Cr: Interest Income |
| **Office Expense Entry** | Dr: Expense Account, Cr: Bank/Cash |
| **Salary Payment Entry** | Dr: Salary Expense, Cr: Bank Account |
| **Bank Reconciliation** | Import bank statement → auto-match with journal entries |
| **Trial Balance** | Auto-generated at any point in time |
| **Ledger Report** | Account-wise transaction history with running balance |
| **Day Book** | All transactions for a selected date |

#### Ledger Entry Types

| Entry Type | Debit | Credit | Trigger |
|------------|-------|--------|---------|
| **Disbursement** | Loan A/c | Bank A/c + Charges A/c | On disbursement approval |
| **EMI Payment (Principal)** | Bank/Cash A/c | Loan A/c | On payment receipt |
| **EMI Payment (Interest)** | Bank/Cash A/c | Interest Income A/c | On payment receipt |
| **Late Fee Received** | Bank/Cash A/c | Late Fee Income A/c | On late payment |
| **Office Expense** | Expense A/c | Bank/Cash A/c | Manual entry by admin |
| **Salary Payment** | Salary Expense A/c | Bank A/c | Manual entry by admin |
| **Reversal** | Original Credit | Original Debit | On reversal |

### 4.7 Customer Portal (End User Login)

| Feature | Description |
|---------|-------------|
| **Self-Registration** | Via OTP on mobile number |
| **Dashboard** | Current loan summary, next EMI due, outstanding balance |
| **EMI Statement** | Complete amortization schedule with paid/pending status |
| **Payment History** | All past payments with receipts |
| **Pay EMI** | Online payment via integrated gateway |
| **Download Receipts** | PDF for each payment made |
| **Profile View** | Personal details, KYC status |
| **Apply for New Loan** | Online application initiation |

### 4.8 Field Verification Officer

| Feature | Description |
|---------|-------------|
| **Task Assignment** | Admin assigns verification tasks (KYC verification, field visit, collection follow-up) |
| **Task List** | All assigned tasks with priority, due date, customer details |
| **GPS Field Visit** | OpenStreetMap integration — officer reaches customer location, captures GPS coordinates |
| **Location Verification** | System compares submitted GPS coordinates with address — matches or flags discrepancy |
| **Photo Capture** | Customer photo, document photos, property photos |
| **Verification Report** | Submit report with findings, customer confirmed/disconfirmed, remarks |
| **Collection Task** | If assigned collection, mark payment collected, generate receipt |

### 4.9 SMS & Email Communication

| Feature | Description |
|---------|-------------|
| **Template Management** | Create SMS/Email templates with merge variables ({{name}}, {{amount}}, {{date}}, etc.) |
| **Bulk Sending** | Send to filtered customer lists |
| **Automated Triggers** | Application status change, EMI due reminder, overdue alert, disbursement confirmation, payment receipt |
| **Provider Integration** | Twilio / MSG91 / TextLocal for SMS; SMTP / SendGrid / AWS SES for Email |
| **Communication Log** | Complete history of all sent messages per customer |

### 4.10 Reporting & Analytics

| Report | Description |
|--------|-------------|
| **Disbursement Report** | Date-wise, branch-wise, product-wise, officer-wise |
| **Collection Report** | Agent-wise collection, area-wise, daily/monthly |
| **Overdue Report** | Outstanding overdue amount, aging analysis |
| **Portfolio Report** | Total outstanding, NPA classification, portfolio at risk |
| **Ledger Reports** | Trial balance, day book, bank reconciliation, account statement |
| **Application Report** | Funnel analysis: applications → verified → approved → disbursed |
| **User Activity Log** | Complete audit trail of all user actions |

### 4.11 Document Management

- Upload per application stage
- Document categories with file type/size validation
- OCR for Aadhaar/PAN extraction (future enhancement)
- Secure document storage via Supabase Storage
- Downloadable document sets (KYC package, application package)

---

## 5. Business Rules & Calculations

### 5.1 EMI Calculation (Reducing Balance)

```
EMI = P × r × (1+r)^n / ((1+r)^n - 1)

Where:
  P = Principal (loan amount)
  r = Monthly interest rate (annual_rate / 12 / 100)
  n = Number of months
```

### 5.2 Late Payment Fee

```
late_fee = overdue_days × per_day_rate
per_day_rate = (outstanding_balance × annual_late_rate) / (365 × 100)
```

### 5.3 Dynamic Charges (at Disbursement)

```
processing_fee = MAX(min_charge, loan_amount × processing_rate)
document_fee    = MAX(min_charge, loan_amount × document_rate)
insurance_fee   = configurable_flat_or_percentage
gst             = (processing_fee + document_fee + insurance_fee) × gst_rate
net_disbursement = loan_amount - processing_fee - document_fee - insurance_fee - gst
```

### 5.4 Eligibility Calculation

```
eligible_amount = MIN(
  (monthly_income × dti_multiplier),
  (net_worth × loan_to_value_ratio),
  (product_max_limit - existing_exposure)
)
```

### 5.5 Ratio Analysis

| Ratio | Formula | Threshold |
|-------|---------|-----------|
| **Debt-to-Income (DTI)** | Total monthly EMIs / Monthly income | Max 40% |
| **Loan-to-Value (LTV)** | Loan amount / Collateral value | Max 70% |
| **Debt Service Coverage** | Net income / Total EMIs | Min 1.2 |

---

## 6. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Concurrent Users** | 200+ simultaneous field agents |
| **Response Time** | < 2 seconds for all page loads |
| **Uptime** | 99.5% (business hours critical) |
| **Data Backup** | Daily automated backup via Supabase |
| **Security** | RLS on all tables, JWT auth, HTTPS only |
| **Mobile Support** | Responsive design — agents use tablets/phones |
| **Offline Support** | PWA with offline payment capture (sync when online) |
| **File Storage** | Supabase Storage for documents (max 5MB per file) |
| **Audit Trail** | Complete activity log for all data changes |

---

## 7. Integration Points

| External System | Purpose | Implementation |
|----------------|---------|----------------|
| **Aadhaar XML / eKYC API** | Identity verification | Aadhaar REST API (UIDAI) |
| **CIBIL / Credit Bureau API** | Credit score fetch | Bureau API integration |
| **SMS Gateway** | Automated SMS | MSG91 / Twilio |
| **Email Service** | Automated emails | SendGrid / AWS SES |
| **Payment Gateway** | Online EMI payment | Razorpay / PayU |
| **OpenStreetMap** | GPS verification | Leaflet.js (frontend) |
| **PDF Generator** | Statements, receipts | jsPDF / Puppeteer |
| **Bank APIs** *(future)* | Auto reconciliation | Per-bank integration |

---

## 8. Glossary

| Term | Meaning |
|------|---------|
| **Application** | A customer's request for a loan — contains all personal, financial, and document data |
| **Disbursement** | The act of releasing loan funds to the customer |
| **EMI** | Equated Monthly Installment — fixed monthly payment |
| **Overdue** | An EMI not paid by its due date |
| **NPA** | Non-Performing Asset — loan overdue > 90 days |
| **Ledger** | Accounting record of all financial transactions |
| **Day Book** | Daily record of all transactions |
| **Trial Balance** | Summary of all ledger balances at a point in time |
| **Aadhaar XML** | Downloadable identity document from UIDAI with eKYC data |
| **Field Verification** | Physical visit to customer's address/workplace |
| **Area** | Geographic collection zone assigned to a team leader |
