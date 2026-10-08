import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import { createVerificationTask, getVerificationTasks, completeVerificationTask } from '../services/commonService.js';

const router = express.Router();

router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const filters = {
      assigned_to: req.user.role === 'field_officer' || req.user.role === 'collection_agent' ? req.user.id : req.query.assigned_to,
      status: req.query.status,
      task_type: req.query.task_type,
      application_id: req.query.application_id,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const tasks = await getVerificationTasks(filters);
    res.json(tasks);
  })
);

router.post('/',
  authenticate, authorize('team_leader', 'branch_admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const task = await createVerificationTask({
      ...req.body,
      assigned_by: req.user.id
    });
    res.status(201).json(task);
  })
);

router.put('/:id/complete',
  authenticate,
  asyncHandler(async (req, res) => {
    const task = await completeVerificationTask(req.params.id, req.body, req.user.id);
    res.json(task);
  })
);

export default router;