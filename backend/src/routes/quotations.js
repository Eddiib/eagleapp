const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireUUID, requireDate, requireNumber, requireArray } = require('../middleware/validate');

const VALID_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

function validateServiceLines(services) {
  if (!Array.isArray(services)) throw new AppError(400, 'services must be an array', 'INVALID_PAYLOAD');
  services.forEach((s, i) => {
    if (!s.service_id) throw new AppError(400, `services[${i}].service_id is required`, 'INVALID_LINE_ITEM');
  });
}

// P1.6: when a quotation is created for a partner that has exactly one pre-quoted
// sales lead (status New or Contacted), advance it to 'Quoted'. If zero or multiple
// candidates match, leave it alone — fuzzy match, safe default.
async function advanceLeadOnQuotation(conn, clientId) {
  if (!clientId) return;
  const [leads] = await conn.query(
    `SELECT id, lead_status FROM sales_leads
      WHERE partner_id = ? AND lead_status IN ('New','Contacted')`,
    [clientId]
  );
  if (leads.length !== 1) return;
  await conn.query(
    'UPDATE sales_leads SET lead_status = ?, last_contact_date = CURRENT_DATE() WHERE id = ?',
    ['Quoted', leads[0].id]
  );
}

// GET all quotations
router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT q.*, p.company_legal_name AS client_name, COUNT(qs.id) AS service_count
    FROM quotations q
    LEFT JOIN partners p ON q.client_id = p.id
    LEFT JOIN quotation_services qs ON qs.quotation_id = q.id
    GROUP BY q.id
    ORDER BY q.created_date DESC
  `);
  res.json(rows);
}));

// GET single quotation (with services)
router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT q.*, p.company_legal_name AS client_name
    FROM quotations q
    LEFT JOIN partners p ON q.client_id = p.id
    WHERE q.id = ?
  `, [req.params.id]);

  if (!rows.length) throw new AppError(404, 'Quotation not found', 'NOT_FOUND');

  const quotation = rows[0];
  const [services] = await db.query(`
    SELECT qs.*, s.service_name, s.service_code, p.company_legal_name AS supplier_name
    FROM quotation_services qs
    LEFT JOIN services s ON qs.service_id = s.id
    LEFT JOIN partners p ON qs.supplier_id = p.id
    WHERE qs.quotation_id = ?
  `, [req.params.id]);

  quotation.services = services;
  res.json(quotation);
}));

// POST create quotation
router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['quote_number', 'client_id']);

  const {
    quote_number, status, client_id, mode_of_transport, origin_country, origin_port,
    destination_country, destination_port, valid_until, total_sell, total_cost,
    currency, notes, rejection_reason, created_by, services = []
  } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError(400, `Invalid status: ${status}`, 'INVALID_STATUS');
  }
  requireUUID(client_id, 'client_id');
  requireDate(valid_until, 'valid_until');
  requireNumber(total_sell, 'total_sell', { min: 0 });
  requireNumber(total_cost, 'total_cost', { min: 0 });
  requireArray(services, 'services');
  validateServiceLines(services);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const id = uuidv4();

    await conn.query(
      `INSERT INTO quotations (id, quote_number, status, client_id, mode_of_transport,
        origin_country, origin_port, destination_country, destination_port, valid_until,
        total_sell, total_cost, currency, notes, rejection_reason, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, quote_number, status || 'Draft', client_id, mode_of_transport ?? null,
        origin_country ?? null, origin_port ?? null, destination_country ?? null,
        destination_port ?? null, valid_until ?? null,
        total_sell ?? 0, total_cost ?? 0, currency || 'USD', notes ?? null,
        rejection_reason ?? null, created_by ?? null]
    );

    for (const svc of services) {
      await conn.query(
        `INSERT INTO quotation_services
           (id, quotation_id, service_id, supplier_id, quantity, cost_price, sell_price, currency, notes)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), id, svc.service_id, svc.supplier_id ?? null,
          svc.quantity ?? 1, svc.cost_price ?? 0, svc.sell_price ?? 0,
          svc.currency || 'USD', svc.notes ?? null]
      );
    }

    // P1.6: auto-advance the matching sales lead to 'Quoted', if exactly one candidate exists.
    await advanceLeadOnQuotation(conn, client_id);

    await conn.commit();
    res.status(201).json({ id, message: 'Quotation created' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// PUT update quotation
router.put('/:id', asyncHandler(async (req, res) => {
  const {
    status, client_id, mode_of_transport, origin_country, origin_port,
    destination_country, destination_port, valid_until, total_sell, total_cost,
    currency, notes, rejection_reason, services = []
  } = req.body;

  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError(400, `Invalid status: ${status}`, 'INVALID_STATUS');
  }
  requireUUID(client_id, 'client_id');
  requireDate(valid_until, 'valid_until');
  requireNumber(total_sell, 'total_sell', { min: 0 });
  requireNumber(total_cost, 'total_cost', { min: 0 });
  requireArray(services, 'services');
  validateServiceLines(services);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `UPDATE quotations SET
         status=?, client_id=?, mode_of_transport=?, origin_country=?, origin_port=?,
         destination_country=?, destination_port=?, valid_until=?, total_sell=?, total_cost=?,
         currency=?, notes=?, rejection_reason=?
       WHERE id=?`,
      [status, client_id, mode_of_transport ?? null, origin_country ?? null, origin_port ?? null,
        destination_country ?? null, destination_port ?? null, valid_until ?? null,
        total_sell ?? 0, total_cost ?? 0, currency || 'USD', notes ?? null,
        rejection_reason ?? null, req.params.id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      throw new AppError(404, 'Quotation not found', 'NOT_FOUND');
    }

    await conn.query('DELETE FROM quotation_services WHERE quotation_id = ?', [req.params.id]);
    for (const svc of services) {
      await conn.query(
        `INSERT INTO quotation_services
           (id, quotation_id, service_id, supplier_id, quantity, cost_price, sell_price, currency, notes)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), req.params.id, svc.service_id, svc.supplier_id ?? null,
          svc.quantity ?? 1, svc.cost_price ?? 0, svc.sell_price ?? 0,
          svc.currency || 'USD', svc.notes ?? null]
      );
    }

    await conn.commit();
    res.json({ message: 'Quotation updated' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// DELETE quotation
router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM quotations WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Quotation not found', 'NOT_FOUND');
  res.json({ message: 'Quotation deleted' });
}));

module.exports = router;
