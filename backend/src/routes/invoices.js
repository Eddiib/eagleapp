const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireEnum, requireNumber, requireDate, requireUUID, requireArray } = require('../middleware/validate');
const { logAudit, snapshotRow } = require('../lib/audit');

const VALID_TYPES    = ['Sales', 'Purchase', 'Credit Note'];
const VALID_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Void'];

// ── GET /next-number ──────────────────────────────────────────────────────────
router.get('/next-number', asyncHandler(async (_req, res) => {
  const year   = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const [rows] = await db.query(
    `SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let seq = 1;
  if (rows.length) {
    const last = rows[0].invoice_number.replace(prefix, '');
    const n    = parseInt(last, 10);
    if (!isNaN(n)) seq = n + 1;
  }
  res.json({ nextNumber: `${prefix}${String(seq).padStart(4, '0')}` });
}));

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT i.*,
      p.company_legal_name AS client_name,
      p.trading_name       AS client_trading_name,
      b.booking_number
    FROM invoices i
    LEFT JOIN partners p ON i.client_id  = p.id
    LEFT JOIN bookings b ON i.booking_id = b.id
    ORDER BY i.invoice_date DESC, i.created_at DESC
  `);
  res.json(rows);
}));

// ── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const [[invoice]] = await db.query(`
    SELECT i.*,
      p.company_legal_name AS client_name,
      p.trading_name       AS client_trading_name,
      b.booking_number
    FROM invoices i
    LEFT JOIN partners p ON i.client_id  = p.id
    LEFT JOIN bookings b ON i.booking_id = b.id
    WHERE i.id = ?
  `, [req.params.id]);
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');

  const [lines] = await db.query(`
    SELECT il.*, s.service_name, s.service_code
    FROM invoice_lines il
    LEFT JOIN services s ON il.service_id = s.id
    WHERE il.invoice_id = ?
    ORDER BY il.sort_order, il.id
  `, [req.params.id]);

  res.json({ ...invoice, lines });
}));

// ── POST / ────────────────────────────────────────────────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['invoice_number', 'invoice_date']);
  const {
    invoice_number, invoice_type, status, client_id, booking_id,
    invoice_date, due_date, currency, exchange_rate,
    subtotal, vat_amount, total_amount, amount_paid,
    notes, payment_terms, bank_details, created_by,
    lines = [],
  } = req.body;

  requireEnum(invoice_type ?? 'Sales', VALID_TYPES,    'invoice_type');
  requireEnum(status       ?? 'Draft', VALID_STATUSES, 'status');
  requireUUID(client_id,  'client_id');
  requireUUID(booking_id, 'booking_id');
  requireDate(invoice_date, 'invoice_date');
  requireDate(due_date,     'due_date');
  requireNumber(exchange_rate, 'exchange_rate', { min: 0 });
  requireNumber(subtotal,      'subtotal',      { min: 0 });
  requireNumber(vat_amount,    'vat_amount',    { min: 0 });
  requireNumber(total_amount,  'total_amount',  { min: 0 });
  requireNumber(amount_paid,   'amount_paid',   { min: 0 });
  requireArray(lines, 'lines');

  const id = uuidv4();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO invoices (id, invoice_number, invoice_type, status, client_id, booking_id,
         invoice_date, due_date, currency, exchange_rate,
         subtotal, vat_amount, total_amount, amount_paid,
         notes, payment_terms, bank_details, created_by)
       VALUES (?,?,?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?,?,?)`,
      [
        id, invoice_number, invoice_type ?? 'Sales', status ?? 'Draft',
        client_id ?? null, booking_id ?? null,
        invoice_date, due_date ?? null, currency ?? 'USD', exchange_rate ?? 1,
        subtotal ?? 0, vat_amount ?? 0, total_amount ?? 0, amount_paid ?? 0,
        notes ?? null, payment_terms ?? null, bank_details ?? null, created_by ?? null,
      ]
    );

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await conn.query(
        `INSERT INTO invoice_lines (id, invoice_id, sort_order, service_id, description, quantity, unit_price, vat_rate, currency)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), id, i, l.service_id ?? null, l.description ?? '', l.quantity ?? 1, l.unit_price ?? 0, l.vat_rate ?? 0, l.currency ?? currency ?? 'USD']
      );
    }

    const afterRow = await snapshotRow(conn, 'invoices', id);
    await logAudit(conn, { tableName: 'invoices', rowId: id, action: 'INSERT', actor: req.user, after: afterRow });

    await conn.commit();
    res.status(201).json({ id, message: 'Invoice created' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// ── PUT /:id ──────────────────────────────────────────────────────────────────
router.put('/:id', asyncHandler(async (req, res) => {
  const {
    invoice_number, invoice_type, status, client_id, booking_id,
    invoice_date, due_date, currency, exchange_rate,
    subtotal, vat_amount, total_amount, amount_paid,
    notes, payment_terms, bank_details, last_modified_by,
    lines = [],
  } = req.body;

  requireEnum(invoice_type ?? 'Sales', VALID_TYPES,    'invoice_type');
  requireEnum(status       ?? 'Draft', VALID_STATUSES, 'status');
  requireUUID(client_id,  'client_id');
  requireUUID(booking_id, 'booking_id');
  requireDate(invoice_date, 'invoice_date');
  requireDate(due_date,     'due_date');
  requireNumber(exchange_rate, 'exchange_rate', { min: 0 });
  requireNumber(subtotal,      'subtotal',      { min: 0 });
  requireNumber(vat_amount,    'vat_amount',    { min: 0 });
  requireNumber(total_amount,  'total_amount',  { min: 0 });
  requireNumber(amount_paid,   'amount_paid',   { min: 0 });
  requireArray(lines, 'lines');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const beforeRow = await snapshotRow(conn, 'invoices', req.params.id);

    const [result] = await conn.query(
      `UPDATE invoices SET
         invoice_number=?, invoice_type=?, status=?, client_id=?, booking_id=?,
         invoice_date=?, due_date=?, currency=?, exchange_rate=?,
         subtotal=?, vat_amount=?, total_amount=?, amount_paid=?,
         notes=?, payment_terms=?, bank_details=?, last_modified_by=?
       WHERE id=?`,
      [
        invoice_number, invoice_type ?? 'Sales', status ?? 'Draft',
        client_id ?? null, booking_id ?? null,
        invoice_date, due_date ?? null, currency ?? 'USD', exchange_rate ?? 1,
        subtotal ?? 0, vat_amount ?? 0, total_amount ?? 0, amount_paid ?? 0,
        notes ?? null, payment_terms ?? null, bank_details ?? null,
        last_modified_by ?? null, req.params.id,
      ]
    );
    if (result.affectedRows === 0) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');

    await conn.query('DELETE FROM invoice_lines WHERE invoice_id = ?', [req.params.id]);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      await conn.query(
        `INSERT INTO invoice_lines (id, invoice_id, sort_order, service_id, description, quantity, unit_price, vat_rate, currency)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), req.params.id, i, l.service_id ?? null, l.description ?? '', l.quantity ?? 1, l.unit_price ?? 0, l.vat_rate ?? 0, l.currency ?? currency ?? 'USD']
      );
    }

    const afterRow = await snapshotRow(conn, 'invoices', req.params.id);
    await logAudit(conn, { tableName: 'invoices', rowId: req.params.id, action: 'UPDATE', actor: req.user, before: beforeRow, after: afterRow });

    await conn.commit();
    res.json({ message: 'Invoice updated' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// ── DELETE /:id ───────────────────────────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const beforeRow = await snapshotRow(conn, 'invoices', req.params.id);
    const [result] = await conn.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    }
    await logAudit(conn, { tableName: 'invoices', rowId: req.params.id, action: 'DELETE', actor: req.user, before: beforeRow });
    await conn.commit();
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
