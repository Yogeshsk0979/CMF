import { query } from '../config/db.js';
import { logAudit } from './applicationService.js';

// ============================================================================
// Template Rendering
// ============================================================================

/**
 * Replace {key} placeholders in text with values from the variables object.
 * @param {string} text - Template text with {variable} placeholders
 * @param {object} variables - Key-value pairs for substitution
 * @returns {string} Rendered text
 */
export function renderTemplate(text, variables = {}) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

// ============================================================================
// Email
// ============================================================================

/**
 * Send an email, optionally resolving a template.
 * @param {object} data
 * @param {string} data.to - Recipient email address
 * @param {string} data.name - Recipient name
 * @param {string} data.template_code - Optional template code to look up
 * @param {string} data.template_id - Optional template UUID
 * @param {string} data.subject - Email subject (ignored if template used)
 * @param {string} data.body - Email body HTML (ignored if template used)
 * @param {string} data.status - 'pending' | 'sent' | 'failed'
 * @param {object} data.variables - Template variables for substitution
 * @param {number} data.user_id - User who triggered the send (for audit)
 * @param {string} data.email_number - Optional override for email number
 * @returns {object} The created email_logs record
 */
export async function sendEmail(data) {
  let subject = data.subject;
  let body = data.body;
  let templateId = data.template_id;
  let templateVars = data.variables || {};

  // Resolve template if template_code provided
  if (!templateId && data.template_code) {
    const templateResult = await query(
      'SELECT * FROM email_templates WHERE template_code = $1 AND is_active = true',
      [data.template_code]
    );
    if (templateResult.rows.length > 0) {
      const tmpl = templateResult.rows[0];
      templateId = tmpl.id;
      subject = tmpl.subject;
      body = tmpl.html_body || tmpl.text_body;
      // Merge template variables list for documentation
      if (tmpl.variables && tmpl.variables.length > 0) {
        templateVars = { ...templateVars };
      }
    }
  }

  // Apply variable substitution
  if (templateVars && Object.keys(templateVars).length > 0) {
    subject = renderTemplate(subject, templateVars);
    body = renderTemplate(body, templateVars);
  }

  const emailNumber = data.email_number || 'EML' + Date.now().toString().slice(-7);
  const status = data.status || 'pending';

  const result = await query(
    `INSERT INTO email_logs (email_number, recipient_email, recipient_name, template_id,
     subject, body_html, body_text, status, gateway_ref, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      emailNumber,
      data.to,
      data.name || null,
      templateId,
      subject,
      body,
      stripHtml(body),
      status,
      data.gateway_ref || null,
      status === 'sent' ? new Date() : null
    ]
  );

  const record = result.rows[0];

  // Log audit
  if (data.user_id) {
    await logAudit(data.user_id, 'email.sent', 'email', record.id, emailNumber);
  }

  return record;
}

// ============================================================================
// SMS
// ============================================================================

/**
 * Send an SMS, optionally resolving a template.
 * @param {object} data
 * @param {string} data.phone - Recipient phone number
 * @param {string} data.name - Recipient name
 * @param {string} data.template_code - Optional template code to look up
 * @param {string} data.template_id - Optional template UUID
 * @param {string} data.message - SMS message text (ignored if template used)
 * @param {string} data.status - 'pending' | 'sent' | 'delivered' | 'failed'
 * @param {object} data.variables - Template variables for substitution
 * @param {number} data.user_id - User who triggered the send (for audit)
 * @param {string} data.sms_number - Optional override for SMS number
 * @returns {object} The created sms_logs record
 */
export async function sendSms(data) {
  let message = data.message;
  let templateId = data.template_id;
  let templateVars = data.variables || {};

  // Resolve template if template_code provided
  if (!templateId && data.template_code) {
    const templateResult = await query(
      'SELECT * FROM sms_templates WHERE template_code = $1 AND is_active = true',
      [data.template_code]
    );
    if (templateResult.rows.length > 0) {
      const tmpl = templateResult.rows[0];
      templateId = tmpl.id;
      message = tmpl.template_text;
    }
  }

  // Apply variable substitution
  if (templateVars && Object.keys(templateVars).length > 0) {
    message = renderTemplate(message, templateVars);
  }

  const smsNumber = data.sms_number || 'SMS' + Date.now().toString().slice(-7);
  const status = data.status || 'pending';

  const result = await query(
    `INSERT INTO sms_logs (sms_number, recipient_phone, recipient_name, template_id,
     message_text, template_vars, status, gateway_ref, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      smsNumber,
      data.phone,
      data.name || null,
      templateId,
      message,
      JSON.stringify(templateVars),
      status,
      data.gateway_ref || null,
      status === 'sent' ? new Date() : null
    ]
  );

  const record = result.rows[0];

  // Log audit
  if (data.user_id) {
    await logAudit(data.user_id, 'sms.sent', 'sms', record.id, smsNumber);
  }

  return record;
}

