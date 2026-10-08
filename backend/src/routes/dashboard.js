import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { getDashboardStats, getCollectionStats, getApprovalLimits, getNpaStats } from '../services/dashboardService.js';

const router = express.Router();

router.get('/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await getDashboardStats(req.user.branch_id);
    res.json(stats);
  })
);

router.get('/collection',
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await getCollectionStats(req.query.date_from, req.query.date_to);
    res.json(stats);
  })
);

router.get('/collection-stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await getCollectionStats(req.query.date_from, req.query.date_to);
    res.json(stats);
  })
);

router.get('/approval-limits',
  authenticate,
  asyncHandler(async (req, res) => {
    const limits = await getApprovalLimits(req.user.role_id);
    res.json(limits);
  })
);

router.get('/npa',
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await getNpaStats();
    res.json(stats);
  })
);

export default router;
