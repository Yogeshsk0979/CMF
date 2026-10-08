import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { getAreas, createArea, getAreaMembers, assignAreaLeader } from '../services/commonService.js';

const router = express.Router();

router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const areas = await getAreas(req.query);
    res.json(areas);
  })
);

router.post('/',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const area = await createArea(req.body);
    res.status(201).json(area);
  })
);

router.get('/:id/members',
  authenticate,
  asyncHandler(async (req, res) => {
    const members = await getAreaMembers(req.params.id);
    res.json(members);
  })
);

router.post('/:id/assign-leader',
  authenticate, authorize('branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    await assignAreaLeader(req.params.id, req.body.user_id);
    res.json({ success: true });
  })
);

export default router;