// ============================================================================
// Bulk SMS
// ============================================================================

/**
 * Send SMS to multiple recipients using a template code.
 * @param {Array} recipients - Array of { phone, name?, variables? }
 * @param {string} templateCode - SMS template code
 * @param {object} globalVariables - Variables applied to all recipients
 * @param {number} userId - User triggering the send
 * @returns {object} { total, sent, failed, results }
 */
export async function sendBulkSms(recipients, templateCode, globalVariables = {}, userId) {
  const results = [];
  let sent = 0;
  let failed = 0;

  // Fetch template once
  const templateResult = await query(
    'SELECT * FROM sms_templates WHERE template_code = $1 AND is_active = true',
    [templateCode]
  );

  if (templateResult.rows.length === 0) {
    return { total: recipients.length, sent: 0, failed: recipients.length, results, error: 'Template not found' };
  }

  const tmpl = templateResult.rows[0];

  for (const recipient of recipients) {
    try {
      const mergedVars = { ...globalVariables, ...(recipient.variables || {}) };
      let message = renderTemplate(tmpl.template_text, mergedVars);

      const result = await sendSms({
        phone: recipient.phone,
        name: recipient.name,
        template_id: tmpl.id,
        message,
        variables: mergedVars,
        status: 'sent',
        user_id: userId
      });

      results.push(result);
      sent++;
    } catch (err) {
      results.push({ phone: recipient.phone, error: err.message });
      failed++;
    }
  }

  // Log audit for bulk send
  if (userId) {
    await logAudit(userId, 'sms.bulk_sent', 'sms', null, templateCode);
  }

  return { total: recipients.length, sent, failed, results };
}

// ============================================================================
// EMI Reminder
// ============================================================================

/**
 * Send EMI due reminder (3 days before due date) to a customer.
 * @param {object} emiSchedule - emi_schedules row
 * @returns {object} { sms, email }
 */
