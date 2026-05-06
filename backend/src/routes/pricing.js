const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const VALID_MODES    = ['FCL','LCL','FTL','LTL','AIR','PARCEL','RAIL','BULK','SPECIAL'];
const VALID_STATUSES = ['Open','Quoting','Offers Received','Rate Selected','Closed'];
const VALID_QUOTE_STATUSES = ['Received','Accepted','Declined','Expired'];
const VALID_CALC_TYPES = ['per_unit','per_weight','per_volume','whichever_greater','custom'];

// ── Number generators ─────────────────────────────────────────

async function nextLoadNumber() {
  const year = new Date().getFullYear();
  const prefix = `LOAD-${year}-`;
  const [rows] = await db.query(
    `SELECT load_number FROM pricing_loads WHERE load_number LIKE ? ORDER BY load_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  const max = rows.length ? parseInt(rows[0].load_number.split('-')[2], 10) : 0;
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

async function nextContractNumber() {
  const year = new Date().getFullYear();
  const prefix = `CTR-${year}-`;
  const [rows] = await db.query(
    `SELECT contract_number FROM pricing_contracts WHERE contract_number LIKE ? ORDER BY contract_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  const max = rows.length ? parseInt(rows[0].contract_number.split('-')[2], 10) : 0;
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

// ── Available Loads ───────────────────────────────────────────

router.get('/loads/next-number', asyncHandler(async (_req, res) => {
  res.json({ load_number: await nextLoadNumber() });
}));

router.get('/loads', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT pl.*,
      (SELECT COUNT(*) FROM pricing_quotes pq WHERE pq.load_id = pl.id) AS quote_count
    FROM pricing_loads pl
    ORDER BY pl.created_at DESC
  `);
  res.json(rows);
}));

router.get('/loads/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM pricing_loads WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Load not found', 'NOT_FOUND');
  const load = rows[0];
  const [quotes] = await db.query(
    'SELECT * FROM pricing_quotes WHERE load_id = ? ORDER BY created_at ASC',
    [req.params.id]
  );
  load.quotes = quotes;
  res.json(load);
}));

router.post('/loads', asyncHandler(async (req, res) => {
  const {
    load_number, client_id, client_name, sales_person, related_quotation_id, related_booking_id,
    transport_mode, origin, destination, equipment_type, quantity, volume_cbm, weight_kg,
    cargo_nature, hazardous, incoterm, required_date, status, sales_notes, pricing_notes, created_by
  } = req.body;

  const id = uuidv4();
  const resolvedNumber = load_number || (await nextLoadNumber());

  await db.query(
    `INSERT INTO pricing_loads
       (id, load_number, client_id, client_name, sales_person, related_quotation_id, related_booking_id,
        transport_mode, origin, destination, equipment_type, quantity, volume_cbm, weight_kg,
        cargo_nature, hazardous, incoterm, required_date, status, sales_notes, pricing_notes, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, resolvedNumber, client_id ?? null, client_name ?? null, sales_person ?? null,
     related_quotation_id ?? null, related_booking_id ?? null,
     transport_mode || 'FCL', origin ?? null, destination ?? null, equipment_type ?? null,
     quantity ?? 1, volume_cbm ?? null, weight_kg ?? null, cargo_nature ?? null,
     hazardous ? 1 : 0, incoterm ?? null, required_date ?? null,
     status || 'Open', sales_notes ?? null, pricing_notes ?? null, created_by ?? null]
  );
  res.status(201).json({ id, load_number: resolvedNumber, message: 'Load created' });
}));

