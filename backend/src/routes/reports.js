import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { getPortfolioReport, getCollectionReport, getNpaReport, getBranchReport, getAgentPerformance, getLedgerReport, getDashboardStats } from '../services/reportsService.js';

const router = express.Router();

router.get('/portfolio', authenticate, asyncHandler(async (req, res) => {
  const data = await getPortfolioReport(req.query);
  res.json(data);
}));

router.get('/collection', authenticate, asyncHandler(async (req, res) => {
  const data = await getCollectionReport(req.query);
  res.json(data);
}));

router.get('/npa', authenticate, asyncHandler(async (req, res) => {
  const data = await getNpaReport();
  res.json(data);
}));

router.get('/branch/:branchId', authenticate, asyncHandler(async (req, res) => {
  const data = await getBranchReport(req.params.branchId, req.query.date_from, req.query.date_to);
  res.json(data);
}));

router.get('/agent/:agentId', authenticate, asyncHandler(async (req, res) => {
  const data = await getAgentPerformance(req.params.agentId, req.query.date_from, req.query.date_to);
  res.json(data);
}));

router.get('/ledger', authenticate, asyncHandler(async (req, res) => {
  const data = await getLedgerReport(req.query.date_from, req.query.date_to);
  res.json(data);
}));

router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  const data = await getDashboardStats(req.query.branch_id);
  res.json(data);
}));

export default router;
