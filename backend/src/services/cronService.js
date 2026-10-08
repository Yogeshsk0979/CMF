import { query, withTransaction } from '../config/db.js';
import { applyLatePenalties, updateEmiOverdueStatus } from './emiService.js';
import { sendSms, sendEmail } from './communicationService.js';
import { logAudit } from './applicationService.js';

let isSchedulerActive = false;
const JOBS_RUN = [];

export async function runEmiReminders() {
  const jobName = 'emi-reminders';
  try {
    const result = await query(
      `SELECT e.*, l.loan_number, l.customer_id, u.email, u.phone, u.role,
        p.first_name, p.last_name
       FROM emi_schedules e
       JOIN loans l ON l.id = e.loan_id
       JOIN users u ON u.id = l.customer_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE e.is_paid = false AND e.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'`);
    const emis = result.rows;
    let sentCount = 0;
    for (const emi of emis) {
      try {
        const variables = {
          customer_name: `${emi.first_name} ${emi.last_name}`,
          loan_number: emi.loan_number,
          emi_amount: formatCurrency(emi.emi_amount),
          due_date: formatDate(emi.due_date),
        };
        if (emi.role === 'customer' && emi.phone) {
          await sendSms({
            phone: emi.phone,
            name: `${emi.first_name} ${emi.last_name}`,
            template_code: 'EMI_DUE_REMINDER',
            variables,
            user_id: null,
          });
          sentCount++;
        }
        if (emi.email) {
          await sendEmail({
            to: emi.email,
            name: `${emi.first_name} ${emi.last_name}`,
            template_code: 'EMI_DUE_REMINDER',
            variables,
            user_id: null,
          });
        }
      } catch (e) {
        console.warn('EMI reminder failed for', emi.id, e.message);
      }
    }
    JOBS_RUN.push({ name: jobName, count: sentCount, time: new Date().toISOString() });
    return { sent: sentCount, total: emis.length };
  } catch (e) {
    JOBS_RUN.push({ name: jobName, error: e.message, time: new Date().toISOString() });
    return { error: e.message };
  }
}

export async function runOverdueDetection() {
  const jobName = 'overdue-detection';
  try {
    const overdueUpdate = await updateEmiOverdueStatus();

    const penaltyResult = await applyLatePenalties();

    // Notify team leaders and collection agents
    const overdueResult = await query(
      `SELECT DISTINCT l.branch_id, b.branch_name
       FROM emi_schedules e
       JOIN loans l ON l.id = e.loan_id
       JOIN branches b ON b.id = l.branch_id
       WHERE e.is_paid = false AND e.is_overdue = true`);

    const branchesWithOverdue = overdueResult.rows;
    let notifyCount = 0;
    for (const branch of branchesWithOverdue) {
      const users = await query(
        `SELECT u.id, u.email, u.phone, u.role, p.first_name, p.last_name
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.branch_id = $1 AND u.role IN ('team_leader', 'collection_agent', 'branch_admin') AND u.is_active = true`,
        [branch.branch_id]);
      for (const user of users.rows) {
        try {
          if (user.email) {
            await sendEmail({
              to: user.email,
              name: `${user.first_name} ${user.last_name}`,
              subject: `Overdue EMIs - ${branch.branch_name}`,
              body: `There are overdue EMIs in ${branch.branch_name} branch requiring follow-up. Please check the dashboard.`,
              user_id: null,
            });
            notifyCount++;
          }
        } catch (e) {
          console.warn('Overdue notify failed:', e.message);
        }
      }
    }

    // Auto-classify NPA for 90+ days
    const npa90 = await query(
      `INSERT INTO npa_classifications (npa_number, loan_id, customer_id, classification_date, overdue_days, overdue_amount, npa_category, is_active)
       SELECT 'NPA' || LPAD(nextval('npa_seq')::text, 7, '0'),
         l.id, l.customer_id, CURRENT_DATE,
         MAX(e.days_overdue), COALESCE(SUM(e.emi_amount), 0),
         'substandard', true
       FROM emi_schedules e
       JOIN loans l ON l.id = e.loan_id
       WHERE e.is_paid = false AND e.days_overdue >= 90
       GROUP BY l.id, l.customer_id
       ON CONFLICT (loan_id) DO UPDATE SET overdue_days = EXCLUDED.overdue_days, overdue_amount = EXCLUDED.overdue_amount`
    ).catch(e => ({ error: e.message }));

    JOBS_RUN.push({ name: jobName, overdue: overdueUpdate, penalties: penaltyResult, notifications: notifyCount, time: new Date().toISOString() });
    return { overdue: overdueUpdate, penalties: penaltyResult, notifications: notifyCount };
  } catch (e) {
    JOBS_RUN.push({ name: jobName, error: e.message, time: new Date().toISOString() });
    return { error: e.message };
  }
}

export async function runDailyCollectionReport() {
  const jobName = 'daily-collection-report';
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(
      `SELECT
         COUNT(*) as payment_count,
         COALESCE(SUM(payment_amount), 0) as total_collected,
         COUNT(DISTINCT customer_id) as unique_customers,
         COUNT(DISTINCT loan_id) as unique_loans
       FROM emi_payments WHERE payment_date = $1`, [today]);

    const stats = result.rows[0];
    JOBS_RUN.push({ name: jobName, stats, time: new Date().toISOString() });
    return stats;
  } catch (e) {
    JOBS_RUN.push({ name: jobName, error: e.message, time: new Date().toISOString() });
    return { error: e.message };
  }
}

export async function runAll() {
  if (isSchedulerActive) return { skipped: true };
  isSchedulerActive = true;
  try {
    const overdueResult = await runOverdueDetection();
    const reminderResult = await runEmiReminders();
    const dailyResult = await runDailyCollectionReport();
    return { overdue: overdueResult, reminders: reminderResult, daily: dailyResult };
  } finally {
    isSchedulerActive = false;
  }
}

export function getJobHistory() {
  return JOBS_RUN.slice(-50);
}

export function startScheduler() {
  // Run every hour at minute 7
  setInterval(async () => {
    const now = new Date();
    if (now.getMinutes() === 7) {
      console.log('[Scheduler] Running hourly cron jobs');
      await runAll().catch(e => console.error('Cron error:', e));
    }
  }, 60 * 1000);

  // Run once on startup
  setTimeout(() => {
    console.log('[Scheduler] Initial run');
    runAll().catch(e => console.error('Initial cron error:', e));
  }, 30 * 1000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}