router.put('/loads/:id', asyncHandler(async (req, res) => {
  const {
    client_id, client_name, sales_person, related_quotation_id, related_booking_id,
    transport_mode, origin, destination, equipment_type, quantity, volume_cbm, weight_kg,
    cargo_nature, hazardous, incoterm, required_date, status, sales_notes, pricing_notes,
    posted_date, closed_date, selected_quote_id
  } = req.body;

  const [result] = await db.query(
    `UPDATE pricing_loads SET
       client_id=?, client_name=?, sales_person=?, related_quotation_id=?, related_booking_id=?,
       transport_mode=?, origin=?, destination=?, equipment_type=?, quantity=?, volume_cbm=?, weight_kg=?,
       cargo_nature=?, hazardous=?, incoterm=?, required_date=?, status=?,
       sales_notes=?, pricing_notes=?, posted_date=?, closed_date=?, selected_quote_id=?
     WHERE id=?`,
    [client_id ?? null, client_name ?? null, sales_person ?? null,
     related_quotation_id ?? null, related_booking_id ?? null,
     transport_mode || 'FCL', origin ?? null, destination ?? null, equipment_type ?? null,
     quantity ?? 1, volume_cbm ?? null, weight_kg ?? null, cargo_nature ?? null,
     hazardous ? 1 : 0, incoterm ?? null, required_date ?? null, status || 'Open',
     sales_notes ?? null, pricing_notes ?? null, posted_date ?? null, closed_date ?? null,
     selected_quote_id ?? null, req.params.id]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Load not found', 'NOT_FOUND');
  res.json({ message: 'Load updated' });
}));

router.delete('/loads/:id', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM pricing_loads WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Load not found', 'NOT_FOUND');
  res.json({ message: 'Load deleted' });
}));

// ── Quotes for a Load ────────────────────────────────────────

router.post('/loads/:id/quotes', asyncHandler(async (req, res) => {
  const {
    supplier_id, supplier_name, carrier_name, transport_mode,
    offered_rate, currency, base_rate, total_rate,
    transit_days, validity_date, equipment_available_date, remarks, received_date
  } = req.body;

  const id = uuidv4();
  await db.query(
    `INSERT INTO pricing_quotes
       (id, load_id, supplier_id, supplier_name, carrier_name, transport_mode,
        offered_rate, currency, base_rate, total_rate,
        transit_days, validity_date, equipment_available_date, remarks, received_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, req.params.id, supplier_id ?? null, supplier_name ?? null, carrier_name ?? null,
     transport_mode ?? null, offered_rate ?? null, currency || 'USD', base_rate ?? null, total_rate ?? null,
     transit_days ?? null, validity_date ?? null, equipment_available_date ?? null,
     remarks ?? null, received_date ?? new Date().toISOString().split('T')[0]]
  );

  // Auto-update load status to 'Offers Received' if it was 'Quoting'
  await db.query(
    `UPDATE pricing_loads SET status = 'Offers Received'
     WHERE id = ? AND status IN ('Quoting', 'Open')`,
    [req.params.id]
  );

  res.status(201).json({ id, message: 'Quote added' });
}));

router.put('/loads/:loadId/quotes/:quoteId', asyncHandler(async (req, res) => {
  const { status, decline_reason, responded_by } = req.body;
  if (!VALID_QUOTE_STATUSES.includes(status)) {
    throw new AppError(400, 'Invalid quote status', 'INVALID_STATUS');
  }

  const [result] = await db.query(
    `UPDATE pricing_quotes SET status=?, decline_reason=?, responded_by=?, responded_date=CURDATE()
     WHERE id=? AND load_id=?`,
    [status, decline_reason ?? null, responded_by ?? null, req.params.quoteId, req.params.loadId]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Quote not found', 'NOT_FOUND');

  // If accepted, update load status to 'Rate Selected' and record selected quote
  if (status === 'Accepted') {
    await db.query(
      `UPDATE pricing_loads SET status='Rate Selected', selected_quote_id=? WHERE id=?`,
      [req.params.quoteId, req.params.loadId]
    );
  }
  res.json({ message: 'Quote updated' });
}));

router.delete('/loads/:loadId/quotes/:quoteId', asyncHandler(async (req, res) => {
  const [result] = await db.query(
    'DELETE FROM pricing_quotes WHERE id = ? AND load_id = ?',
    [req.params.quoteId, req.params.loadId]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Quote not found', 'NOT_FOUND');
  res.json({ message: 'Quote deleted' });
}));

// ── Contracts ────────────────────────────────────────────────

router.get('/contracts/next-number', asyncHandler(async (_req, res) => {
  res.json({ contract_number: await nextContractNumber() });
}));

router.get('/contracts', asyncHandler(async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM pricing_contracts ORDER BY created_at DESC');
  res.json(rows);
}));

router.post('/contracts', asyncHandler(async (req, res) => {
  const {
    contract_number, supplier_id, supplier_name, transport_mode, origin, destination,
    equipment_type, service_level, base_rate, currency, total_rate,
    valid_from, valid_to, transit_days, frequency, notes, is_active, created_by
  } = req.body;

  const id = uuidv4();
  const resolvedNumber = contract_number || (await nextContractNumber());

  await db.query(
    `INSERT INTO pricing_contracts
       (id, contract_number, supplier_id, supplier_name, transport_mode, origin, destination,
        equipment_type, service_level, base_rate, currency, total_rate,
        valid_from, valid_to, transit_days, frequency, notes, is_active, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, resolvedNumber, supplier_id ?? null, supplier_name ?? null,
     transport_mode || 'FCL', origin ?? null, destination ?? null,
     equipment_type ?? null, service_level ?? null, base_rate ?? null, currency || 'USD', total_rate ?? null,
     valid_from ?? null, valid_to ?? null, transit_days ?? null, frequency ?? null, notes ?? null,
     is_active !== undefined ? (is_active ? 1 : 0) : 1, created_by ?? null]
  );
  res.status(201).json({ id, contract_number: resolvedNumber, message: 'Contract created' });
}));

