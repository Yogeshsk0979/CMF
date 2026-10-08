import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { createDisbursement, getDisbursements, calculateCharges, calculateEmi, checkEligibility } from '../services/disbursementService.js';

const router = express.Router();

router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const filters = {
      loan_id: req.query.loan_id,
      status: req.query.status,
      branch_id: req.query.branch_id,
      customer_id: req.query.customer_id,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const result = await getDisbursements(filters);
    res.json(result);
  })
);

router.post('/',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const disb = await createDisbursement(req.body);
    res.status(201).json(disb);
  })
);

router.post('/calculate-charges',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await calculateCharges(req.body.loan_amount, req.body.product_id);
    res.json(result);
  })
);

router.post('/calculate-emi',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await calculateEmi(req.body.principal, req.body.rate, req.body.months);
    res.json(result);
  })
);

router.post('/check-eligibility',
  asyncHandler(async (req, res) => {
    const result = await checkEligibility(req.body);
    res.json(result);
  })
);

export default router;