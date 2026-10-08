import { query } from '../config/db.js';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateHtmlReceipt(payment, customer, loan) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>EMI Receipt - ${payment.payment_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; color: #1e40af; margin: 0; }
    .company-subtitle { font-size: 14px; color: #666; margin: 5px 0; }
    .receipt-number { font-size: 18px; font-weight: bold; margin-top: 10px; }
    .section { margin-bottom: 25px; }
    .section-title { font-weight: bold; background: #f3f4f6; padding: 8px 12px; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .field-label { font-size: 12px; color: #6b7280; }
    .field-value { font-size: 14px; font-weight: 500; }
    .breakdown { background: #f9fafb; padding: 15px; border-radius: 5px; }
    .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #d1d5db; }
    .breakdown-row:last-child { border-bottom: none; font-weight: bold; font-size: 16px; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; }
    .stamp { text-align: right; color: #059669; font-style: italic; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="company-name">CONTINNUM MICRO FINANCE PVT LTD</h1>
    <div class="company-subtitle">Chennai, Tamil Nadu | CIN: U65999TN2026PTC123456 | GST: 33ABCDE1234F1Z5</div>
    <div class="receipt-number">PAYMENT RECEIPT - ${payment.receipt_number || payment.payment_number}</div>
  </div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${customer.first_name || ''} ${customer.last_name || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">Customer Code</div>
        <div class="field-value">${customer.customer_code || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${customer.phone || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${customer.email || ''}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Loan Details</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Loan Number</div>
        <div class="field-value">${loan.loan_number || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">EMI Number</div>
        <div class="field-value">#${payment.emi_number || 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Breakdown</div>
    <div class="breakdown">
      <div class="breakdown-row">
        <span>Principal Component</span>
        <span>${formatCurrency(payment.principal_component)}</span>
      </div>
      <div class="breakdown-row">
        <span>Interest Component</span>
        <span>${formatCurrency(payment.interest_component)}</span>
      </div>
      ${parseFloat(payment.penalty_component) > 0 ? `
      <div class="breakdown-row" style="color: #dc2626;">
        <span>Late Fee / Penalty</span>
        <span>${formatCurrency(payment.penalty_component)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span>TOTAL PAID</span>
        <span>${formatCurrency(payment.payment_amount)}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Information</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Payment Date</div>
        <div class="field-value">${formatDate(payment.payment_date)}</div>
      </div>
      <div class="field">
        <div class="field-label">Payment Method</div>
        <div class="field-value">${payment.payment_method || 'Cash'}</div>
      </div>
      ${payment.transaction_ref ? `
      <div class="field">
        <div class="field-label">Transaction Reference</div>
        <div class="field-value">${payment.transaction_ref}</div>
      </div>` : ''}
    </div>
  </div>

  <div class="stamp">✓ PAID IN FULL</div>

  <div class="footer">
    This is a computer-generated receipt and does not require a signature.<br>
    Continnum Micro Finance Pvt Ltd | GSTIN: 33ABCDE1234F1Z5 | NBFC-MFI Registered
  </div>
</body>
</html>`;
}

export function generateHtmlLoanStatement(loan, customer, schedule) {
  const totalPayable = schedule.reduce((s, e) => s + parseFloat(e.emi_amount), 0);
  const totalInterest = schedule.reduce((s, e) => s + parseFloat(e.interest), 0);
  const totalPrincipal = schedule.reduce((s, e) => s + parseFloat(e.principal), 0);
  const paidEmis = schedule.filter(e => e.is_paid);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Loan Statement - ${loan.loan_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
    .section { margin-bottom: 25px; }
    .section-title { font-weight: bold; background: #1e40af; color: white; padding: 10px 15px; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .field { padding: 10px; background: #f9fafb; border-radius: 5px; }
    .field-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    .field-value { font-size: 16px; font-weight: 600; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    th { background: #1e40af; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    .paid { background: #d1fae5 !important; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px; }
    .summary-card { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 15px; border-radius: 8px; text-align: center; }
    .summary-card .label { font-size: 11px; opacity: 0.9; }
    .summary-card .value { font-size: 18px; font-weight: bold; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">CONTINNUM MICRO FINANCE PVT LTD</div>
    <div style="font-size: 12px; color: #666; margin-top: 5px;">LOAN STATEMENT</div>
    <div style="font-size: 16px; font-weight: bold; margin-top: 10px;">${loan.loan_number}</div>
  </div>

  <div class="section">
    <div class="section-title">Customer & Loan Information</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Customer</div>
        <div class="field-value">${customer.first_name || ''} ${customer.last_name || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">Code</div>
        <div class="field-value">${customer.customer_code || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${customer.phone || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">Disbursed Date</div>
        <div class="field-value">${formatDate(loan.created_at)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Loan Summary</div>
    <div class="summary">
      <div class="summary-card">
        <div class="label">LOAN AMOUNT</div>
        <div class="value">${formatCurrency(loan.loan_amount)}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #059669, #10b981);">
        <div class="label">TOTAL INTEREST</div>
        <div class="value">${formatCurrency(totalInterest)}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #7c3aed, #a855f7);">
        <div class="label">TOTAL PAYABLE</div>
        <div class="value">${formatCurrency(totalPayable)}</div>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #dc2626, #ef4444);">
        <div class="label">OUTSTANDING</div>
        <div class="value">${formatCurrency(loan.outstanding_principal)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">EMI Schedule</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Due Date</th>
          <th>EMI Amount</th>
          <th>Principal</th>
          <th>Interest</th>
          <th>Balance</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${schedule.map(e => `
          <tr class="${e.is_paid ? 'paid' : ''}">
            <td>${e.emi_number}</td>
            <td>${formatDate(e.due_date)}</td>
            <td>${formatCurrency(e.emi_amount)}</td>
            <td>${formatCurrency(e.principal)}</td>
            <td>${formatCurrency(e.interest)}</td>
            <td>${formatCurrency(e.closing_balance)}</td>
            <td>${e.is_paid ? '✓ Paid' : 'Pending'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    This is a computer-generated statement. Continnum Micro Finance Pvt Ltd<br>
    Generated on ${formatDate(new Date())}
  </div>
</body>
</html>`;
}

export async function generateEmiReceipt(paymentId) {
  const paymentResult = await query(
    `SELECT ep.*, pr.receipt_number, l.loan_number, lp.product_name,
       u.id as customer_id, u.email, u.phone, u.customer_code,
       p.first_name, p.last_name, p.address
     FROM emi_payments ep
     LEFT JOIN payment_receipts pr ON pr.emi_payment_id = ep.id
     JOIN loans l ON l.id = ep.loan_id
     JOIN loan_products lp ON lp.id = l.product_id
     JOIN users u ON u.id = ep.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE ep.id = $1`, [paymentId]);
  const payment = paymentResult.rows[0];
  if (!payment) throw new Error('Payment not found');

  const html = generateHtmlReceipt(payment, payment, { loan_number: payment.loan_number });

  // Save PDF path
  await query('UPDATE payment_receipts SET pdf_path = $1 WHERE emi_payment_id = $2',
    [`receipt_${payment.receipt_number}.html`, paymentId]);

  return { html, payment, receiptNumber: payment.receipt_number };
}

export async function generateLoanStatement(loanId) {
  const loanResult = await query(
    `SELECT l.*, lp.product_name, lp.interest_rate as product_rate,
       u.email, u.phone, u.customer_code, p.first_name, p.last_name
     FROM loans l JOIN loan_products lp ON lp.id = l.product_id
     JOIN users u ON u.id = l.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id WHERE l.id = $1`, [loanId]);
  const loan = loanResult.rows[0];
  if (!loan) throw new Error('Loan not found');

  const schedule = await query('SELECT * FROM emi_schedules WHERE loan_id = $1 ORDER BY emi_number', [loanId]);
  const html = generateHtmlLoanStatement(loan, loan, schedule.rows);

  return { html, loan, schedule: schedule.rows };
}

export function generateHtmlDisbursementStatement(disbursement) {
  const d = disbursement;
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Disbursement - ${d.disbursement_number}</title>
<style>
body { font-family: Arial; max-width: 800px; margin: auto; padding: 30px; }
.header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
th { background: #1e40af; color: white; }
.amount { font-size: 24px; color: #059669; font-weight: bold; text-align: center; padding: 20px; }
</style></head><body>
<div class="header">
<h1>CONTINNUM MICRO FINANCE PVT LTD</h1>
<h2>DISBURSEMENT STATEMENT</h2>
<p><strong>${d.disbursement_number}</strong></p>
</div>
<table>
<tr><th>Customer</th><td>${d.first_name || ''} ${d.last_name || ''} (${d.customer_code || ''})</td></tr>
<tr><th>Loan Number</th><td>${d.loan_number || ''}</td></tr>
<tr><th>Product</th><td>${d.product_name || ''}</td></tr>
<tr><th>Tenure</th><td>${d.tenure_months || ''} months</td></tr>
<tr><th>Interest Rate</th><td>${d.interest_rate || ''}% p.a.</td></tr>
<tr><th>EMI Amount</th><td>${formatCurrency(d.emi_amount)}</td></tr>
<tr><th>Disbursement Date</th><td>${formatDate(d.disbursement_date)}</td></tr>
${d.utr_number ? `<tr><th>UTR Number</th><td>${d.utr_number}</td></tr>` : ''}
</table>
<h3>Charges Breakdown</h3>
<table>
<tr><th>Charge Type</th><th>Amount</th></tr>
${(d.charges || []).map(c => `<tr><td>${c.charge_head}</td><td>${formatCurrency(c.charge_amount)}</td></tr>`).join('')}
${d.total_charges ? `<tr><th>Total Charges</th><td><strong>${formatCurrency(d.total_charges)}</strong></td></tr>` : ''}
</table>
<div class="amount">NET DISBURSED: ${formatCurrency(d.net_disbursement_amount || 0)}</div>
<p style="text-align: center; color: #666; font-size: 11px;">Generated on ${formatDate(new Date())}</p>
</body></html>`;
}

export async function generateDisbursementStatement(disbursementId) {
  const result = await query(
    `SELECT d.*, l.loan_number, l.emi_amount, l.tenure_months, l.interest_rate,
       u.email, u.phone, u.customer_code, p.first_name, p.last_name, p.address,
       lp.product_name, b.bank_name, b.account_number
     FROM disbursements d
     JOIN loans l ON l.id = d.loan_id
     JOIN users u ON u.id = d.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN loan_products lp ON lp.id = d.product_id
     JOIN bank_accounts b ON b.id = d.bank_account_id
     WHERE d.id = $1`, [disbursementId]);
  const d = result.rows[0];
  if (!d) throw new Error('Disbursement not found');

  const charges = await query('SELECT * FROM disbursement_charges WHERE disbursement_id = $1 ORDER BY charge_type', [disbursementId]);
  d.charges = charges.rows;

  const html = generateHtmlDisbursementStatement(d);

  return { html, disbursement: d, charges: charges.rows };
}