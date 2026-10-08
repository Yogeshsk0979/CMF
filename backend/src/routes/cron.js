import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { runAll, runOverdueDetection, runEmiReminders, runDailyCollectionReport, getJobHistory } from '../services/cronService.js';

const router = express.Router();

// Trigger cron jobs (admin only)
router.post('/run-all', authenticate, asyncHandler(async (req, res) => {
  const result = await runAll();
  res.json(result);
}));

router.post('/overdue-detection', authenticate, asyncHandler(async (req, res) => {
  const result = await runOverdueDetection();
  res.json(result);
}));

router.post('/emi-reminders', authenticate, asyncHandler(async (req, res) => {
  const result = await runEmiReminders();
  res.json(result);
}));

router.post('/daily-report', authenticate, asyncHandler(async (req, res) => {
  const result = await runDailyCollectionReport();
  res.json(result);
}));

router.get('/history', authenticate, asyncHandler(async (req, res) => {
  res.json(getJobHistory());
}));

export default router;
