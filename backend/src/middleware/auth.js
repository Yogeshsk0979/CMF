import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/index.js';
import { query } from '../config/db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export async function loadPermissions(req, res, next) {
  if (!req.user) return next();

  try {
    const permResult = await query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND rp.is_granted = true`,
      [req.user.roleId]
    );
    req.user.permissions = new Set(permResult.rows.map(r => r.name));
    next();
  } catch (err) {
    req.user.permissions = new Set();
    next();
  }
}