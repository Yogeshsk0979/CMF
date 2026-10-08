import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { recordEmiPayment, getOverdues, getCustomerEmis, getCustomerDues, createPenalty, updateEmiOverdueStatus } from '../services/emiService.js';

const router = express.Router();

router.post('/pay',
  authenticate, authorize('field_officer', 'collection_agent', 'team_leader', 'branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const result = await recordEmiPayment({
      ...req.body,
      received_by: req.user.id
    });
    res.status(201).json(result);
  })
);

router.get('/customer/:customerId',
  authenticate,
  asyncHandler(async (req, res) => {
    const emis = await getCustomerEmis(req.params.customerId);
    res.json(emis);
  })
);

router.get('/customer/:customerId/dues',
  authenticate,
  asyncHandler(async (req, res) => {
    const dues = await getCustomerDues(req.params.customerId);
    res.json(dues);
  })
);

router.get('/overdues',
  authenticate, authorize('collection_agent', 'field_officer', 'team_leader', 'branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const overdues = await getOverdues();
    res.json(overdues);
  })
);

router.post('/penalties',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const penalty = await createPenalty(req.body);
    res.status(201).json(penalty);
  })
);

router.post('/update-overdue',
  authenticate, authorize('super_admin'),
  asyncHandler(async (req, res) => {
    const result = await updateEmiOverdueStatus();
    res.json(result);
  })
);

export default router;