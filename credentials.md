# Demo Test Credentials

> **Testing only:** These credentials are for the demo/test environment described in the role-testing results. Do not use these credentials in production.

| Role | Username | Password |
|---|---|---|
| Super Admin | `admin` | `password123` |
| Branch Admin | `branch.chennai` | `password123` |
| Team Leader | `tl.anna` | `password123` |
| Field Officer | `fo.arun` | `password123` |
| Collection Agent | `ca.selva` | `password123` |
| Customer | `cust.raman` | `password123` |
| Lender | `lender.rao` | `password123` |

## Roles Tested

1. **Super Admin** — Full system access
2. **Branch Admin** — Chennai branch scope
3. **Team Leader** — Management and oversight
4. **Field Officer** — Operational access
5. **Collection Agent** — Collections access
6. **Customer** — Self-service access to own records
7. **Lender** — Investment/portfolio view

## Known Bugs from Demo Testing

- **Loans:** `l.disbursement_date` column does not exist
- **Areas:** `is_active` is ambiguous
- **Notifications:** Required table does not exist
- **Collection Overdues:** Collection Agent endpoint requires a role/permission fix