router.put('/contracts/:id', asyncHandler(async (req, res) => {
  const {
    supplier_id, supplier_name, transport_mode, origin, destination,
    equipment_type, service_level, base_rate, currency, total_rate,
    valid_from, valid_to, transit_days, frequency, notes, is_active
  } = req.body;

  const [result] = await db.query(
    `UPDATE pricing_contracts SET
       supplier_id=?, supplier_name=?, transport_mode=?, origin=?, destination=?,
       equipment_type=?, service_level=?, base_rate=?, currency=?, total_rate=?,
       valid_from=?, valid_to=?, transit_days=?, frequency=?, notes=?, is_active=?
     WHERE id=?`,
    [supplier_id ?? null, supplier_name ?? null, transport_mode || 'FCL', origin ?? null, destination ?? null,
     equipment_type ?? null, service_level ?? null, base_rate ?? null, currency || 'USD', total_rate ?? null,
     valid_from ?? null, valid_to ?? null, transit_days ?? null, frequency ?? null, notes ?? null,
     is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Contract not found', 'NOT_FOUND');
  res.json({ message: 'Contract updated' });
}));

router.delete('/contracts/:id', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM pricing_contracts WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Contract not found', 'NOT_FOUND');
  res.json({ message: 'Contract deleted' });
}));

// ── Pricing Models ────────────────────────────────────────────

router.get('/models', asyncHandler(async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM pricing_models ORDER BY created_at DESC');
  res.json(rows);
}));

router.post('/models', asyncHandler(async (req, res) => {
  const {
    model_name, transport_mode, calculation_type, base_unit, description,
    minimum_charge, default_validity_days, rounding_rule, is_active, created_by
  } = req.body;
  if (!model_name) throw new AppError(400, 'model_name is required', 'MISSING_FIELDS');

  const id = uuidv4();
  await db.query(
    `INSERT INTO pricing_models
       (id, model_name, transport_mode, calculation_type, base_unit, description,
        minimum_charge, default_validity_days, rounding_rule, is_active, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, model_name, transport_mode || 'FCL', calculation_type || 'per_unit',
     base_unit ?? null, description ?? null, minimum_charge ?? null,
     default_validity_days ?? 30, rounding_rule ?? null,
     is_active !== undefined ? (is_active ? 1 : 0) : 1, created_by ?? null]
  );
  res.status(201).json({ id, message: 'Pricing model created' });
}));

router.put('/models/:id', asyncHandler(async (req, res) => {
  const {
    model_name, transport_mode, calculation_type, base_unit, description,
    minimum_charge, default_validity_days, rounding_rule, is_active
  } = req.body;

  const [result] = await db.query(
    `UPDATE pricing_models SET
       model_name=?, transport_mode=?, calculation_type=?, base_unit=?, description=?,
       minimum_charge=?, default_validity_days=?, rounding_rule=?, is_active=?
     WHERE id=?`,
    [model_name, transport_mode || 'FCL', calculation_type || 'per_unit',
     base_unit ?? null, description ?? null, minimum_charge ?? null,
     default_validity_days ?? 30, rounding_rule ?? null,
     is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Model not found', 'NOT_FOUND');
  res.json({ message: 'Model updated' });
}));

router.delete('/models/:id', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM pricing_models WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Model not found', 'NOT_FOUND');
  res.json({ message: 'Model deleted' });
}));

module.exports = router;
