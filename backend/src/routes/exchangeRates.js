const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireNumber, requireDate } = require('../middleware/validate');

// GET all rates, newest effective date first
router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(
    `SELECT * FROM exchange_rates
     ORDER BY effective_date DESC, from_currency, to_currency`
  );
  res.json(rows);
}));

// POST create or upsert a rate for (from, to, date)
router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['from_currency', 'to_currency', 'rate', 'effective_date']);
  const { from_currency, to_currency, rate, effective_date } = req.body;
  requireNumber(rate, 'rate', { min: 0 });
  requireDate(effective_date, 'effective_date');

  const id = uuidv4();
  await db.query(
    `INSERT INTO exchange_rates (id, from_currency, to_currency, rate, effective_date)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE rate = VALUES(rate)`,
    [id, from_currency.toUpperCase(), to_currency.toUpperCase(), rate, effective_date]
  );
  res.status(201).json({ id, message: 'Rate saved' });
}));

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM exchange_rates WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Rate not found', 'NOT_FOUND');
  res.json({ message: 'Rate deleted' });
}));

module.exports = router;
