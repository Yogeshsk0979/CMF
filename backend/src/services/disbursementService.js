import { query, withTransaction } from '../config/db.js';
import { logAudit } from './applicationService.js';
import { postDisbursement } from './ledgerService.js';
import { createLoan, generateLoanFromDisbursement } from './loanService.js';

export async function createDisbursement(data) {
  return withTransaction(async (client) => {
    // 1. Fetch loan data
    const applicantRes = await client.query(
      `SELECT a.id as application_id, a.loan_amount, a.branch_id, a.customer_id, a.product_id,
              a.tenure_months, a.interest_rate, a.approved_amount,
              l.id as loan_id, l.loan_number
       FROM applications a
       LEFT JOIN loans l ON l.application_id = a.id
       WHERE a.id = $1`,
      [data.application_id]
    );
    if (!applicantRes.rows[0]) throw new Error('Application not found');
    const appData = applicantRes.rows[0];
    const loanAmount = parseFloat(data.loan_amount || appData.approved_amount || appData.loan_amount);

    // 2. Calculate charges
    const charges = await calculateCharges(loanAmount, appData.product_id, client);

    const processingFee = charges.find(c => c.charge_type === 'processing_fee')?.charge_amount || 0;
    const documentCharge = charges.find(c => c.charge_type === 'document_charge')?.charge_amount || 0;
    const insuranceAmount = charges.find(c => c.charge_type === 'insurance')?.charge_amount || 0;
    const totalCharges = processingFee + documentCharge + insuranceAmount;
    const netDisbursementAmount = loanAmount - totalCharges;

    // 3. Generate disbursement number
    const disbursementNumber = 'DSB' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 100);

    // 4. Insert disbursement
    const disbursementResult = await client.query(
      `INSERT INTO disbursements (disbursement_number, loan_id, application_id, customer_id, product_id, branch_id, bank_account_id,
       loan_amount, processing_fee, document_charge, insurance_amount, total_charges, net_disbursement_amount,
       disbursement_mode, utr_number, disbursement_date, approved_by, processed_by, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
      [disbursementNumber, appData.loan_id || null, data.application_id, appData.customer_id, appData.product_id,
       appData.branch_id, data.bank_account_id, loanAmount, processingFee, documentCharge, insuranceAmount,
       totalCharges, netDisbursementAmount, data.disbursement_mode || 'bank_transfer',
       data.utr_number || null, data.disbursement_date, data.approved_by || null,
       data.processed_by || null, 'completed', data.notes || null]
    );
    const disbursement = disbursementResult.rows[0];

    // 5. Insert disbursement charges
    for (let i = 0; i < charges.length; i++) {
      const charge = charges[i];
      const chargeNumber = 'CHG' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 100) + i;
      await client.query(
        `INSERT INTO disbursement_charges (charge_number, disbursement_id, charge_type, charge_head,
         calculation_type, base_amount, rate_pct, flat_amount, charge_amount, slab_id, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [chargeNumber, disbursement.id, charge.charge_type, charge.charge_head,
         charge.calculation_type, charge.base_amount, charge.rate_pct, charge.flat_amount,
         charge.charge_amount, charge.slab_id || null, charge.total_amount]
      );
    }

    // 6. Create loan if not exists
    let loan;
    if (!appData.loan_id) {
      loan = await generateLoanFromDisbursement(client, {
        application_id: data.application_id,
        customer_id: appData.customer_id,
        product_id: appData.product_id,
        branch_id: appData.branch_id,
        loan_amount: loanAmount,
        approved_amount: loanAmount,
        tenure_months: appData.tenure_months,
        interest_rate: appData.interest_rate,
        total_charges: totalCharges,
        net_disbursement_amount: netDisbursementAmount,
        disbursement_id: disbursement.id,
        created_by: data.processed_by,
        first_emi_date: data.first_emi_date,
      });
      await client.query('UPDATE disbursements SET loan_id = $1 WHERE id = $2', [loan.id, disbursement.id]);
      disbursement.loan_id = loan.id;
    }

    // 7. Post to ledger
    await postDisbursement(client, disbursement);

    // 8. Update application status
    await client.query(
      `UPDATE applications SET status = 'disbursed' WHERE id = $1`,
      [data.application_id]
    );

    // 9. Audit log
    await logAudit(data.processed_by, 'disbursement.created', 'disbursement', disbursement.id, disbursementNumber);

    return { ...disbursement, loan_number: loan?.loan_number };
  });
}

