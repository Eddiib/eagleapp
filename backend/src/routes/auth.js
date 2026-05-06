const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { verifyToken, requireRole, JWT_SECRET, JWT_EXPIRES_IN, ROLES } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { requireFields, requireEnum, requireEmail } = require('../middleware/validate');

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const { username, password } = req.body;

  const [rows] = await db.query(
    `SELECT u.*, e.first_name, e.surname
     FROM users u
     LEFT JOIN employees e ON u.employee_id = e.id
     WHERE (u.username = ? OR u.email = ?) AND u.is_active = 1`,
    [username, username]
  );

  if (!rows.length) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');

  if (!ROLES.includes(user.role)) {
    throw new AppError(500, `Stored role "${user.role}" is not supported`, 'UNKNOWN_ROLE');
  }

  await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    employee_id: user.employee_id,
    display_name: user.first_name
      ? `${user.first_name} ${user.surname}`
      : user.username,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token, user: payload });
}));

// GET /api/auth/me  — verify token and return current user
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout — stateless JWT; respond OK so frontend has a stable endpoint
router.post('/logout', verifyToken, (_req, res) => {
  res.json({ message: 'Logged out' });
});

// GET /api/auth/users  — list all users (admin only)
router.get('/users', verifyToken, requireRole('admin'), asyncHandler(async (_req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.email, u.role, u.is_active, u.last_login, u.created_at,
            e.first_name, e.surname
     FROM users u
     LEFT JOIN employees e ON u.employee_id = e.id
     ORDER BY u.created_at DESC`
  );
  res.json(rows);
}));

// POST /api/auth/users  — create user (admin only)
router.post('/users', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'email', 'password', 'role']);
  const { username, email, password, role, employee_id } = req.body;
  requireEmail(email);
  requireEnum(role, ROLES, 'role');
  if (typeof password !== 'string' || password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  await db.query(
    'INSERT INTO users (id, username, email, password_hash, role, employee_id) VALUES (?,?,?,?,?,?)',
    [id, username, email, hash, role, employee_id || null]
  );

  res.status(201).json({ id, message: 'User created' });
}));

// PUT /api/auth/users/:id  — update user (admin only)
router.put('/users/:id', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { email, role, employee_id, is_active, password } = req.body || {};
  requireEmail(email);
  requireEnum(role, ROLES, 'role');
  if (password !== undefined && (typeof password !== 'string' || password.length < 8)) {
    throw new AppError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
  }

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE users SET email=?, role=?, employee_id=?, is_active=?, password_hash=? WHERE id=?',
      [email, role, employee_id || null, is_active ? 1 : 0, hash, req.params.id]
    );
  } else {
    await db.query(
      'UPDATE users SET email=?, role=?, employee_id=?, is_active=? WHERE id=?',
      [email, role, employee_id || null, is_active ? 1 : 0, req.params.id]
    );
  }
  res.json({ message: 'User updated' });
}));

// DELETE /api/auth/users/:id  — delete user (admin only, cannot delete self)
router.delete('/users/:id', verifyToken, requireRole('admin'), asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError(400, 'Cannot delete your own account', 'SELF_DELETE');
  }
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted' });
}));

module.exports = router;
