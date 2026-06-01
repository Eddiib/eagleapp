// Booking statuses — configurable workflow states with display colours.
// GET is open to any authenticated user (booking forms + lists render the
// badges). Mutations require edit access to company settings, where the
// management UI lives.

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { logAudit } = require('../lib/audit');

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_NAME = 50;

function validateName(name) {
  if (!name || !String(name).trim()) {
    throw new AppError(400, 'Status name is required', 'MISSING_FIELDS');
  }
  if (String(name).trim().length > MAX_NAME) {
    throw new AppError(400, `Name must be ${MAX_NAME} characters or fewer`, 'INVALID_NAME');
  }
}

function validateColor(color) {
  if (!HEX_RE.test(String(color))) {
    throw new AppError(400, 'Color must be a hex value like #2563eb', 'INVALID_COLOR');
  }
}

async function loadStatus(id) {
  const [rows] = await db.query('SELECT * FROM booking_statuses WHERE id = ? LIMIT 1', [id]);
  return rows.length ? rows[0] : null;
}

// GET — list all statuses ordered for display. Open to any authenticated user.
router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(
    'SELECT id, name, color, sort_order, is_active FROM booking_statuses ORDER BY sort_order, name',
  );
  res.json(rows);
}));

router.post('/', requirePermission('edit:company-settings'), asyncHandler(async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const color = String(req.body.color ?? '#6b7280').trim();
  validateName(name);
  validateColor(color);
  const sortOrder = Number.isFinite(Number(req.body.sort_order)) ? Number(req.body.sort_order) : 999;
  const isActive = req.body.is_active === undefined ? 1 : (req.body.is_active ? 1 : 0);
  const id = uuidv4();

  try {
    await db.query(
      'INSERT INTO booking_statuses (id, name, color, sort_order, is_active) VALUES (?,?,?,?,?)',
      [id, name, color, sortOrder, isActive],
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, `Status "${name}" already exists`, 'DUPLICATE_STATUS');
    }
    throw err;
  }

  const after = await loadStatus(id);
  await logAudit(db, { tableName: 'booking_statuses', rowId: id, action: 'INSERT', actor: req.user, after });
  res.status(201).json(after);
}));

router.put('/:id', requirePermission('edit:company-settings'), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const before = await loadStatus(id);
  if (!before) throw new AppError(404, 'Status not found', 'NOT_FOUND');

  const sets = [];
  const params = [];

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    validateName(name);
    sets.push('name=?');
    params.push(name);
  }
  if (req.body.color !== undefined) {
    const color = String(req.body.color).trim();
    validateColor(color);
    sets.push('color=?');
    params.push(color);
  }
  if (req.body.sort_order !== undefined) {
    const sortOrder = Number(req.body.sort_order);
    if (!Number.isFinite(sortOrder)) throw new AppError(400, 'sort_order must be a number', 'INVALID_NUMBER');
    sets.push('sort_order=?');
    params.push(sortOrder);
  }
  if (req.body.is_active !== undefined) {
    sets.push('is_active=?');
    params.push(req.body.is_active ? 1 : 0);
  }

  if (sets.length === 0) return res.json(before);

  params.push(id);
  try {
    await db.query(`UPDATE booking_statuses SET ${sets.join(', ')} WHERE id = ?`, params);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'Another status already uses that name', 'DUPLICATE_STATUS');
    }
    throw err;
  }

  const after = await loadStatus(id);
  await logAudit(db, { tableName: 'booking_statuses', rowId: id, action: 'UPDATE', actor: req.user, before, after });
  res.json(after);
}));

router.delete('/:id', requirePermission('edit:company-settings'), asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const before = await loadStatus(id);
  if (!before) throw new AppError(404, 'Status not found', 'NOT_FOUND');

  // Bookings store status as free text, so deleting a status never orphans a
  // foreign key — existing bookings with this status simply fall back to a
  // neutral badge until re-assigned.
  await db.query('DELETE FROM booking_statuses WHERE id = ?', [id]);

  await logAudit(db, { tableName: 'booking_statuses', rowId: id, action: 'DELETE', actor: req.user, before });
  res.json({ message: 'Status deleted' });
}));

module.exports = router;
