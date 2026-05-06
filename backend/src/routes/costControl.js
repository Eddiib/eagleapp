const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireEnum } = require('../middleware/validate');
const { logAudit, snapshotRow } = require('../lib/audit');

const VALID_STATUSES = ['Pending', 'Approved', 'Paid', 'Disputed'];

router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT cc.*,
      b.booking_number,
      s.service_name,
      p.company_legal_name  AS supplier_name,
      c.company_legal_name  AS client_name,
      c.trading_name        AS client_trading_name
    FROM cost_control cc
    LEFT JOIN bookings b ON cc.booking_id  = b.id
    LEFT JOIN services s ON cc.service_id  = s.id
    LEFT JOIN partners p ON cc.supplier_id = p.id
    LEFT JOIN partners c ON cc.client_id   = c.id
    ORDER BY cc.created_at DESC
  `);
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT cc.*,
      b.booking_number,
      s.service_name,
      p.company_legal_name  AS supplier_name,
      c.company_legal_name  AS client_name,
      c.trading_name        AS client_trading_name
    FROM cost_control cc
    LEFT JOIN bookings b ON cc.booking_id  = b.id
    LEFT JOIN services s ON cc.service_id  = s.id
    LEFT JOIN partners p ON cc.supplier_id = p.id
    LEFT JOIN partners c ON cc.client_id   = c.id
    WHERE cc.id = ?
  `, [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Entry not found', 'NOT_FOUND');
  res.json(rows[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['booking_id', 'service_id']);
  const {
    booking_id, service_id, supplier_id, client_id, description,
    amount, currency, buying_exchange_rate,
    invoice_number, invoice_date, due_date, status,
    selling_price, selling_currency, selling_exchange_rate,
    selling_invoice_number, selling_invoice_date,
    quantity, created_by,
  } = req.body;

  requireEnum(status, VALID_STATUSES, 'status');

  const id = uuidv4();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO cost_control (
         id, booking_id, service_id, supplier_id, client_id, description,
         amount, currency, buying_exchange_rate,
         invoice_number, invoice_date, due_date, status,
         selling_price, selling_currency, selling_exchange_rate,
         selling_invoice_number, selling_invoice_date,
         quantity, created_by
       ) VALUES (?,?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?, ?,?, ?,?)`,
      [
        id, booking_id, service_id, supplier_id ?? null, client_id ?? null, description ?? null,
        amount ?? 0, currency || 'USD', buying_exchange_rate ?? 1,
        invoice_number ?? null, invoice_date ?? null, due_date ?? null, status || 'Pending',
        selling_price ?? 0, selling_currency || 'USD', selling_exchange_rate ?? 1,
        selling_invoice_number ?? null, selling_invoice_date ?? null,
        quantity ?? 1, created_by ?? null,
      ]
    );
    const afterRow = await snapshotRow(conn, 'cost_control', id);
    await logAudit(conn, { tableName: 'cost_control', rowId: id, action: 'INSERT', actor: req.user, after: afterRow });
    await conn.commit();
    res.status(201).json({ id, message: 'Cost entry created' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const {
    booking_id, service_id, supplier_id, client_id, description,
    amount, currency, buying_exchange_rate,
    invoice_number, invoice_date, due_date, status,
    selling_price, selling_currency, selling_exchange_rate,
    selling_invoice_number, selling_invoice_date,
    quantity, is_locked, last_modified_by,
  } = req.body;

  requireEnum(status, VALID_STATUSES, 'status');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const beforeRow = await snapshotRow(conn, 'cost_control', req.params.id);
    const [result] = await conn.query(
      `UPDATE cost_control SET
         booking_id=?, service_id=?, supplier_id=?, client_id=?, description=?,
         amount=?, currency=?, buying_exchange_rate=?,
         invoice_number=?, invoice_date=?, due_date=?, status=?,
         selling_price=?, selling_currency=?, selling_exchange_rate=?,
         selling_invoice_number=?, selling_invoice_date=?,
         quantity=?, is_locked=?, last_modified_by=?, last_modified_at=NOW()
       WHERE id=?`,
      [
        booking_id, service_id, supplier_id ?? null, client_id ?? null, description ?? null,
        amount ?? 0, currency || 'USD', buying_exchange_rate ?? 1,
        invoice_number ?? null, invoice_date ?? null, due_date ?? null, status ?? 'Pending',
        selling_price ?? 0, selling_currency || 'USD', selling_exchange_rate ?? 1,
        selling_invoice_number ?? null, selling_invoice_date ?? null,
        quantity ?? 1, is_locked ? 1 : 0, last_modified_by ?? null, req.params.id,
      ]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      throw new AppError(404, 'Entry not found', 'NOT_FOUND');
    }
    const afterRow = await snapshotRow(conn, 'cost_control', req.params.id);
    await logAudit(conn, { tableName: 'cost_control', rowId: req.params.id, action: 'UPDATE', actor: req.user, before: beforeRow, after: afterRow });
    await conn.commit();
    res.json({ message: 'Cost entry updated' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const beforeRow = await snapshotRow(conn, 'cost_control', req.params.id);
    const [result] = await conn.query('DELETE FROM cost_control WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      throw new AppError(404, 'Entry not found', 'NOT_FOUND');
    }
    await logAudit(conn, { tableName: 'cost_control', rowId: req.params.id, action: 'DELETE', actor: req.user, before: beforeRow });
    await conn.commit();
    res.json({ message: 'Cost entry deleted' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
