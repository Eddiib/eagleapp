const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');
const { logAudit } = require('../lib/audit');
const { normalizeCurrency } = require('../lib/companySettings');

const MAX_NAME = 50;

// snapshotRow in lib/audit assumes a column named `id`; currencies use `code`,
// so capture the before-state inline for UPDATE/DELETE auditing.
async function loadCurrency(code) {
  const [rows] = await db.query('SELECT * FROM currencies WHERE code = ? LIMIT 1', [code]);
  return rows.length ? rows[0] : null;
}

function validateName(name) {
  if (!name || !name.trim()) {
    throw new AppError(400, 'Name is required', 'MISSING_FIELDS');
  }
  if (name.length > MAX_NAME) {
    throw new AppError(400, `Name must be ${MAX_NAME} characters or fewer`, 'INVALID_NAME');
  }
}

// GET — open to any authenticated user. Currency dropdowns across bookings,
// invoices, quotations etc. load this list directly, so gating it behind the
// forex module would lock non-forex users out of everyday forms.
router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(
    'SELECT code, name, is_active, sort_order FROM currencies ORDER BY sort_order, code'
  );
  res.json(rows);
}));

// All mutations require edit access to the forex-management module.
router.post('/', requirePermission('edit:forex-management'), asyncHandler(async (req, res) => {
  requireFields(req.body, ['code', 'name']);
  const code = normalizeCurrency(req.body.code);
  const name = String(req.body.name).trim();
  if (!code) {
    throw new AppError(400, 'Invalid currency code — expected 3 letters (ISO 4217)', 'INVALID_CODE');
  }
  validateName(name);
  const sortOrder = Number.isFinite(Number(req.body.sort_order)) ? Number(req.body.sort_order) : 999;
  const isActive = req.body.is_active === undefined ? 1 : (req.body.is_active ? 1 : 0);

  try {
    await db.query(
      'INSERT INTO currencies (code, name, is_active, sort_order) VALUES (?,?,?,?)',
      [code, name, isActive, sortOrder],
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, `Currency "${code}" already exists`, 'DUPLICATE_CODE');
    }
    throw err;
  }

  await logAudit(db, {
    tableName: 'currencies',
    rowId: code,
    action: 'INSERT',
    actor: req.user,
    after: { code, name, is_active: isActive, sort_order: sortOrder },
  });
  res.status(201).json({ code, message: 'Currency created' });
}));

// PUT updates name / is_active / sort_order. The code is the primary key and
// is stamped onto booking lines, invoices etc., so it's immutable.
router.put('/:code', requirePermission('edit:forex-management'), asyncHandler(async (req, res) => {
  const code = normalizeCurrency(req.params.code) || String(req.params.code).trim().toUpperCase();
  const before = await loadCurrency(code);
  if (!before) throw new AppError(404, 'Currency not found', 'NOT_FOUND');

  const sets = [];
  const params = [];

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    validateName(name);
    sets.push('name=?');
    params.push(name);
  }
  if (req.body.is_active !== undefined) {
    sets.push('is_active=?');
    params.push(req.body.is_active ? 1 : 0);
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
  await db.query(`UPDATE currencies SET ${sets.join(', ')} WHERE code = ?`, params);

  const after = await loadCurrency(code);
  await logAudit(db, {
    tableName: 'currencies',
    rowId: code,
    action: 'UPDATE',
    actor: req.user,
    before,
    after,
  });
  res.json({ message: 'Currency updated' });
}));

// Deleting is only for typos — historical lines keep whatever code they were
// stamped with, so the normal way to retire a currency is deactivating it.
router.delete('/:code', requirePermission('edit:forex-management'), asyncHandler(async (req, res) => {
  const code = normalizeCurrency(req.params.code) || String(req.params.code).trim().toUpperCase();
  const before = await loadCurrency(code);
  if (!before) throw new AppError(404, 'Currency not found', 'NOT_FOUND');

  await db.query('DELETE FROM currencies WHERE code = ?', [code]);

  await logAudit(db, {
    tableName: 'currencies',
    rowId: code,
    action: 'DELETE',
    actor: req.user,
    before,
  });
  res.json({ message: 'Currency deleted' });
}));

module.exports = router;
