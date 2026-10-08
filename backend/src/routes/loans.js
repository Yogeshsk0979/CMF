import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { createLoan, getLoan, getLoans, getEmiSchedule, getLoanSummary, forecloseLoan } from '../services/loanService.js';

const router = express.Router();

router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const filters = {
      customer_id: req.query.customer_id,
      status: req.query.status,
      branch_id: req.query.branch_id,
      product_id: req.query.product_id,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const result = await getLoans(filters);
    res.json(result);
  })
);

router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const loan = await getLoan(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  })
);

router.get('/:id/schedule',
  authenticate,
  asyncHandler(async (req, res) => {
    const schedule = await getEmiSchedule(req.params.id);
    res.json(schedule);
  })
);

router.get('/summary/:customerId',
  authenticate,
  asyncHandler(async (req, res) => {
    const summary = await getLoanSummary(req.params.customerId);
    res.json(summary);
  })
);

router.post('/',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const loan = await createLoan({ ...req.body, created_by: req.user.id });
    res.status(201).json(loan);
  })
);

router.post('/:id/foreclose',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const loan = await forecloseLoan(req.params.id);
    res.json(loan);
  })
);

export default router;