export async function calculateCharges(loanAmount, productId, client = null) {
  const q = client ? client.query : query;
  const productResult = await q(
    'SELECT processing_fee_type, processing_fee_value, document_charge_type, document_charge_value, insurance_type, insurance_value, processing_fee_min, processing_fee_max FROM loan_products WHERE id = $1',
    [productId]
  );
  const product = productResult.rows[0];
  if (!product) return { charges: [], totalCharges: 0, netAmount: loanAmount };

  const charges = [];
  let totalCharges = 0;

  // Processing fee
  let processingFee = 0;
  if (product.processing_fee_type === 'percentage') {
    processingFee = Math.round(loanAmount * (parseFloat(product.processing_fee_value) / 100) * 100) / 100;
    const min = parseFloat(product.processing_fee_min) || 0;
    const max = parseFloat(product.processing_fee_max) || 0;
    if (min > 0 && processingFee < min) processingFee = min;
    if (max > 0 && processingFee > max) processingFee = max;
  } else {
    processingFee = parseFloat(product.processing_fee_value) || 0;
  }
  if (processingFee > 0) {
    charges.push({
      charge_type: 'processing_fee',
      charge_head: 'Processing Fee',
      calculation_type: product.processing_fee_type,
      base_amount: loanAmount,
      rate_pct: product.processing_fee_type === 'percentage' ? product.processing_fee_value : null,
      flat_amount: product.processing_fee_type === 'flat' ? product.processing_fee_value : null,
      charge_amount: processingFee,
      total_amount: processingFee,
    });
    totalCharges += processingFee;
  }

  // Document charge
  let docCharge = 0;
  if (product.document_charge_type === 'flat') {
    docCharge = parseFloat(product.document_charge_value) || 0;
  } else if (product.document_charge_type === 'percentage') {
    docCharge = Math.round(loanAmount * (parseFloat(product.document_charge_value) / 100) * 100) / 100;
  }
  if (docCharge > 0) {
    charges.push({
      charge_type: 'document_charge',
      charge_head: 'Document Charge',
      calculation_type: product.document_charge_type,
      base_amount: loanAmount,
      rate_pct: product.document_charge_type === 'percentage' ? product.document_charge_value : null,
      flat_amount: product.document_charge_type === 'flat' ? product.document_charge_value : null,
      charge_amount: docCharge,
      total_amount: docCharge,
    });
    totalCharges += docCharge;
  }

  // Insurance
  let insurance = 0;
  if (product.insurance_type === 'percentage') {
    insurance = Math.round(loanAmount * (parseFloat(product.insurance_value) / 100) * 100) / 100;
  } else if (product.insurance_type === 'flat') {
    insurance = parseFloat(product.insurance_value) || 0;
  }
  if (insurance > 0) {
    charges.push({
      charge_type: 'insurance',
      charge_head: 'Insurance',
      calculation_type: product.insurance_type,
      base_amount: loanAmount,
      rate_pct: product.insurance_type === 'percentage' ? product.insurance_value : null,
      flat_amount: product.insurance_type === 'flat' ? product.insurance_value : null,
      charge_amount: insurance,
      total_amount: insurance,
    });
    totalCharges += insurance;
  }

  return { charges, totalCharges, netAmount: loanAmount - totalCharges };
}

export async function getDisbursements(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.loan_id) { where += ` AND d.loan_id = $${idx++}`; params.push(filters.loan_id); }
  if (filters.status) { where += ` AND d.status = $${idx++}`; params.push(filters.status); }
  if (filters.branch_id) { where += ` AND d.branch_id = $${idx++}`; params.push(filters.branch_id); }
  if (filters.customer_id) { where += ` AND d.customer_id = $${idx++}`; params.push(filters.customer_id); }

  const result = await query(
    `SELECT d.*, l.loan_number, u.email, u.customer_code, u.phone, ba.account_number, ba.bank_name,
       p.first_name, p.last_name, lp.product_name
     FROM disbursements d
     LEFT JOIN loans l ON l.id = d.loan_id
     JOIN users u ON u.id = d.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN loan_products lp ON lp.id = d.product_id
     JOIN bank_accounts ba ON ba.id = d.bank_account_id
     ${where}
     ORDER BY d.disbursement_date DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit || 50, filters.offset || 0]
  );

  const countResult = await query(`SELECT COUNT(*) FROM disbursements d ${where}`, params);
  return { disbursements: result.rows, total: parseInt(countResult.rows[0].count) };
}

export async function getDisbursement(id) {
  const disbursement = await query(
    `SELECT d.*, l.loan_number, u.email, u.customer_code, u.phone,
       p.first_name, p.last_name, lp.product_name, ba.bank_name, ba.account_number
     FROM disbursements d
     LEFT JOIN loans l ON l.id = d.loan_id
     JOIN users u ON u.id = d.customer_id
     LEFT JOIN user_profiles p ON p.user_id = u.id
     JOIN loan_products lp ON lp.id = d.product_id
     JOIN bank_accounts ba ON ba.id = d.bank_account_id
     WHERE d.id = $1`, [id]);
  const chargeRows = await query('SELECT * FROM disbursement_charges WHERE disbursement_id = $1 ORDER BY charge_type', [id]);
  return { ...disbursement.rows[0], charges: chargeRows.rows };
}

export async function calculateEmi(principal, rate, months) {
  const monthlyRate = rate / 100 / 12;
  let emi;
  if (monthlyRate === 0) {
    emi = principal / months;
  } else {
    emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  }
  const emiRounded = Math.round(emi * 100) / 100;
  const totalPayable = Math.round(emiRounded * months * 100) / 100;
  const totalInterest = Math.round((totalPayable - principal) * 100) / 100;
  return { emi: emiRounded, totalPayable, totalInterest, monthlyRate };
}

export async function checkEligibility(data) {
  const result = await query(
    `SELECT * FROM loan_products WHERE id = $1 AND is_active = true`, [data.product_id]);
  const product = result.rows[0];
  if (!product) throw new Error('Product not found');

  const checks = {
    loan_amount: data.loan_amount >= product.min_loan_amount && data.loan_amount <= product.max_loan_amount,
    tenure: data.tenure_months >= product.min_tenure_months && data.tenure_months <= product.max_tenure_months,
    income_sufficient: data.monthly_income * data.tenure_months >= data.loan_amount * 1.5,
    dti_ratio: (data.existing_emis || 0) / data.monthly_income < 0.4,
    cibil_score: data.cibil_score >= 600,
    age_valid: data.age >= 21 && data.age <= 65,
  };

  const passed = Object.values(checks).filter(v => v).length;
  const total = Object.keys(checks).length;
  const score = Math.round((passed / total) * 100);

  return { checks, score, isEligible: score >= 70, eligibleAmount: Math.min(data.loan_amount, data.monthly_income * 24) };
}