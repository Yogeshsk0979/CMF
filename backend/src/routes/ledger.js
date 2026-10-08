import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { getLedgerAccounts, createLedgerEntry, getLedgerEntries, getTrialBalance, getBankAccounts, createBankAccount } from '../services/ledgerService.js';

const router = express.Router();

router.get('/accounts',
  authenticate,
  asyncHandler(async (req, res) => {
    const accounts = await getLedgerAccounts(req.query);
    res.json(accounts);
  })
);

router.get('/entries',
  authenticate,
  asyncHandler(async (req, res) => {
    const entries = await getLedgerEntries(req.query);
    res.json(entries);
  })
);

router.post('/entries',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const entry = await createLedgerEntry(req.body);
    res.status(201).json(entry);
  })
);

router.get('/trial-balance',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const tb = await getTrialBalance();
    res.json(tb);
  })
);

router.get('/bank-accounts',
  authenticate,
  asyncHandler(async (req, res) => {
    const accounts = await getBankAccounts();
    res.json(accounts);
  })
);

router.post('/bank-accounts',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const account = await createBankAccount(req.body);
    res.status(201).json(account);
  })
);

export default router;