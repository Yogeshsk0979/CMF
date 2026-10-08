import { query } from '../config/db.js';

let tableChecked = false;
async function ensureNotificationsTable() {
  if (tableChecked) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        related_entity_type VARCHAR(50),
        related_entity_id UUID,
        is_read BOOLEAN DEFAULT false,
        is_action_required BOOLEAN DEFAULT false,
        action_url VARCHAR(255),
        read_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    tableChecked = true;
  } catch (err) {
    console.error('Failed to create notifications table:', err);
  }
}

/**
 * Create a new notification
 */
export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  relatedEntityType = null,
  relatedEntityId = null,
  isActionRequired = false,
  actionUrl = null,
  expiresAt = null,
}) {
  await ensureNotificationsTable();
  const result = await query(
    `INSERT INTO notifications
      (user_id, title, message, type, related_entity_type, related_entity_id,
       is_read, is_action_required, action_url, read_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, NULL, $9)
     RETURNING *`,
    [userId, title, message, type, relatedEntityType, relatedEntityId,
     isActionRequired, actionUrl, expiresAt]
  );
  return result.rows[0];
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(userId, options = {}) {
  await ensureNotificationsTable();
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  let whereClause = 'WHERE user_id = $1';
  const params = [userId];
  let idx = 2;

  if (unreadOnly) {
    whereClause += ` AND is_read = false`;
  }

  whereClause += ` AND (expires_at IS NULL OR expires_at > NOW())`;

  const countResult = await query(
    `SELECT COUNT(*) FROM notifications ${whereClause}`,
    params
  );

  const result = await query(
    `SELECT * FROM notifications ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return {
    notifications: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    limit,
    offset,
  };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId, userId) {
  const result = await query(
    `UPDATE notifications
     SET is_read = true, read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_read = false
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId) {
  const result = await query(
    `UPDATE notifications
     SET is_read = true, read_at = NOW()
     WHERE user_id = $1 AND is_read = false
     RETURNING id`,
    [userId]
  );
  return {
    count: result.rows.length,
    notificationIds: result.rows.map((r) => r.id),
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId) {
  await ensureNotificationsTable();
  const result = await query(
    `SELECT COUNT(*) as count
     FROM notifications
     WHERE user_id = $1
       AND is_read = false
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId]
  );
  return { count: parseInt(result.rows[0].count, 10) };
}

/**
 * Soft delete a notification
 */
export async function deleteNotification(notificationId, userId) {
  const result = await query(
    `DELETE FROM notifications
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}
