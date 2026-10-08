# Continumm Micro Finance Pvt Ltd
# Project Analysis — Business & Technical Analysis v2.0

**Document Version:** 2.0  
**Date:** October 2026  
**Company:** Continumm Micro Finance Pvt Ltd, Chennai, Tamil Nadu  
**Tech Stack:** React (shadcn/ui) + Express.js + PostgreSQL (Supabase)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Domain Analysis](#2-business-domain-analysis)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [Core Business Flows](#4-core-business-flows)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Architecture Overview](#7-technical-architecture-overview)
8. [Database Architecture](#8-database-architecture)
9. [Risk Analysis & Mitigation](#9-risk-analysis--mitigation)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Cost Estimates](#11-cost-estimates)
12. [Compliance & Regulatory](#12-compliance--regulatory)

---

## 1. Executive Summary

Continumm Micro Finance Pvt Ltd (CMF) is a Chennai-based Micro Finance Institution (MFI) providing small-ticket loans to underserved communities. This document provides a comprehensive analysis and design for a complete microfinance management platform covering the entire loan lifecycle.

### Key Metrics
| Metric | Value |
|--------|-------|
| **Expected Users** | 5,000+ end customers |
| **Staff Roles** | 7 (Super Admin, Branch Admin, Team Leader, Field Officer, Collection Agent, Customer, Lender) |
| **Branches** | 10+ (Chennai + surrounding districts) |
| **Loan Products** | 4 categories (Individual, Group, JLG, Emergency) |
| **Expected Portfolio** | ₹50 Crores+ |
| **EMI Frequency** | Weekly / Bi-weekly / Monthly |
| **System Uptime** | 99.5% |

### Technology Stack
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Frontend** | React 18 + shadcn/ui | Component library, rapid development, responsive |
| **Backend** | Node.js + Express.js | JavaScript full-stack, REST API |
| **Database** | PostgreSQL via Supabase | Open-source, RLS, managed hosting |
| **Storage** | Supabase Storage | Document uploads, KYC images |
| **Maps** | OpenStreetMap (Leaflet) | Free, no API keys, field verification |
| **Auth** | Supabase Auth + JWT | Refresh tokens, secure |
| **Hosting** | Supabase + Vercel/Netlify + Railway/Render | Scalable, managed |

---

## 2. Business Domain Analysis

### 2.1 What is Micro Finance?

Micro Finance provides financial services (loans, savings, insurance) to low-income individuals/groups lacking access to traditional banking. Indian MFIs play a crucial role in financial inclusion.

### 2.2 CMF's Business Model

```
                    ┌──────────────────────────────────────┐
                    │         FUNDING SOURCES               │
                    │  (Banks, NBFCs, Angel Investors)       │
                    └──────────────┬───────────────────────┘
                                   │ Capital
                                   ▼
                    ┌──────────────────────────────────────┐
                    │     CONTINNUMM MICRO FINANCE          │
                    │     Chennai HQ Operations              │
                    └──────────────┬───────────────────────┘
                                   │ Disbursement
                                   ▼
                    ┌──────────────────────────────────────┐
                    │           BORROWERS                   │
                    │   (Individuals, JLG Groups, SHGs)     │
                    └──────────────────────────────────────┘
```

### 2.3 Revenue Model
1. **Interest Spread:** 8-10% funding cost → 18-24% lending rate
2. **Processing Fees:** 1-3% at disbursement
3. **Document Charges:** Fixed/percentage per loan
4. **Insurance Premium:** Optional life/accident insurance
5. **Late Payment Penalties:** 2-4% per month on overdue

### 2.4 Key Financial Metrics
| Metric | Formula |
|--------|---------|
| **PAR-30** | EMIs overdue > 30 days / Total Portfolio |
| **PAR-90** | EMIs overdue > 90 days / Total Portfolio |
| **Collection Efficiency** | Amount Collected / Amount Due |
| **Yield on Portfolio** | Interest Income / Average Portfolio |
| **NPA Ratio** | Written Off / Total Disbursed |

### 2.5 Loan Lifecycle

```
Customer Onboard → KYC → Loan Application → Review/Approval → Disbursement → EMI Collection → Close/NPA
     ↓               ↓           ↓                ↓                ↓             ↓              ↓
  Area Assign    Aadhaar/PAN  16 Topics      Stage Workflow   Dynamic       Overdue        Write-off
  Leader         Verify       Documents      Approval Limits  Charges       Penalties      Provision
```

---

## 3. Stakeholder Analysis

### 3.1 User Roles (7 total)

| Role | Description | Core Capabilities |
|------|-------------|-------------------|
| **Super Admin** | Full system control | All features, system config, all branches |
| **Branch Admin** | Chennai HQ operations | Branch admin, approval limits, reports |
| **Team Leader** | Area supervisor | Area management, team tasks, review, collection |
| **Field Officer** | Customer-facing | Application creation, KYC, field verification |
| **Collection Agent** | Field collection | Area-scoped EMI collection, overdue follow-up |
| **Customer (End User)** | Borrower | View profile, dues, statements, pay EMI |
| **Lender** | Investor | Portfolio view, investment tracking |

### 3.2 Chennai-Specific Considerations
- **Tamil Language Support:** UI should support Tamil/English bilingual
- **Aadhaar Integration:** UIDAI-based eKYC for verification
- **PAN Integration:** NSDL/UTIITSL API
- **Local Banks:** Indian Bank, Tamilnad Mercantile, City Union
- **Area Structure:** Chennai 15 zones, 200+ wards — pincode/ward mapping
- **10-digit IDs:** All entities use prefixed IDs (CMF1000001, APP1000001, etc.)

---

## 4. Core Business Flows

### 4.1 Customer Onboarding Flow

```
Step 1: Area Creation (Admin)
    └── Define area, pincode, city, OSM coordinates
    └── Assign team leader
    └── Assign collection agents

Step 2: Customer Registration (Field Officer)
    └── Personal details (name, DOB, gender, marital status)
    └── Contact (phone, email, address)
    └── Aadhaar verification
    └── PAN verification
    └── Family details, education, occupation
    └── Referral tracking
    └── Trust score calculation

Step 3: KYC & Banking
    └── Aadhaar linked bank account
    └── Bank statement upload
    └── Nominee details
    └── Wealth & obligations tracking
```

### 4.2 Loan Application & Approval Flow

```
Step 1: Application Creation (Field Officer)
    └── 16 Topic Sections:
        1. Applicant Details
        2. Basic Details
        3. KYC Details
        4. Work Details
        5. Banking Details
        6. Ratio Analysis (DTI)
        7. Obligations (existing loans/credit cards)
        8. Income Details
        9. Customer Wealth
        10. Product Details (purpose, amount)
        11. Property Details (collateral)
        12. Eligibility Calculation
        13. Documents (KYC uploads)
        14. Verification Checks
        15. Notes
        16. Query

Step 2: Submit → Status: SUBMITTED
    └── Auto-validation
    └── Assign to Team Leader

Step 3: Stage Workflow
    └── Document Verification → Field Verification → Credit Assessment
    └── Committee Review → Approval → Disbursement
    └── Approval limits enforced per role

Step 4: Field Verification
    └── Task assigned to Field Officer
    └── OSM location capture + coordinate verification
    └── Document verification
    └── Completion with recommendation

Step 5: Final Approval
    └── Approved by + Reviewed by stored
    └── EMI schedule generated
```

### 4.3 Disbursement Flow

```
Step 1: Super Admin Creates Disbursement
    ├── Select bank account (multi-bank support)
    ├── Dynamic Processing Fee (product slab-based)
    ├── Dynamic Document Charge (product-based)
    ├── Dynamic Insurance (optional, product-based)
    ├── CGST + SGST on charges
    ├── Net = Loan Amount - Total Charges
    └── Bank transfer with UTR

Step 2: Ledger Double-Entry
    ├── Dr. Loan Portfolio
    ├── Cr. Bank Account (net amount)
    ├── Dr. Processing Fee Expense
    ├── Cr. Processing Fee Income
    ├── Dr. Document Expense
    └── Cr. Document Charge Income

Step 3: EMI Schedule Generated
    └── Reducing balance calculation
    └── Principal + Interest per month
    └── 24 EMIs (for 24-month loan)
```

### 4.4 Collection & Overdue Flow

```
Daily Cron:
├── Detect overdue EMIs (is_paid=false AND due_date < today)
├── Update is_overdue flag + days_overdue
├── Apply penalty (configurable rate per product)
├── Auto-classify 90+ days as NPA
└── Notify team leaders + collection agents

Overdue Escalation:
├── 1-30 days: SMS reminder to customer
├── 30 days: Team Leader follow-up
├── 60 days: Branch Admin intervention
├── 90 days: NPA Substandard
├── 180 days: NPA Doubtful
└── 360 days: NPA Loss (write-off)
```

---

## 5. Functional Requirements

### 5.1 Area Management
- Create area with OSM coordinates
- Assign area leaders (Team Leaders)
- Assign collection agents
- Area-scoped data access for agents

### 5.2 Customer Management
- Registration with phone/email (login via username)
- Aadhaar + PAN + Voter ID + CKYC verification
- Personal profile (name, DOB, gender, marital, blood group, education)
- Emergency contacts
- Banking details (account, IFSC, statements)
- Wealth assessment (house, land, vehicle, gold, business, livestock)
- Obligations tracking (existing loans, credit cards)
- Trust score calculation (team + community + repayment history)

### 5.3 Loan Application
- Dynamic 16-topic form with JSONB storage
- Auto-save per topic
- Progress tracking (completion %)
- Stage-based approval workflow (7 stages)
- Query/Raise issue mechanism
- Document upload per topic
- Approval limits per role
- Approval history audit trail

### 5.4 Loan Products
- Create products (Individual, Group, JLG, Emergency)
- Set limits: min/max amount, min/max tenure, interest rate range
- Dynamic charges: processing fee, document charge, insurance
- Slab-based charges: different rates per loan amount bracket
- CGST/SGST on charges

### 5.5 Disbursement
- Multi-bank account selection
- Dynamic charge calculation from slabs
- EMI schedule generation (reducing balance)
- UTR recording
- Auto-posting to ledger (double-entry)

### 5.6 EMI Collection
- Payment recording (cash, bank_transfer, UPI, cheque, card)
- Receipt generation (PDF)
- Overdue detection (daily cron)
- Late fee/penalty calculation
- Penalty management (waive/collect)
- Customer dues portal

### 5.7 Ledger
- Chart of accounts (5 groups)
- Double-entry journal entries
- Auto-posting on disbursement, EMI, penalty
- Account balances
- Bank statement entries
- Bank reconciliation

### 5.8 Verification & Tasks
- Task types: field_verification, document_verification, collection, address_verification
- GPS coordinate capture
- Photo upload
- Verification result (verified/not_verified/discrepancy)
- Risk rating

### 5.9 Communication
- SMS templates with variables
- Email templates (HTML + text)
- Communication logs
- Bulk SMS
- Auto-triggers: EMI reminders, overdue alerts, disbursement notifications

### 5.10 Reports & Dashboard
- Portfolio report (by product, branch, status)
- Collection report (daily trends, collection rate)
- NPA report (classifications with details)
- Branch report (comprehensive per-branch)
- Agent performance
- Ledger P&L report
- Dashboard KPIs

---

## 6. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Performance** | API < 500ms, page load < 2s |
| **Scalability** | 10,000+ users, 100K+ loans |
| **Availability** | 99.5% uptime |
| **Security** | JWT + RBAC + RLS + bcrypt passwords |
| **Backup** | Daily Supabase backup, point-in-time recovery |
| **Compliance** | RBI NBFC-MFI, Aadhaar guidelines |
| **Mobile** | Responsive, Android tablet friendly |
| **Offline** | Collection agents need offline capture |

---

## 7. Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐     │
│  │   React SPA  │ │  Mobile Web  │ │   Customer Portal     │     │
│  │  (shadcn/ui) │ │  (PWA-ready)  │ │   (Self-service)      │     │
│  └──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘     │
└─────────┼────────────────┼────────────────────┼──────────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD PLATFORM                       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              Express.js API Layer (14 routes)              │   │
│  │  auth | applications | loans | emi | disbursements        │   │
│  │  ledger | dashboard | communication | tasks | areas       │   │
│  │  settings | cron | reports | upload | notifications       │   │
│  └───────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              15 Service Modules (130+ functions)           │   │
│  │  auth | application | loan | emi | disbursement           │   │
│  │  ledger | communication | pdf | cron | upload             │   │
│  │  reports | dashboard | common | notification               │   │
│  └───────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL (48 tables, UUID PKs)               │   │
│  │  Triggers for ID generation, RLS policies, functions       │   │
│  └───────────────────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │              Supabase Storage + Auth                        │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATIONS                               │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ Aadhaar  │ │   PAN    │ │  SMS       │ │    Email         │  │
│  │ eKYC API │ │ NSDL API │ │ (MSG91)    │ │  (SMTP/Resend)   │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              OpenStreetMap (Leaflet)                       │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Database Architecture

### 8.1 Complete Table List (48 tables)

| # | Table | Purpose |
|---|-------|---------|
| 1 | id_counters | 10-digit ID generation tracking |
| 2 | users | All system users (authentication) |
| 3 | user_profiles | Extended user details, KYC |
| 4 | user_areas | Area-user assignments |
| 5 | password_reset_tokens | Password reset |
| 6 | jwt_refresh_tokens | JWT refresh |
| 7 | login_audit | Login history |
| 8 | roles | User roles |
| 9 | permissions | Permission definitions |
| 10 | role_permissions | Role-permission mapping |
| 11 | user_permission_overrides | Per-user overrides |
| 12 | branches | Branch management |
| 13 | areas | Geographic areas |
| 14 | bank_accounts | Company bank accounts |
| 15 | loan_products | Product configuration |
| 16 | product_slabs | Dynamic charge brackets |
| 17 | applications | Loan applications |
| 18 | application_topics | 16 topic sections per app |
| 19 | application_notes | Notes & queries |
| 20 | application_documents | App documents |
| 21 | stages | Approval workflow stages |
| 22 | application_stages | Current stage per app |
| 23 | stage_transitions | Stage change history |
| 24 | approval_limits | Per-role approval ceilings |
| 25 | approval_history | Approval audit trail |
| 26 | loans | Active loans |
| 27 | emi_schedules | EMI installment records |
| 28 | emi_payments | Payment records |
| 29 | payment_receipts | Receipt tracking |
| 30 | penalties | Late payment penalties |
| 31 | disbursements | Disbursement records |
| 32 | disbursement_charges | Per-disbursement charges |
| 33 | ledger_accounts | Chart of accounts |
| 34 | ledger_entries | Journal entry headers |
| 35 | ledger_entry_lines | Dr/Cr lines per entry |
| 36 | ledger_account_balances | Running balances |
| 37 | bank_statement_entries | Bank transactions |
| 38 | bank_reconciliations | Reconciliation records |
| 39 | verification_tasks | Field tasks |
| 40 | verifications | Verification results |
| 41 | npa_classifications | NPA tracking |
| 42 | referrals | Referral tracking |
| 43 | trust_scores | Calculated trust scores |
| 44 | sms_templates | SMS templates |
| 45 | sms_logs | SMS send log |
| 46 | email_templates | Email templates |
| 47 | email_logs | Email send log |
| 48 | audit_logs | Complete audit trail |
| 49 | app_settings | Application settings |
| 50 | notifications | In-app notifications |

---

## 9. Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss | Critical | Low | Daily Supabase backups |
| EMI calc error | Critical | Low | Unit tests, peer review |
| Ledger imbalance | Critical | Low | Transaction wrappers |
| Unauthorized access | High | Medium | JWT + RLS + RBAC |
| Loan approval bypass | High | Low | Approval limits at DB + service |
| Field verification fraud | High | Medium | OSM coordinates, timestamps |
| SMS/Email failure | Medium | Medium | Retry logic, fallback |
| Scalability | Medium | Medium | Connection pooling, caching |
| Aadhaar API downtime | Medium | Low | Manual verification fallback |
| NPA misclassification | High | Medium | Automated + manual review |

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Database schema (50 tables)
- [x] Backend service architecture
- [x] Authentication & authorization
- [ ] Chennai HQ setup (first branch)
- [ ] 3 initial areas (T Nagar, Adyar, Velachery)

### Phase 2: Customer Onboarding (Weeks 3-4)
- [ ] Customer registration with KYC
- [ ] Aadhaar/PAN verification
- [ ] Area management with OSM
- [ ] Loan product configuration
- [ ] 50 customer profiles

### Phase 3: Loan Application (Weeks 5-6)
- [ ] 16-topic application form
- [ ] Stage-based workflow (7 stages)
- [ ] Approval limits enforcement
- [ ] Query/Raise issue system
- [ ] Document management

### Phase 4: Disbursement (Weeks 7-8)
- [ ] Dynamic charge calculation (slabs)
- [ ] Multi-bank support
- [ ] Double-entry ledger
- [ ] EMI schedule generation
- [ ] Notification system

### Phase 5: Collection (Weeks 9-10)
- [ ] EMI payment recording
- [ ] Overdue detection (cron)
- [ ] Penalty management
- [ ] Receipt generation
- [ ] Agent dashboard

### Phase 6: NPA & Reports (Weeks 11-12)
- [ ] NPA classification engine
- [ ] Collection/Portfolio/NPA reports
- [ ] Dashboard KPIs

### Phase 7: Launch (Weeks 13-14)
- [ ] Customer portal
- [ ] Mobile optimization
- [ ] Data migration
- [ ] Chennai go-live

---

## 11. Cost Estimates

| Component | Monthly Cost |
|-----------|-------------|
| Supabase Pro | $25 (~₹2,100) |
| Supabase Storage | $5 (~₹420) |
| Backend (Railway) | $7 (~₹590) |
| Frontend (Vercel) | Free |
| SMS (MSG91) | ₹2,000 |
| Email (Resend) | Free |
| **Total** | **~₹6,000/month** |

---

## 12. Compliance & Regulatory

- [ ] RBI NBFC-MFI guidelines
- [ ] Aadhaar data encryption (UIDAI)
- [ ] Customer data privacy
- [ ] TLS 1.3 encryption
- [ ] Audit trail for all access
- [ ] Tamil language support
- [ ] 90-day NPA recognition norm

---

*End of Project Analysis v2.0*
*Continumm Micro Finance Pvt Ltd — Chennai*