export async function sendEmiReminder(emiSchedule) {
  // Fetch loan, customer, and product details
  const loanResult = await query(
    `SELECT l.*, lp.product_name, lp.category,
            u.email, u.phone,
            p.first_name, p.last_name
     FROM emi_schedules es
     JOIN loans l ON l.id = es.loan_id
     JOIN loan_products lp ON lp.id = l.product_id
     JOIN users u ON u.id = l.customer_id
     LEFT JOIN user_profiles p ON p.user_id = l.customer_id
     WHERE es.id = $1`,
    [emiSchedule.id]
  );

  if (loanResult.rows.length === 0) {
    throw new Error('EMI schedule not found or related data missing');
  }

  const loan = loanResult.rows[0];
  const customerName = [loan.first_name, loan.last_name].filter(Boolean).join(' ') || 'Valued Customer';
  const emiNumber = emiSchedule.emi_number;
  const emiAmount = parseFloat(emiSchedule.emi_amount);
  const dueDate = new Date(emiSchedule.due_date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const outstanding = parseFloat(loan.outstanding_principal || 0);

  const variables = {
    name: customerName,
    emi_number: emiNumber,
    amount: emiAmount.toFixed(2),
    due_date: dueDate,
    loan_number: loan.loan_number,
    product_name: loan.product_name,
    outstanding: outstanding.toFixed(2),
    branch_name: loan.branch_name || 'CMF'
  };

  // Choose template based on overdue status
  const templateCode = emiSchedule.is_overdue ? 'EMI_OVERDUE' : 'EMI_DUE';

  // Send SMS
  const sms = await sendSms({
    phone: loan.phone,
    name: customerName,
    template_code: templateCode,
    variables,
    status: 'sent'
  });

  // Send Email
  const email = await sendEmail({
    to: loan.email,
    name: customerName,
    template_code: templateCode,
    variables,
    status: 'sent'
  });

  return { sms, email };
}

// ============================================================================
// EMI Overdue Alert (notifies customer, team leader, and collection agent)
// ============================================================================

/**
 * Send EMI overdue alert to customer plus notify team leader and collection agent.
 * @param {object} emiSchedule - emi_schedules row
 * @param {number} daysOverdue - Number of days overdue
 * @returns {object} { customer: { sms, email }, teamLeader: { sms, email }, agent: { sms, email } }
 */
export async function sendEmiOverdueAlert(emiSchedule, daysOverdue) {
  const loanResult = await query(
    `SELECT l.*, lp.product_name,
            u.email, u.phone, u.branch_id,
            p.first_name, p.last_name
     FROM emi_schedules es
     JOIN loans l ON l.id = es.loan_id
     JOIN loan_products lp ON lp.id = l.product_id
     JOIN users u ON u.id = l.customer_id
     LEFT JOIN user_profiles p ON p.user_id = l.customer_id
     WHERE es.id = $1`,
    [emiSchedule.id]
  );

  if (loanResult.rows.length === 0) {
    throw new Error('EMI schedule not found');
  }

  const loan = loanResult.rows[0];
  const customerName = [loan.first_name, loan.last_name].filter(Boolean).join(' ') || 'Customer';

  const variables = {
    name: customerName,
    emi_number: emiSchedule.emi_number,
    amount: parseFloat(emiSchedule.emi_amount).toFixed(2),
    days_overdue: daysOverdue,
    loan_number: loan.loan_number,
    due_date: new Date(emiSchedule.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    penalty: parseFloat(emiSchedule.penalty_applied || 0).toFixed(2),
    total_due: parseFloat(emiSchedule.emi_amount + (emiSchedule.penalty_applied || 0)).toFixed(2)
  };

  const result = {};

  // 1. Notify customer
  result.customer = {
    sms: await sendSms({
      phone: loan.phone,
      name: customerName,
      template_code: 'EMI_OVERDUE',
      variables,
      status: 'sent'
    }),
    email: await sendEmail({
      to: loan.email,
      name: customerName,
      template_code: 'EMI_OVERDUE',
      variables,
      status: 'sent'
    })
  };

  // 2. Find team leader for this branch
  const tlResult = await query(
    `SELECT u.email, u.phone, p.first_name, p.last_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.branch_id = $1 AND u.role = 'team_leader' AND u.is_active = true
     LIMIT 1`,
    [loan.branch_id]
  );

  if (tlResult.rows.length > 0) {
    const tl = tlResult.rows[0];
    const tlName = [tl.first_name, tl.last_name].filter(Boolean).join(' ') || 'Team Leader';
    result.teamLeader = {
      sms: await sendSms({
        phone: tl.phone,
        name: tlName,
        message: `Dear ${tlName}, EMI overdue alert: ${customerName} (Loan ${loan.loan_number}) is ${daysOverdue} days overdue. Amount: Rs.${variables.amount}.`,
        status: 'sent'
      }),
      email: await sendEmail({
        to: tl.email,
        name: tlName,
        subject: `Overdue EMI Alert - ${customerName} | Loan ${loan.loan_number}`,
        body: `<p>Dear ${tlName},</p>
               <p>EMI overdue alert for your branch:</p>
               <ul>
                 <li><strong>Customer:</strong> ${customerName}</li>
                 <li><strong>Loan:</strong> ${loan.loan_number}</li>
                 <li><strong>EMI #:</strong> ${emiSchedule.emi_number}</li>
                 <li><strong>Due Date:</strong> ${variables.due_date}</li>
                 <li><strong>Days Overdue:</strong> ${daysOverdue}</li>
                 <li><strong>Amount:</strong> Rs.${variables.amount}</li>
               </ul>
               <p>Please follow up with the customer and collection agent.</p>`,
        status: 'sent'
      })
    };
  }

  // 3. Find collection agent for this branch
  const agentResult = await query(
    `SELECT u.email, u.phone, p.first_name, p.last_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.branch_id = $1 AND u.role = 'collection_agent' AND u.is_active = true
     LIMIT 3`,
    [loan.branch_id]
  );

  result.agents = [];
  for (const agent of agentResult.rows) {
    const agentName = [agent.first_name, agent.last_name].filter(Boolean).join(' ') || 'Collection Agent';
    result.agents.push({
      sms: await sendSms({
        phone: agent.phone,
        name: agentName,
        message: `Dear ${agentName}, follow up: ${customerName} (Loan ${loan.loan_number}) EMI #${emiSchedule.emi_number} is ${daysOverdue} days overdue. Rs.${variables.amount}.`,
        status: 'sent'
      })
    });
  }

  return result;
}

// ============================================================================
// Disbursement Notification
// ============================================================================

/**
 * Send disbursement notification to customer via SMS and Email.
 * @param {object} disbursement - disbursements row
 * @param {number} [userId] - User who triggered
 * @returns {object} { sms, email }
 */
export async function sendDisbursementNotification(disbursement, userId) {
  // Fetch full disbursement details
  const disbResult = await query(
    `SELECT d.*, l.loan_number, l.tenure_months, l.emi_amount,
            lp.product_name,
            u.email, u.phone,
            p.first_name, p.last_name,
            b.bank_name, ba.account_number
     FROM disbursements d
     JOIN loans l ON l.id = d.loan_id
     JOIN loan_products lp ON lp.id = d.product_id
     JOIN users u ON u.id = d.customer_id
     LEFT JOIN user_profiles p ON p.user_id = d.customer_id
     JOIN branches b ON b.id = d.branch_id
     JOIN bank_accounts ba ON ba.id = d.bank_account_id
     WHERE d.id = $1`,
    [disbursement.id]
  );

  if (disbResult.rows.length === 0) {
    throw new Error('Disbursement not found');
  }

  const disb = disbResult.rows[0];
  const customerName = [disb.first_name, disb.last_name].filter(Boolean).join(' ') || 'Valued Customer';

  const variables = {
    name: customerName,
    loan_number: disb.loan_number,
    loan_amount: parseFloat(disb.loan_amount).toFixed(2),
    net_amount: parseFloat(disb.net_disbursement_amount).toFixed(2),
    emi: parseFloat(disb.emi_amount).toFixed(2),
    tenure: disb.tenure_months,
    product_name: disb.product_name,
    disbursement_date: new Date(disb.disbursement_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    utr_number: disb.utr_number || 'N/A',
    account_last4: (disb.account_number || '').slice(-4)
  };

  // Send SMS
  const sms = await sendSms({
    phone: disb.phone,
    name: customerName,
    template_code: 'DISBURSED',
    variables,
    status: 'sent',
    user_id: userId
  });

  // Send Email
  const email = await sendEmail({
    to: disb.email,
    name: customerName,
    template_code: 'DISBURSED',
    variables,
    status: 'sent',
    user_id: userId
  });

  // Update disbursement to mark notifications sent
  await query(
    `UPDATE disbursements SET sms_sent = true, email_sent = true WHERE id = $1`,
    [disbursement.id]
  );

  return { sms, email };
}

// ============================================================================
// Payment Receipt Notification
// ============================================================================

/**
 * Send payment receipt to customer after EMI payment.
 * @param {object} payment - emi_payments row
 * @param {number} [userId] - User who triggered
 * @returns {object} { sms, email }
 */
export async function sendPaymentReceipt(payment, userId) {
  // Fetch payment, loan, and customer details
  const paymentResult = await query(
    `SELECT ep.*, l.loan_number, l.tenure_months, l.emi_amount,
            lp.product_name,
            u.email, u.phone,
            p.first_name, p.last_name
     FROM emi_payments ep
     JOIN loans l ON l.id = ep.loan_id
     JOIN loan_products lp ON lp.id = l.product_id
     JOIN users u ON u.id = ep.customer_id
     LEFT JOIN user_profiles p ON p.user_id = ep.customer_id
     WHERE ep.id = $1`,
    [payment.id]
  );

  if (paymentResult.rows.length === 0) {
    throw new Error('Payment not found');
  }

  const pay = paymentResult.rows[0];
  const customerName = [pay.first_name, pay.last_name].filter(Boolean).join(' ') || 'Valued Customer';
  const paymentDate = new Date(pay.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const variables = {
    name: customerName,
    payment_number: pay.payment_number,
    loan_number: pay.loan_number,
    emi_number: '', // Will be filled from emi_schedule if available
    amount: parseFloat(pay.payment_amount).toFixed(2),
    principal: parseFloat(pay.principal_component).toFixed(2),
    interest: parseFloat(pay.interest_component).toFixed(2),
    penalty: parseFloat(pay.penalty_component || 0).toFixed(2),
    payment_date: paymentDate,
    payment_mode: pay.payment_method || 'cash',
    transaction_ref: pay.transaction_ref || 'N/A',
    outstanding: parseFloat(pay.loan_amount || 0).toFixed(2)
  };

  // Get EMI number from schedule if available
  if (pay.emi_schedule_id) {
    const schedResult = await query(
      'SELECT emi_number FROM emi_schedules WHERE id = $1',
      [pay.emi_schedule_id]
    );
    if (schedResult.rows.length > 0) {
      variables.emi_number = schedResult.rows[0].emi_number;
    }
  }

  const templateCode = variables.penalty && parseFloat(variables.penalty) > 0
    ? 'PAYMENT_RECEIPT' : 'EMI_RECEIPT';

  // Send SMS
  const sms = await sendSms({
    phone: pay.phone,
    name: customerName,
    template_code: templateCode,
    variables,
    status: 'sent',
    user_id: userId
  });

  // Send Email
  const email = await sendEmail({
    to: pay.email,
    name: customerName,
    template_code: templateCode,
    variables,
    status: 'sent',
    user_id: userId
  });

  // Update payment_receipts to mark notifications sent
  await query(
    `UPDATE payment_receipts SET is_sms_sent = true, is_emailed = true
     WHERE emi_payment_id = $1`,
    [payment.id]
  );

  return { sms, email };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Strip HTML tags from text for plain text body.
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Get email logs with optional filters.
 */
export async function getEmailLogs(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;
  if (filters.status) { where += ` AND status = $${idx++}`; params.push(filters.status); }
  if (filters.email) { where += ` AND recipient_email = $${idx++}`; params.push(filters.email); }
  if (filters.date_from) { where += ` AND sent_at >= $${idx++}`; params.push(filters.date_from); }
  if (filters.date_to) { where += ` AND sent_at <= $${idx++}`; params.push(filters.date_to); }
  const result = await query(`SELECT * FROM email_logs ${where} ORDER BY sent_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...params, filters.limit || 50, filters.offset || 0]);
  return result.rows;
}

/**
 * Get SMS logs with optional filters.
 */
export async function getSmsLogs(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;
  if (filters.status) { where += ` AND status = $${idx++}`; params.push(filters.status); }
  if (filters.phone) { where += ` AND recipient_phone = $${idx++}`; params.push(filters.phone); }
  if (filters.date_from) { where += ` AND sent_at >= $${idx++}`; params.push(filters.date_from); }
  if (filters.date_to) { where += ` AND sent_at <= $${idx++}`; params.push(filters.date_to); }
  const result = await query(`SELECT * FROM sms_logs ${where} ORDER BY sent_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...params, filters.limit || 50, filters.offset || 0]);
  return result.rows;
}

/**
 * Get email templates.
 */
export async function getEmailTemplates() {
  const result = await query('SELECT * FROM email_templates WHERE is_active = true ORDER BY template_name');
  return result.rows;
}

/**
 * Get SMS templates.
 */
export async function getSmsTemplates() {
  const result = await query('SELECT * FROM sms_templates WHERE is_active = true ORDER BY template_name');
  return result.rows;
}

/**
 * Send overdue notifications for all overdue EMIs.
 */
export async function sendOverdueNotifications() {
  const overdueResult = await query(
    `SELECT DISTINCT l.branch_id, b.branch_name
     FROM emi_schedules e
     JOIN loans l ON l.id = e.loan_id
     JOIN branches b ON b.id = l.branch_id
     WHERE e.is_paid = false AND e.due_date < CURRENT_DATE`);
  let notified = 0;
  for (const row of overdueResult.rows) {
    const users = await query(`SELECT u.id, u.email, u.phone, p.first_name, p.last_name FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.branch_id = $1 AND u.role IN ('team_leader', 'branch_admin') AND u.is_active = true`, [row.branch_id]);
    for (const user of users.rows) {
      try {
        if (user.email) {
          await sendEmail({ to: user.email, name: `${user.first_name} ${user.last_name}`, subject: `Overdue EMIs - ${row.branch_name}`, body: `There are overdue EMIs in ${row.branch_name} branch. Please check the dashboard for details.` });
          notified++;
        }
      } catch (e) { console.warn('Notify failed:', e.message); }
    }
  }
  return { notified };
}
