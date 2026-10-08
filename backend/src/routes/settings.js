import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getLoanProducts, createLoanProduct, updateLoanProduct,
  getBranches, getGeneralSettings, updateGeneralSettings,
  getSmsTemplates, getEmailTemplates, getApprovalLimitsAll
} from '../services/commonService.js';

const router = express.Router();

router.use(authenticate);

// Branches
router.get('/branches', async (req, res) => {
  try {
    const data = await getBranches();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// General Settings
router.get('/general', authorize('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const data = await getGeneralSettings();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/general', authorize('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const data = await updateGeneralSettings(req.body);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SMS Templates
router.get('/sms-templates', authorize('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const data = await getSmsTemplates();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Email Templates
router.get('/email-templates', authorize('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const data = await getEmailTemplates();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Approval Limits
router.get('/approval-limits', authorize('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const data = await getApprovalLimitsAll();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Loan Products
router.get('/products', async (req, res) => {
  try {
    const data = await getLoanProducts(req.query);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products', authorize('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const data = await createLoanProduct(req.body);
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id', authorize('super_admin', 'branch_admin'), async (req, res) => {
  try {
    const data = await updateLoanProduct(req.params.id, req.body);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
