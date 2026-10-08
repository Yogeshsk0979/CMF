import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { sendEmail, sendSms, getEmailTemplates, getSmsTemplates, getEmailLogs, getSmsLogs, sendEmiReminder, sendEmiOverdueAlert, sendDisbursementNotification, sendPaymentReceipt, renderTemplate, sendOverdueNotifications, sendBulkSms } from '../services/communicationService.js';

const router = express.Router();

router.get('/email-templates', authenticate, asyncHandler(async (req, res) => {
  res.json(await getEmailTemplates());
}));

router.get('/sms-templates', authenticate, asyncHandler(async (req, res) => {
  res.json(await getSmsTemplates());
}));

router.get('/email-logs', authenticate, asyncHandler(async (req, res) => {
  res.json(await getEmailLogs(req.query));
}));

router.get('/sms-logs', authenticate, asyncHandler(async (req, res) => {
  res.json(await getSmsLogs(req.query));
}));

router.post('/send-email', authenticate, authorize('super_admin', 'branch_admin'), asyncHandler(async (req, res) => {
  const result = await sendEmail({ ...req.body, user_id: req.user.id });
  res.status(201).json(result);
}));

router.post('/send-sms', authenticate, authorize('super_admin', 'branch_admin'), asyncHandler(async (req, res) => {
  const result = await sendSms({ ...req.body, user_id: req.user.id });
  res.status(201).json(result);
}));

router.post('/send-bulk-sms', authenticate, authorize('super_admin', 'branch_admin'), asyncHandler(async (req, res) => {
  const { recipients, templateCode, variables } = req.body;
  const result = await sendBulkSms(recipients, templateCode, variables || {}, req.user.id);
  res.json(result);
}));

router.post('/overdue-notifications', authenticate, authorize('branch_admin', 'super_admin'), asyncHandler(async (req, res) => {
  const result = await sendOverdueNotifications();
  res.json(result);
}));

router.post('/render-template', authenticate, asyncHandler(async (req, res) => {
  res.json({ rendered: renderTemplate(req.body.template, req.body.variables || {}) });
}));

export default router;
