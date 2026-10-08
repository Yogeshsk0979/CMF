import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validation.js';
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from '../services/notificationService.js';

const router = express.Router();

// GET /api/notifications - get notifications for current user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { unread_only } = req.query;
  const limit = parseInt(req.query.limit || '50', 10);
  const offset = parseInt(req.query.offset || '0', 10);

  const result = await getNotifications(req.user.id, {
    limit,
    offset,
    unreadOnly: unread_only === 'true',
  });

  res.json(result);
}));

// GET /api/notifications/unread-count - get unread count
router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
  const result = await getUnreadCount(req.user.id);
  res.json(result);
}));

// POST /api/notifications - create a notification
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const {
    user_id,
    title,
    message,
    type,
    related_entity_type,
    related_entity_id,
    is_action_required,
    action_url,
    expires_at,
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const notification = await createNotification({
    userId: user_id || req.user.id,
    title,
    message,
    type: type || 'info',
    relatedEntityType: related_entity_type,
    relatedEntityId: related_entity_id,
    isActionRequired: is_action_required || false,
    actionUrl: action_url,
    expiresAt: expires_at,
  });

  res.status(201).json(notification);
}));

// PUT /api/notifications/:id/read - mark single notification as read
router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.params.id, req.user.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found or already read' });
  }
  res.json(notification);
}));

// PUT /api/notifications/read-all - mark all notifications as read
router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
  const result = await markAllAsRead(req.user.id);
  res.json(result);
}));

// DELETE /api/notifications/:id - delete a notification
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const deleted = await deleteNotification(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ success: true, id: deleted.id });
}));

export default router;

