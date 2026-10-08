import express from 'express';
import { body, validationResult } from 'express-validator';
import { login, refreshAccessToken, getUserProfile, updateUserProfile, changePassword, getUsers, createUser, updateUser, deleteUser } from '../services/authService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, asyncHandler } from '../middleware/validation.js';

const router = express.Router();

router.post('/login',
  body('identifier').notEmpty().withMessage('Identifier required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    const result = await login(identifier, password);
    res.json(result);
  })
);

router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
  })
);

router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await getUserProfile(req.user.id);
    res.json({ user: req.user, profile });
  })
);

router.put('/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const profile = await updateUserProfile(req.user.id, req.body);
    res.json({ profile });
  })
);

router.post('/change-password',
  authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
  asyncHandler(async (req, res) => {
    const result = await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  })
);

router.get('/users',
  authenticate, authorize('super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent'),
  asyncHandler(async (req, res) => {
    const filters = {
      role: req.query.role,
      branch_id: req.query.branch_id,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const result = await getUsers(filters);
    res.json(result);
  })
);

router.post('/users',
  authenticate, authorize('super_admin', 'branch_admin'),
  body('email').isEmail(),
  body('phone').isMobilePhone('en-IN'),
  body('first_name').notEmpty(),
  body('last_name').notEmpty(),
  body('role').isIn(['customer', 'field_officer', 'team_leader', 'collection_agent', 'branch_admin']),
  validate,
  asyncHandler(async (req, res) => {
    const user = await createUser(req.body);
    res.status(201).json(user);
  })
);

router.put('/users/:id',
  authenticate, authorize('super_admin', 'branch_admin'),
  asyncHandler(async (req, res) => {
    const user = await updateUser(req.params.id, req.body);
    res.json(user);
  })
);

router.delete('/users/:id',
  authenticate, authorize('super_admin', 'branch_admin'),
  asyncHandler(async (req, res) => {
    const result = await deleteUser(req.params.id);
    res.json(result);
  })
);

export default router;