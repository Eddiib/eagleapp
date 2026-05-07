const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { verifyToken, requirePermission, JWT_SECRET, JWT_EXPIRES_IN } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { requireFields, requireEmail, requireString } = require('../middleware/validate');
const {
  MODULES,
  SYSTEM_ROLES,
  defaultPermissionsForRole,
  isRoleKey,
  getActiveRole,
  getRolePermissions,
  normalizePermissions,
} = require('../lib/permissions');

const roleView = [verifyToken, requirePermission('view:user-management')];
const roleEdit = [verifyToken, requirePermission('edit:user-management')];

function roleKeyFrom(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

async function assertRoleExists(roleKey) {
  const role = await getActiveRole(roleKey);
  if (!role) {
    throw new AppError(400, `Role "${roleKey}" does not exist or is inactive`, 'INVALID_ROLE');
  }
  return role;
}

function mapModule(row) {
  return {
    key: row.module_key,
    name: row.module_name,
    category: row.category,
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active),
  };
}

function mapRole(row, permissions = []) {
  return {
    key: row.role_key,
    name: row.role_name,
    description: row.description || '',
    isSystem: Boolean(row.is_system),
    isActive: Boolean(row.is_active),
    userCount: Number(row.user_count || 0),
    permissions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function permissionSchemaMissing(err) {
  return err?.code === 'ER_NO_SUCH_TABLE'
    && /\b(roles|modules|role_module_permissions)\b/.test(err.message || '');
}

function fallbackModules() {
  return MODULES.map((module) => ({
    key: module.key,
    name: module.name,
    category: module.category,
    sortOrder: module.sortOrder,
    isActive: true,
  }));
}

async function fallbackRolesWithPermissions() {
  const userCounts = new Map();
  try {
    const [rows] = await db.query('SELECT role, COUNT(*) AS user_count FROM users GROUP BY role');
    for (const row of rows) {
      userCounts.set(row.role, Number(row.user_count || 0));
    }
  } catch (err) {
    // Users may also be unavailable during first setup; return static roles.
  }

  return SYSTEM_ROLES.map((role) => ({
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: true,
    isActive: true,
    userCount: userCounts.get(role.key) || 0,
    permissions: defaultPermissionsForRole(role.key),
  }));
}

async function requirePermissionSchema() {
  try {
    await db.query('SELECT 1 FROM roles LIMIT 1');
  } catch (err) {
    if (permissionSchemaMissing(err)) {
      throw new AppError(
        503,
        'Role permission tables are not migrated yet. Run backend migrations before editing roles.',
        'PERMISSION_SCHEMA_MISSING'
      );
    }
    throw err;
  }
}

async function listRolesWithPermissions() {
  let roles;
  let permissionRows;
  try {
    [roles] = await db.query(
      `SELECT r.role_key, r.role_name, r.description, r.is_system, r.is_active,
              r.created_at, r.updated_at, COUNT(u.id) AS user_count
       FROM roles r
       LEFT JOIN users u ON u.role = r.role_key
       GROUP BY r.role_key, r.role_name, r.description, r.is_system, r.is_active, r.created_at, r.updated_at
       ORDER BY r.is_system DESC, r.role_name`
    );
    [permissionRows] = await db.query(
      `SELECT role_key, module_key, can_view, can_edit
       FROM role_module_permissions`
    );
  } catch (err) {
    if (permissionSchemaMissing(err)) return fallbackRolesWithPermissions();
    throw err;
  }

  const byRole = new Map();
  for (const row of permissionRows) {
    if (!byRole.has(row.role_key)) byRole.set(row.role_key, []);
    if (row.can_view) byRole.get(row.role_key).push(`view:${row.module_key}`);
    if (row.can_edit) byRole.get(row.role_key).push(`edit:${row.module_key}`);
  }

  return roles.map((role) => mapRole(role, (byRole.get(role.role_key) || []).sort()));
}

async function saveRolePermissions(roleKey, permissions) {
  const normalized = normalizePermissions(
    roleKey === 'admin'
      ? Object.fromEntries(MODULES.map((module) => [module.key, 'edit']))
      : permissions
  );
  const rows = [];
  for (const [moduleKey, value] of normalized) {
    if (value.view || value.edit) {
      rows.push([roleKey, moduleKey, value.view ? 1 : 0, value.edit ? 1 : 0]);
    }
  }

  await db.query('DELETE FROM role_module_permissions WHERE role_key = ?', [roleKey]);
  if (rows.length) {
    await db.query(
      'INSERT INTO role_module_permissions (role_key, module_key, can_view, can_edit) VALUES ?',
      [rows]
    );
  }
}

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

  const role = await getActiveRole(user.role);
  if (!role) {
    throw new AppError(500, `Stored role "${user.role}" is not supported`, 'UNKNOWN_ROLE');
  }
  const permissions = await getRolePermissions(user.role);

  await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: role.role_key || role.key,
    role_name: role.role_name || role.name,
    permissions,
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

// GET /api/auth/modules — list configured application modules
router.get('/modules', roleView, asyncHandler(async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT module_key, module_name, category, sort_order, is_active
       FROM modules
       WHERE is_active = 1
       ORDER BY sort_order, module_name`
    );
    res.json(rows.map(mapModule));
  } catch (err) {
    if (permissionSchemaMissing(err)) {
      return res.json(fallbackModules());
    }
    throw err;
  }
}));

// GET /api/auth/roles — list roles and their module permissions
router.get('/roles', roleView, asyncHandler(async (_req, res) => {
  res.json(await listRolesWithPermissions());
}));

// GET /api/auth/employee-options — list employees that can be linked to users
router.get('/employee-options', roleView, asyncHandler(async (_req, res) => {
  const [rows] = await db.query(
    `SELECT id, employee_code, first_name, surname, email, is_active, has_system_access
     FROM employees
     ORDER BY is_active DESC, first_name, surname`
  );
  res.json(rows);
}));

// POST /api/auth/roles — create a custom role
router.post('/roles', roleEdit, asyncHandler(async (req, res) => {
  await requirePermissionSchema();
  requireFields(req.body, ['name']);
  requireString(req.body.description, 'description', { maxLength: 500 });

  const key = roleKeyFrom(req.body.key || req.body.name);
  if (!isRoleKey(key)) {
    throw new AppError(
      400,
      'Role key must use 2-50 lowercase letters, numbers, dashes, or underscores',
      'INVALID_ROLE_KEY'
    );
  }

  const [existing] = await db.query('SELECT role_key FROM roles WHERE role_key = ?', [key]);
  if (existing.length) {
    throw new AppError(409, `Role "${key}" already exists`, 'ROLE_EXISTS');
  }

  await db.query(
    `INSERT INTO roles (role_key, role_name, description, is_system, is_active)
     VALUES (?,?,?,?,1)`,
    [key, req.body.name.trim(), req.body.description || '', 0]
  );
  await saveRolePermissions(key, req.body.permissions || {});
  res.status(201).json({ key, message: 'Role created' });
}));

// PUT /api/auth/roles/:roleKey — update a role and its module permissions
router.put('/roles/:roleKey', roleEdit, asyncHandler(async (req, res) => {
  await requirePermissionSchema();
  const roleKey = roleKeyFrom(req.params.roleKey);
  if (!isRoleKey(roleKey)) {
    throw new AppError(400, 'Invalid role key', 'INVALID_ROLE_KEY');
  }
  const [roles] = await db.query('SELECT * FROM roles WHERE role_key = ?', [roleKey]);
  if (!roles.length) throw new AppError(404, 'Role not found', 'ROLE_NOT_FOUND');

  const nextName = typeof req.body.name === 'string' && req.body.name.trim()
    ? req.body.name.trim()
    : roles[0].role_name;
  const nextDescription = req.body.description !== undefined
    ? String(req.body.description || '')
    : roles[0].description;
  const nextActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : Boolean(roles[0].is_active);

  if (roleKey === 'admin' && !nextActive) {
    throw new AppError(400, 'The administrator role cannot be deactivated', 'ADMIN_ROLE_REQUIRED');
  }

  await db.query(
    `UPDATE roles
     SET role_name = ?, description = ?, is_active = ?
     WHERE role_key = ?`,
    [nextName, nextDescription, nextActive ? 1 : 0, roleKey]
  );

  if (req.body.permissions !== undefined) {
    await saveRolePermissions(roleKey, req.body.permissions);
  }

  res.json({ message: 'Role updated' });
}));

// DELETE /api/auth/roles/:roleKey — delete a custom role
router.delete('/roles/:roleKey', roleEdit, asyncHandler(async (req, res) => {
  await requirePermissionSchema();
  const roleKey = roleKeyFrom(req.params.roleKey);
  if (!isRoleKey(roleKey)) throw new AppError(400, 'Invalid role key', 'INVALID_ROLE_KEY');

  const [roles] = await db.query('SELECT role_key, is_system FROM roles WHERE role_key = ?', [roleKey]);
  if (!roles.length) throw new AppError(404, 'Role not found', 'ROLE_NOT_FOUND');
  if (roles[0].is_system) {
    throw new AppError(400, 'System roles cannot be deleted', 'SYSTEM_ROLE');
  }

  const [users] = await db.query('SELECT COUNT(*) AS count FROM users WHERE role = ?', [roleKey]);
  if (Number(users[0].count) > 0) {
    throw new AppError(400, 'Cannot delete a role assigned to users', 'ROLE_IN_USE');
  }

  await db.query('DELETE FROM roles WHERE role_key = ?', [roleKey]);
  res.json({ message: 'Role deleted' });
}));

// GET /api/auth/users — list all users
router.get('/users', roleView, asyncHandler(async (_req, res) => {
  let rows;
  try {
    [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.employee_id, u.is_active, u.last_login, u.created_at,
              r.role_name,
              e.first_name, e.surname
       FROM users u
       LEFT JOIN roles r ON u.role = r.role_key
       LEFT JOIN employees e ON u.employee_id = e.id
       ORDER BY u.created_at DESC`
    );
  } catch (err) {
    if (!permissionSchemaMissing(err)) throw err;
    [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.employee_id, u.is_active, u.last_login, u.created_at,
              e.first_name, e.surname
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.id
       ORDER BY u.created_at DESC`
    );
    const roleLabels = new Map(SYSTEM_ROLES.map((role) => [role.key, role.name]));
    rows = rows.map((row) => ({ ...row, role_name: roleLabels.get(row.role) || row.role }));
  }
  res.json(rows);
}));

// POST /api/auth/users — create user
router.post('/users', roleEdit, asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'email', 'password', 'role']);
  const { username, email, password, role, employee_id } = req.body;
  requireEmail(email);
  await assertRoleExists(role);
  if (typeof password !== 'string' || password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  await db.query(
    'INSERT INTO users (id, username, email, password_hash, role, employee_id) VALUES (?,?,?,?,?,?)',
    [id, username, email, hash, role, employee_id || null]
  );
  if (employee_id) {
    await db.query('UPDATE employees SET has_system_access = 1 WHERE id = ?', [employee_id]);
  }

  res.status(201).json({ id, message: 'User created' });
}));

// PUT /api/auth/users/:id — update user
router.put('/users/:id', roleEdit, asyncHandler(async (req, res) => {
  const { email, role, employee_id, is_active, password } = req.body || {};
  requireEmail(email);
  await assertRoleExists(role);
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
  if (employee_id) {
    await db.query('UPDATE employees SET has_system_access = 1 WHERE id = ?', [employee_id]);
  }
  res.json({ message: 'User updated' });
}));

// DELETE /api/auth/users/:id — delete user (cannot delete self)
router.delete('/users/:id', roleEdit, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError(400, 'Cannot delete your own account', 'SELF_DELETE');
  }
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted' });
}));

module.exports = router;
