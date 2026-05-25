const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');
const { logAudit } = require('../lib/audit');

// UN/LOCODE port codes are typically 5 letters (country + city) but the
// schema accepts 2-10 alphanumerics to cover legacy / custom codes.
const CODE_RE = /^[A-Z0-9]{2,10}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;
const MAX_NAME = 100;

// snapshotRow in lib/audit assumes a column named `id`; ports use `code`,
// so capture the before-state inline for UPDATE/DELETE auditing.
async function loadPort(code) {
  const [rows] = await db.query('SELECT * FROM ports WHERE code = ? LIMIT 1', [code]);
  return rows.length ? rows[0] : null;
}

function validateCountry(country) {
  if (!COUNTRY_RE.test(country)) {
    throw new AppError(400, 'Invalid country code — expected 2 uppercase letters (ISO 3166-1)', 'INVALID_COUNTRY');
  }
}

function validateName(name) {
  if (!name || !name.trim()) {
    throw new AppError(400, 'Name is required', 'MISSING_FIELDS');
  }
  if (name.length > MAX_NAME) {
    throw new AppError(400, `Name must be ${MAX_NAME} characters or fewer`, 'INVALID_NAME');
  }
}

// GET — open to any authenticated user. The booking and partner pickers
// load this list directly, so gating it behind the admin module would lock
// non-admins out of editing bookings.
router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query('SELECT code, name, country, sort_order FROM ports ORDER BY sort_order, name');
  res.json(rows);
}));

// All mutations require edit access to the ports-management module.
router.post('/', requirePermission('edit:ports-management'), asyncHandler(async (req, res) => {
  requireFields(req.body, ['code', 'name', 'country']);
  const code = String(req.body.code).trim().toUpperCase();
  const name = String(req.body.name).trim();
  const country = String(req.body.country).trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    throw new AppError(400, 'Invalid port code — expected 2-10 uppercase alphanumerics', 'INVALID_CODE');
  }
  validateCountry(country);
  validateName(name);
  const sortOrder = Number.isFinite(Number(req.body.sort_order)) ? Number(req.body.sort_order) : 999;

  try {
    await db.query(
      'INSERT INTO ports (code, name, country, sort_order) VALUES (?,?,?,?)',
      [code, name, country, sortOrder],
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, `Port code "${code}" already exists`, 'DUPLICATE_CODE');
    }
    throw err;
  }

  await logAudit(db, {
    tableName: 'ports',
    rowId: code,
    action: 'INSERT',
    actor: req.user,
    after: { code, name, country, sort_order: sortOrder },
  });
  res.status(201).json({ code, message: 'Port created' });
}));

// PUT updates name / country / sort_order. The code is the primary key —
// changing it would orphan booking history, so it's immutable.
router.put('/:code', requirePermission('edit:ports-management'), asyncHandler(async (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const before = await loadPort(code);
  if (!before) throw new AppError(404, 'Port not found', 'NOT_FOUND');

  const sets = [];
  const params = [];

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    validateName(name);
    sets.push('name=?');
    params.push(name);
  }
  if (req.body.country !== undefined) {
    const country = String(req.body.country).trim().toUpperCase();
    validateCountry(country);
    sets.push('country=?');
    params.push(country);
  }
  if (req.body.sort_order !== undefined) {
    const sortOrder = Number(req.body.sort_order);
    if (!Number.isFinite(sortOrder)) {
      throw new AppError(400, 'sort_order must be a number', 'INVALID_NUMBER');
    }
    sets.push('sort_order=?');
    params.push(sortOrder);
  }

  if (sets.length === 0) {
    return res.json({ message: 'Nothing to update' });
  }

  params.push(code);
  await db.query(`UPDATE ports SET ${sets.join(', ')} WHERE code = ?`, params);

  const after = await loadPort(code);
  await logAudit(db, {
    tableName: 'ports',
    rowId: code,
    action: 'UPDATE',
    actor: req.user,
    before,
    after,
  });
  res.json({ message: 'Port updated' });
}));

router.delete('/:code', requirePermission('edit:ports-management'), asyncHandler(async (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const before = await loadPort(code);
  if (!before) throw new AppError(404, 'Port not found', 'NOT_FOUND');

  await db.query('DELETE FROM ports WHERE code = ?', [code]);

  await logAudit(db, {
    tableName: 'ports',
    rowId: code,
    action: 'DELETE',
    actor: req.user,
    before,
  });
  res.json({ message: 'Port deleted' });
}));

module.exports = router;
