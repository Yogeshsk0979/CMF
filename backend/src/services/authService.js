import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../config/db.js';
import { JWT_CONFIG } from '../config/index.js';

export async function login(identifier, password) {
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.role, u.is_active, u.is_verified,
            u.password_hash, u.customer_code, u.email_verified, u.phone_verified,
            r.id as role_id, r.name as role_name, r.display_name as role_display
     FROM users u
     JOIN roles r ON r.name::text = u.role::text
     WHERE (u.email = $1 OR u.phone = $1 OR u.username = $1) AND u.is_active = true`,
    [identifier]
  );

  const user = result.rows[0];
  if (!user) throw new Error('Invalid credentials');

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) throw new Error('Invalid credentials');

  // Record login
  await query(
    `INSERT INTO login_audit (user_id, ip_address, user_agent, success) VALUES ($1, $2, $3, true)`,
    [user.id, 'system', 'api']
  );

  const token = jwt.sign(
    { id: user.id, role: user.role, roleId: user.role_id, email: user.email, customerCode: user.customer_code },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.refreshExpiresIn }
  );

  await query(
    `INSERT INTO jwt_refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, refreshToken]
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roleName: user.role_display,
      customerCode: user.customer_code,
      isVerified: user.is_verified,
      emailVerified: user.email_verified,
      phoneVerified: user.phone_verified
    },
    token,
    refreshToken
  };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new Error('Refresh token required');

  const result = await query(
    `SELECT u.id, u.email, u.role, u.customer_code, r.id as role_id
     FROM users u
     JOIN roles r ON r.name::text = u.role::text
     JOIN jwt_refresh_tokens t ON t.user_id = u.id
     WHERE t.token = $1 AND t.expires_at > NOW() AND u.is_active = true`,
    [refreshToken]
  );

  const record = result.rows[0];
  if (!record) throw new Error('Invalid or expired refresh token');

  const token = jwt.sign(
    { id: record.id, role: record.role, roleId: record.role_id, email: record.email, customerCode: record.customer_code },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.expiresIn }
  );

  return { token };
}

export async function getUserProfile(userId) {
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.role, u.username, u.customer_code,
            u.is_active, u.is_verified, u.email_verified, u.phone_verified,
            p.first_name, p.middle_name, p.last_name, p.date_of_birth, p.gender,
            p.marital_status, p.father_name, p.spouse_name, p.occupation,
            p.aadhaar_verified, p.aadhaar_last4, p.pan_verified, p.pan_number,
            p.profile_completed, p.address as profile_address
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0];
}

export async function updateUserProfile(userId, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  const profileFields = ['first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
    'marital_status', 'father_name', 'spouse_name', 'occupation', 'address',
    'aadhaar_last4', 'pan_number', 'pan_verified', 'aadhaar_verified'];

  for (const key of profileFields) {
    if (data[key] !== undefined) {
      fields.push(key + ' = $' + (idx++));
      values.push(data[key]);
    }
  }
  fields.push('profile_completed = true');

  if (fields.length > 0) {
    values.push(userId);
    await query(
      `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = $${idx}`,
      values
    );
  }

  // Update user fields
  const userFields = [];
  const userValues = [];
  let uIdx = 1;
  if (data.email) { userFields.push('email = $' + (uIdx++)); userValues.push(data.email); }
  if (data.phone) { userFields.push('phone = $' + (uIdx++)); userValues.push(data.phone); }
  if (userFields.length > 0) {
    userValues.push(userId);
    await query('UPDATE users SET ' + userFields.join(', ') + ' WHERE id = $' + uIdx, userValues);
  }

  return getUserProfile(userId);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = result.rows[0];
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new Error('Current password is incorrect');

  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

  // Invalidate existing sessions
  await query('UPDATE jwt_refresh_tokens SET is_revoked = true WHERE user_id = $1', [userId]);

  return { message: 'Password changed successfully' };
}

export async function getUsers(filters = {}) {
  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.role) { where += ` AND u.role = $${idx++}`; params.push(filters.role); }
  if (filters.branch_id) { where += ` AND u.branch_id = $${idx++}`; params.push(filters.branch_id); }
  if (filters.is_active !== undefined) { where += ` AND u.is_active = $${idx++}`; params.push(filters.is_active); }
  if (filters.search) {
    where += ` AND (u.email ILIKE $${idx} OR u.phone ILIKE $${idx})`;
    params.push('%' + filters.search + '%');
    idx++;
  }

  const result = await query(
    `SELECT u.id, u.email, u.phone, u.role, u.username, u.customer_code,
            u.is_active, u.is_verified, u.created_at,
            p.first_name, p.last_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit || 50, filters.offset || 0]
  );

  const countResult = await query(
    `SELECT COUNT(*) FROM users u ${where}`,
    params
  );

  return {
    users: result.rows,
    total: parseInt(countResult.rows[0].count),
    limit: filters.limit || 50,
    offset: filters.offset || 0
  };
}

export async function createUser(data) {
  const passwordHash = await bcrypt.hash(data.password || 'password123', 10);
  const result = await query(
    `INSERT INTO users (username, email, phone, password_hash, role, is_active, is_verified, email_verified, phone_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, customer_code`,
    [data.username, data.email, data.phone, passwordHash, data.role, true, false, false, false]
  );
  const user = result.rows[0];

  await query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, date_of_birth, gender, profile_completed)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, data.first_name, data.last_name, data.date_of_birth || '1990-01-01', data.gender || 'male', false]
  );

  return user;
}

export async function updateUser(id, data) {
  if (data.first_name || data.last_name || data.phone) {
    await updateUserProfile(id, data);
  }
  const fields = [];
  const values = [];
  let idx = 1;
  if (data.email) { fields.push(`email = $${idx++}`); values.push(data.email); }
  if (data.role) { fields.push(`role = $${idx++}`); values.push(data.role); }
  if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.is_active); }
  if (data.password) {
    const hash = await bcrypt.hash(data.password, 10);
    fields.push(`password_hash = $${idx++}`);
    values.push(hash);
  }
  if (fields.length > 0) {
    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  }
  return getUserProfile(id);
}

export async function deleteUser(id) {
  await query('UPDATE users SET is_active = false WHERE id = $1', [id]);
  return { success: true };
}