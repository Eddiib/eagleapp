const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireUUID, requireDate, requireArray } = require('../middleware/validate');
const { logAudit, snapshotRow } = require('../lib/audit');
const { getDefaultCurrency } = require('../lib/companySettings');
const { canAccess } = require('../lib/permissions');

const REASSIGN_AGENT_PERMISSION = 'edit:booking-agent-assignment';

// Booking statuses are configurable (see booking_statuses table / Settings),
// so the allowed set is read from the DB rather than a hardcoded list.
async function loadActiveStatusNames(conn = db) {
  const [rows] = await conn.query(
    'SELECT name FROM booking_statuses WHERE is_active = 1 ORDER BY sort_order, name',
  );
  return rows.map((r) => r.name);
}

const VALID_MODES = ['FCL', 'LCL', 'Air', 'Road'];
const VALID_INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const VALID_BL_TYPES = ['Bill of Lading', 'Telex Release', 'Seaway bill'];
const VALID_BL_STATUSES = ['Pending', 'Confirmed'];
const VALID_FREIGHT_TERMS = ['Prepaid', 'Collect', 'Prepaid & Collect'];
const VALID_CARGO_NATURES = ['General Cargo', 'IMO', 'Food Stuff', 'Reefer', 'Break Bulk'];
const BOOKING_NUMBER_PREFIX = 'ESH';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

function checkOptionalEnum(value, allowed, fieldName) {
  if (value === undefined || value === null || value === '') return;
  if (!allowed.includes(value)) {
    throw new AppError(400, `Invalid ${fieldName}: must be one of ${allowed.join(', ')}`, 'INVALID_ENUM');
  }
}

function checkOptionalUuid(value, fieldName) {
  if (value === undefined || value === null || value === '') return;
  if (!isUuid(value)) {
    throw new AppError(400, `Invalid ${fieldName}: must be a UUID`, 'INVALID_UUID');
  }
}

// Date ordering — silent if any date is missing.
function validateDateOrdering(header) {
  const { etd, eta, cargo_readiness_date } = header;
  if (etd && eta && new Date(eta) < new Date(etd)) {
    throw new AppError(400, 'ETA cannot be earlier than ETD', 'INVALID_DATE_ORDER');
  }
  if (etd && cargo_readiness_date && new Date(cargo_readiness_date) > new Date(etd)) {
    throw new AppError(400, 'Cargo readiness date must be on or before ETD', 'INVALID_DATE_ORDER');
  }
}

// Derive booking totals from line items so the value can never drift away from
// what the equipment-service rows actually carry. Top-level `services` are
// included for forward compatibility (currently unused in the UI).
function computeTotalsFromPayload(services, equipment) {
  let total_revenue = 0;
  let total_cost = 0;
  for (const s of services || []) {
    total_revenue += Number(s.total_price) || 0;
  }
  for (const eq of equipment || []) {
    for (const es of eq.equipment_services || []) {
      total_revenue += Number(es.agreed_rate) || 0;
      total_cost    += Number(es.agreed_cost) || 0;
    }
  }
  return { total_revenue, total_cost };
}

// Columns writable from the booking form / header. Mirrors the approved UI.
const HEADER_COLUMNS = [
  'status', 'mode_of_transport', 'client_id', 'carrier_id', 'shipper_id', 'consignee_id',
  'origin_country', 'origin_port', 'destination_country', 'destination_port',
  'etd', 'eta', 'commodity', 'incoterm',
  'total_revenue', 'total_cost', 'currency', 'notes',
  // Phase 5 header panel additions:
  'booking_date', 'carrier_ref', 'supplier_ref',
  'master_bl', 'house_bl', 'bl_type', 'bl_status',
  'freight_terms', 'notify_party_id',
  'place_of_loading_city', 'place_of_loading_country', 'final_destination', 'final_destination_country',
  'cargo_readiness_date', 'cargo_nature',
  'internal_notes', 'free_text_comments',
  // Lineage (migration 013): where this booking came from.
  'source_sales_lead_id', 'source_quotation_id',
  // Assigned agent (migration 023): defaults to the creator's linked employee,
  // overridable only by roles that hold `edit:booking-agent-assignment`.
  'assigned_agent_id',
];

function formatBookingNumber(sequence) {
  return `${BOOKING_NUMBER_PREFIX}${String(sequence).padStart(4, '0')}`;
}

function parseBookingNumberSequence(bookingNumber) {
  if (typeof bookingNumber !== 'string') return 0;
  const match = bookingNumber.trim().match(/^ESH(\d+)$/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

async function getNextBookingNumber(conn) {
  const [rows] = await conn.query(`
    SELECT booking_number
      FROM bookings
     WHERE booking_number REGEXP '^ESH[0-9]+$'
  ORDER BY CAST(SUBSTRING(booking_number, 4) AS UNSIGNED) DESC
     LIMIT 1
  `);
  const lastSequence = rows.length ? parseBookingNumberSequence(rows[0].booking_number) : 0;
  return formatBookingNumber(lastSequence + 1);
}

function validateLineItems(services, equipment) {
  if (!Array.isArray(services)) throw new AppError(400, 'services must be an array', 'INVALID_PAYLOAD');
  if (!Array.isArray(equipment)) throw new AppError(400, 'equipment must be an array', 'INVALID_PAYLOAD');
  services.forEach((s, i) => {
    if (!s.service_id) throw new AppError(400, `services[${i}].service_id is required`, 'INVALID_LINE_ITEM');
    checkOptionalUuid(s.service_id,  `services[${i}].service_id`);
    checkOptionalUuid(s.supplier_id, `services[${i}].supplier_id`);
  });
  equipment.forEach((e, i) => {
    checkOptionalUuid(e.equipment_id, `equipment[${i}].equipment_id`);
    checkOptionalUuid(e.carrier_id,   `equipment[${i}].carrier_id`);
    (e.equipment_services || []).forEach((s, j) => {
      checkOptionalUuid(s.service_id,        `equipment[${i}].equipment_services[${j}].service_id`);
      checkOptionalUuid(s.equipment_id,      `equipment[${i}].equipment_services[${j}].equipment_id`);
      checkOptionalUuid(s.invoice_party_id,  `equipment[${i}].equipment_services[${j}].invoice_party_id`);
      checkOptionalUuid(s.supplier_id,       `equipment[${i}].equipment_services[${j}].supplier_id`);
    });
  });
}

function validateShippers(shippers) {
  if (!Array.isArray(shippers)) {
    throw new AppError(400, 'shippers must be an array', 'INVALID_PAYLOAD');
  }
  shippers.forEach((s, i) => {
    const id = typeof s === 'string' ? s : s?.shipper_id;
    if (!id) throw new AppError(400, `shippers[${i}].shipper_id is required`, 'INVALID_SHIPPER');
  });
}

function shipperIdsFromInput(shippers) {
  return shippers
    .map(s => (typeof s === 'string' ? s : s?.shipper_id))
    .filter(Boolean);
}

function toDateString(value) {
  if (!value) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeBookingDates(row) {
  row.booking_date = toDateString(row.booking_date);
  row.etd = toDateString(row.etd);
  row.eta = toDateString(row.eta);
  row.cargo_readiness_date = toDateString(row.cargo_readiness_date);
  return row;
}

async function loadShippersFor(conn, bookingIds) {
  if (!bookingIds.length) return {};
  const [rows] = await conn.query(`
    SELECT bs.booking_id, bs.shipper_id, bs.sort_order, p.company_legal_name AS shipper_name
      FROM booking_shippers bs
      LEFT JOIN partners p ON p.id = bs.shipper_id
     WHERE bs.booking_id IN (?)
  ORDER BY bs.booking_id, bs.sort_order
  `, [bookingIds]);
  return rows.reduce((acc, r) => {
    (acc[r.booking_id] = acc[r.booking_id] || []).push({
      shipper_id: r.shipper_id,
      shipper_name: r.shipper_name,
      sort_order: r.sort_order,
    });
    return acc;
  }, {});
}

async function loadEquipmentServicesFor(conn, equipmentRowIds) {
  if (!equipmentRowIds.length) return {};
  const [rows] = await conn.query(`
    SELECT bes.*,
           s.service_name, s.service_code,
           inv.company_legal_name AS invoice_party_name,
           sup.company_legal_name AS supplier_name,
           eq.equipment_name, eq.equipment_code
      FROM booking_equipment_services bes
      LEFT JOIN services   s   ON s.id   = bes.service_id
      LEFT JOIN partners   inv ON inv.id = bes.invoice_party_id
      LEFT JOIN partners   sup ON sup.id = bes.supplier_id
      LEFT JOIN equipment  eq  ON eq.id  = bes.equipment_id
     WHERE bes.equipment_row_id IN (?)
  ORDER BY bes.equipment_row_id, bes.sort_order
  `, [equipmentRowIds]);
  return rows.reduce((acc, r) => {
    (acc[r.equipment_row_id] = acc[r.equipment_row_id] || []).push(r);
    return acc;
  }, {});
}

async function loadAttachmentsFor(conn, bookingIds) {
  if (!bookingIds.length) return {};
  const [rows] = await conn.query(`
    SELECT id, booking_id, filename, original_filename, mime_type, size_bytes,
           doc_type, doc_date, uploaded_by, uploaded_at
      FROM booking_attachments
     WHERE booking_id IN (?)
  ORDER BY uploaded_at DESC
  `, [bookingIds]);
  return rows.reduce((acc, r) => {
    (acc[r.booking_id] = acc[r.booking_id] || []).push(r);
    return acc;
  }, {});
}

const BOOKING_SELECT = `
  SELECT b.*,
    c.company_legal_name  AS client_name,
    cr.company_legal_name AS carrier_name,
    s.company_legal_name  AS shipper_name,
    co.company_legal_name AS consignee_name,
    np.company_legal_name AS notify_party_name,
    TRIM(CONCAT_WS(' ', ag.first_name, ag.surname)) AS assigned_agent_name
  FROM bookings b
  LEFT JOIN partners c  ON b.client_id       = c.id
  LEFT JOIN partners cr ON b.carrier_id      = cr.id
  LEFT JOIN partners s  ON b.shipper_id      = s.id
  LEFT JOIN partners co ON b.consignee_id    = co.id
  LEFT JOIN partners np ON b.notify_party_id = np.id
  LEFT JOIN employees ag ON b.assigned_agent_id = ag.id
`;

// GET all bookings (no service line items — kept light for list view)
router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`${BOOKING_SELECT} ORDER BY b.created_date DESC`);

  if (rows.length === 0) return res.json([]);

  const ids = rows.map(r => r.id);
  const [equipment] = await db.query(`
    SELECT be.*, e.equipment_name, e.equipment_code, e.category,
           p.company_legal_name AS carrier_name
    FROM booking_equipment be
    LEFT JOIN equipment e ON be.equipment_id = e.id
    LEFT JOIN partners p  ON be.carrier_id   = p.id
    WHERE be.booking_id IN (?)
  `, [ids]);

  const equipmentMap = equipment.reduce((acc, r) => {
    (acc[r.booking_id] = acc[r.booking_id] || []).push(r);
    return acc;
  }, {});

  const shippersMap = await loadShippersFor(db, ids);

  for (const r of rows) {
    normalizeBookingDates(r);
    r.equipment = equipmentMap[r.id] || [];
    r.services = [];
    r.shippers = shippersMap[r.id] || [];
    r.attachments = [];
  }

  res.json(rows);
}));

router.get('/next-number', asyncHandler(async (_req, res) => {
  const bookingNumber = await getNextBookingNumber(db);
  res.json({ booking_number: bookingNumber });
}));

// GET all bookings WITH equipment + per-equipment services, all batched.
// Powers the flattened Booking Details grid in a single round-trip instead of
// one getById call per booking. Skips booking-level services/attachments which
// the grid doesn't use.
router.get('/detail-grid', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`${BOOKING_SELECT} ORDER BY b.created_date DESC`);
  if (rows.length === 0) return res.json([]);

  const ids = rows.map(r => r.id);
  const [equipment] = await db.query(`
    SELECT be.*, e.equipment_name, e.equipment_code, e.category,
           p.company_legal_name AS carrier_name
    FROM booking_equipment be
    LEFT JOIN equipment e ON be.equipment_id = e.id
    LEFT JOIN partners p  ON be.carrier_id   = p.id
    WHERE be.booking_id IN (?)
  `, [ids]);

  const equipmentMap = equipment.reduce((acc, r) => {
    (acc[r.booking_id] = acc[r.booking_id] || []).push(r);
    return acc;
  }, {});

  // One batched query for the services of every equipment row across all bookings.
  const eqServicesMap = await loadEquipmentServicesFor(db, equipment.map(e => e.id));

  for (const r of rows) {
    normalizeBookingDates(r);
    r.equipment = (equipmentMap[r.id] || []).map(e => ({ ...e, equipmentServices: eqServicesMap[e.id] || [] }));
    r.services = [];
    r.shippers = [];
    r.attachments = [];
  }

  res.json(rows);
}));

// GET single booking with services, equipment, shippers, attachments
router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query(`${BOOKING_SELECT} WHERE b.id = ?`, [req.params.id]);

  if (!rows.length) throw new AppError(404, 'Booking not found', 'NOT_FOUND');

  const booking = rows[0];

  const [services] = await db.query(`
    SELECT bs.*, s.service_name, s.service_code, p.company_legal_name AS supplier_name
    FROM booking_services bs
    LEFT JOIN services s ON bs.service_id = s.id
    LEFT JOIN partners p ON bs.supplier_id = p.id
    WHERE bs.booking_id = ?
  `, [req.params.id]);

  const [equipment] = await db.query(`
    SELECT be.*, e.equipment_name, e.equipment_code, e.category,
           p.company_legal_name AS carrier_name
    FROM booking_equipment be
    LEFT JOIN equipment e ON be.equipment_id = e.id
    LEFT JOIN partners p  ON be.carrier_id   = p.id
    WHERE be.booking_id = ?
  `, [req.params.id]);

  const shippersMap = await loadShippersFor(db, [req.params.id]);
  const attachmentsMap = await loadAttachmentsFor(db, [req.params.id]);

  // Load per-equipment-row services
  const equipmentIds = equipment.map(e => e.id);
  const eqServicesMap = await loadEquipmentServicesFor(db, equipmentIds);

  normalizeBookingDates(booking);
  booking.services = services;
  booking.equipment = equipment.map(e => ({ ...e, equipmentServices: eqServicesMap[e.id] || [] }));
  booking.shippers = shippersMap[req.params.id] || [];
  booking.attachments = attachmentsMap[req.params.id] || [];

  res.json(booking);
}));

function pickHeaderValues(body) {
  const out = {};
  for (const col of HEADER_COLUMNS) {
    out[col] = body[col] === undefined ? null : body[col];
  }
  return out;
}

async function writeShippers(conn, bookingId, shippers) {
  // booking_shippers uses (booking_id, shipper_id) as a natural composite key,
  // so child IDs aren't referenced anywhere — clean wipe + reinsert is fine.
  await conn.query('DELETE FROM booking_shippers WHERE booking_id = ?', [bookingId]);
  const ids = shipperIdsFromInput(shippers);
  for (let i = 0; i < ids.length; i++) {
    await conn.query(
      'INSERT INTO booking_shippers (booking_id, shipper_id, sort_order) VALUES (?,?,?)',
      [bookingId, ids[i], i]
    );
  }
  return ids;
}

// ── Diff-and-merge helpers for booking_services / booking_equipment ──────────
// Existing rows update in place; new rows insert with a fresh UUID; rows missing
// from the payload are deleted. This preserves child IDs across edits so other
// tables (e.g. cost_control rows that join booking_equipment_id) stay intact.

async function reconcileBookingServices(conn, bookingId, incoming, defaultCurrency) {
  const [existing] = await conn.query('SELECT id FROM booking_services WHERE booking_id = ?', [bookingId]);
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set();

  for (const s of incoming) {
    if (s.id && isUuid(s.id) && existingIds.has(s.id)) {
      await conn.query(
        `UPDATE booking_services
            SET service_id=?, supplier_id=?, quantity=?, unit_price=?, total_price=?, currency=?, notes=?
          WHERE id=?`,
        [s.service_id, s.supplier_id || null, s.quantity || 1, s.unit_price || 0,
          s.total_price || 0, s.currency || defaultCurrency, s.notes ?? null, s.id]
      );
      keptIds.add(s.id);
    } else {
      await conn.query(
        `INSERT INTO booking_services
            (id, booking_id, service_id, supplier_id, quantity, unit_price, total_price, currency, notes)
          VALUES (?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), bookingId, s.service_id, s.supplier_id || null, s.quantity || 1,
          s.unit_price || 0, s.total_price || 0, s.currency || defaultCurrency, s.notes ?? null]
      );
    }
  }

  const removed = [...existingIds].filter((id) => !keptIds.has(id));
  if (removed.length) {
    await conn.query('DELETE FROM booking_services WHERE id IN (?)', [removed]);
  }
}

async function reconcileEquipmentServices(conn, bookingId, equipmentRowId, incoming) {
  const [existing] = await conn.query(
    'SELECT id FROM booking_equipment_services WHERE equipment_row_id = ?',
    [equipmentRowId],
  );
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set();

  for (let i = 0; i < incoming.length; i++) {
    const s = incoming[i];
    if (s.id && isUuid(s.id) && existingIds.has(s.id)) {
      await conn.query(
        `UPDATE booking_equipment_services
            SET service_id=?, equipment_id=?, invoice_party_id=?, agreed_rate=?, supplier_id=?, agreed_cost=?, planned_date=?, sort_order=?
          WHERE id=?`,
        [s.service_id || null, s.equipment_id || null, s.invoice_party_id || null, s.agreed_rate ?? null,
          s.supplier_id || null, s.agreed_cost ?? null, s.planned_date || null, i, s.id],
      );
      keptIds.add(s.id);
    } else {
      await conn.query(
        `INSERT INTO booking_equipment_services
            (id, equipment_row_id, booking_id, service_id, equipment_id, invoice_party_id, agreed_rate,
             supplier_id, agreed_cost, planned_date, sort_order)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), equipmentRowId, bookingId, s.service_id || null, s.equipment_id || null,
          s.invoice_party_id || null, s.agreed_rate ?? null,
          s.supplier_id || null, s.agreed_cost ?? null, s.planned_date || null, i],
      );
    }
  }

  const removed = [...existingIds].filter((id) => !keptIds.has(id));
  if (removed.length) {
    await conn.query('DELETE FROM booking_equipment_services WHERE id IN (?)', [removed]);
  }
}

const EQUIPMENT_INSERT_COLUMNS = [
  'equipment_id', 'quantity', 'container_id', 'type_size', 'carrier_id',
  'place_of_loading', 'final_destination', 'etd', 'eta',
  'gross_weight_kg', 'volume_m3', 'packages', 'commodity',
  'net_weight', 'net_weight_unit', 'length_val', 'width_val', 'height_val',
  'dimension_unit', 'total_volume', 'total_density',
];

function equipmentValues(eq) {
  return [
    eq.equipment_id || null, eq.quantity || 1,
    eq.container_id || null, eq.type_size || null, eq.carrier_id || null,
    eq.place_of_loading || null, eq.final_destination || null,
    eq.etd || null, eq.eta || null,
    eq.gross_weight_kg ?? null, eq.volume_m3 ?? null, eq.packages ?? null,
    eq.commodity || null,
    eq.net_weight ?? null, eq.net_weight_unit || 'kg',
    eq.length_val ?? null, eq.width_val ?? null, eq.height_val ?? null,
    eq.dimension_unit || 'cm', eq.total_volume ?? null, eq.total_density ?? null,
  ];
}

async function reconcileBookingEquipment(conn, bookingId, incoming) {
  const [existing] = await conn.query('SELECT id FROM booking_equipment WHERE booking_id = ?', [bookingId]);
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set();

  for (const eq of incoming) {
    let rowId;
    if (eq.id && isUuid(eq.id) && existingIds.has(eq.id)) {
      rowId = eq.id;
      const setClause = EQUIPMENT_INSERT_COLUMNS.map((c) => `${c}=?`).join(', ');
      await conn.query(
        `UPDATE booking_equipment SET ${setClause} WHERE id=?`,
        [...equipmentValues(eq), rowId],
      );
      keptIds.add(rowId);
    } else {
      rowId = uuidv4();
      const cols = ['id', 'booking_id', ...EQUIPMENT_INSERT_COLUMNS];
      const placeholders = cols.map(() => '?').join(',');
      await conn.query(
        `INSERT INTO booking_equipment (${cols.join(',')}) VALUES (${placeholders})`,
        [rowId, bookingId, ...equipmentValues(eq)],
      );
    }
    await reconcileEquipmentServices(conn, bookingId, rowId, eq.equipment_services || []);
  }

  const removed = [...existingIds].filter((id) => !keptIds.has(id));
  if (removed.length) {
    await conn.query('DELETE FROM booking_equipment WHERE id IN (?)', [removed]);
  }
}

async function insertBookingEquipmentForCreate(conn, bookingId, incoming) {
  for (const eq of incoming) {
    const rowId = uuidv4();
    const cols = ['id', 'booking_id', ...EQUIPMENT_INSERT_COLUMNS];
    const placeholders = cols.map(() => '?').join(',');
    await conn.query(
      `INSERT INTO booking_equipment (${cols.join(',')}) VALUES (${placeholders})`,
      [rowId, bookingId, ...equipmentValues(eq)],
    );
    const services = eq.equipment_services || [];
    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      await conn.query(
        `INSERT INTO booking_equipment_services
           (id, equipment_row_id, booking_id, service_id, equipment_id, invoice_party_id, agreed_rate, supplier_id, agreed_cost, planned_date, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [uuidv4(), rowId, bookingId, s.service_id || null, s.equipment_id || null, s.invoice_party_id || null,
          s.agreed_rate ?? null, s.supplier_id || null, s.agreed_cost ?? null, s.planned_date || null, i],
      );
    }
  }
}

// Advance a sales lead forward on the funnel when downstream artefacts are created.
// Only moves forward through New → Contacted → Quoted → Booked, and never touches
// terminal statuses (Lost, Inactive) or a lead that's already past the target.
const LEAD_STATUS_RANK = { New: 0, Contacted: 1, Quoted: 2, Booked: 3 };
async function advanceLeadStatus(conn, leadId, targetStatus) {
  if (!leadId) return;
  const [rows] = await conn.query('SELECT lead_status FROM sales_leads WHERE id = ?', [leadId]);
  if (!rows.length) return;
  const current = rows[0].lead_status;
  const currentRank = LEAD_STATUS_RANK[current];
  const targetRank  = LEAD_STATUS_RANK[targetStatus];
  if (currentRank === undefined || targetRank === undefined) return; // terminal or unknown — leave alone
  if (currentRank >= targetRank) return;
  await conn.query(
    'UPDATE sales_leads SET lead_status = ?, last_contact_date = CURRENT_DATE() WHERE id = ?',
    [targetStatus, leadId]
  );
}

// POST create booking
router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['client_id']);
  requireArray(req.body.services  ?? [], 'services');
  requireArray(req.body.equipment ?? [], 'equipment');
  requireArray(req.body.shippers  ?? [], 'shippers');

  const { services = [], equipment = [], shippers = [] } = req.body;

  const header = pickHeaderValues(req.body);
  // New bookings start in the first configured status (lowest sort order).
  // Clients transition through the rest of the workflow once the row exists.
  const initialStatusNames = await loadActiveStatusNames();
  header.status = initialStatusNames[0] || 'Pending';

  checkOptionalEnum(header.mode_of_transport, VALID_MODES,         'mode_of_transport');
  checkOptionalEnum(header.incoterm,          VALID_INCOTERMS,     'incoterm');
  checkOptionalEnum(header.bl_type,           VALID_BL_TYPES,      'bl_type');
  checkOptionalEnum(header.bl_status,         VALID_BL_STATUSES,   'bl_status');
  checkOptionalEnum(header.freight_terms,     VALID_FREIGHT_TERMS, 'freight_terms');
  checkOptionalEnum(header.cargo_nature,      VALID_CARGO_NATURES, 'cargo_nature');

  requireUUID(header.client_id,   'client_id');
  requireUUID(header.carrier_id,  'carrier_id');
  requireUUID(header.shipper_id,  'shipper_id');
  requireUUID(header.consignee_id, 'consignee_id');
  requireUUID(header.notify_party_id,     'notify_party_id');
  requireUUID(header.source_sales_lead_id, 'source_sales_lead_id');
  requireUUID(header.source_quotation_id,  'source_quotation_id');
  requireDate(header.booking_date,         'booking_date');
  requireDate(header.etd, 'etd');
  requireDate(header.eta, 'eta');
  requireDate(header.cargo_readiness_date, 'cargo_readiness_date');
  validateDateOrdering(header);
  validateLineItems(services, equipment);
  validateShippers(shippers);
  shippers.forEach((s, i) => {
    const id = typeof s === 'string' ? s : s?.shipper_id;
    checkOptionalUuid(id, `shippers[${i}].shipper_id`);
  });

  // Totals are derived — never trust whatever the client sent.
  const { total_revenue, total_cost } = computeTotalsFromPayload(services, equipment);
  header.total_revenue = total_revenue;
  header.total_cost    = total_cost;

  // Assigned agent: callers without `edit:booking-agent-assignment` can never
  // reassign the booking to someone else. Default everyone to their own
  // linked employee, regardless of permission.
  const canReassignAgent = canAccess(req.user, REASSIGN_AGENT_PERMISSION);
  if (canReassignAgent) checkOptionalUuid(header.assigned_agent_id, 'assigned_agent_id');
  const creatorEmployeeId = req.user?.employee_id || null;
  if (!canReassignAgent) {
    header.assigned_agent_id = creatorEmployeeId;
  } else if (!header.assigned_agent_id) {
    header.assigned_agent_id = creatorEmployeeId;
  }
  checkOptionalUuid(header.assigned_agent_id, 'assigned_agent_id');

  const shipperIds = shipperIdsFromInput(shippers);
  if (!header.shipper_id && shipperIds.length) header.shipper_id = shipperIds[0];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const defaultCurrency = await getDefaultCurrency(conn);
    header.currency = header.currency || defaultCurrency;
    const id = uuidv4();

    // Booking number race: if two POSTs collide on the unique index, fetch the
    // next number again and retry. ER_DUP_ENTRY only rolls back the failing
    // statement under InnoDB, so the transaction stays alive.
    const columns = ['id', 'booking_number', 'created_by', ...HEADER_COLUMNS];
    const baseValues = [id, null /* booking_number set in the loop */, req.user?.username ?? null, ...HEADER_COLUMNS.map((c) => header[c])];
    let assignedBookingNumber = null;
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = await getNextBookingNumber(conn);
      const values = baseValues.slice();
      values[1] = candidate;
      try {
        await conn.query(
          `INSERT INTO bookings (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
          values,
        );
        assignedBookingNumber = candidate;
        break;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' && /booking_number/i.test(err.sqlMessage || '') && attempt < maxAttempts - 1) {
          continue;
        }
        if (err.code === 'ER_DUP_ENTRY' && /booking_number/i.test(err.sqlMessage || '')) {
          throw new AppError(409, 'Could not allocate a unique booking number — please retry', 'BOOKING_NUMBER_RACE');
        }
        throw err;
      }
    }

    await writeShippers(conn, id, shippers);
    await reconcileBookingServices(conn, id, services, defaultCurrency);
    await insertBookingEquipmentForCreate(conn, id, equipment);

    // P1.6: if the booking was originated from a sales lead, advance that lead to Booked.
    await advanceLeadStatus(conn, header.source_sales_lead_id, 'Booked');

    const afterRow = await snapshotRow(conn, 'bookings', id);
    await logAudit(conn, { tableName: 'bookings', rowId: id, action: 'INSERT', actor: req.user, after: afterRow });

    await conn.commit();
    res.status(201).json({ id, booking_number: assignedBookingNumber, message: 'Booking created' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// PUT update booking
router.put('/:id', asyncHandler(async (req, res) => {
  requireArray(req.body.services  ?? [], 'services');
  requireArray(req.body.equipment ?? [], 'equipment');
  requireArray(req.body.shippers  ?? [], 'shippers');
  const { services = [], equipment = [], shippers = [] } = req.body;

  const header = pickHeaderValues(req.body);
  checkOptionalEnum(header.mode_of_transport, VALID_MODES,         'mode_of_transport');
  checkOptionalEnum(header.incoterm,          VALID_INCOTERMS,     'incoterm');
  checkOptionalEnum(header.bl_type,           VALID_BL_TYPES,      'bl_type');
  checkOptionalEnum(header.bl_status,         VALID_BL_STATUSES,   'bl_status');
  checkOptionalEnum(header.freight_terms,     VALID_FREIGHT_TERMS, 'freight_terms');
  checkOptionalEnum(header.cargo_nature,      VALID_CARGO_NATURES, 'cargo_nature');

  requireUUID(header.client_id,   'client_id');
  requireUUID(header.carrier_id,  'carrier_id');
  requireUUID(header.shipper_id,  'shipper_id');
  requireUUID(header.consignee_id, 'consignee_id');
  requireUUID(header.notify_party_id,     'notify_party_id');
  requireUUID(header.source_sales_lead_id, 'source_sales_lead_id');
  requireUUID(header.source_quotation_id,  'source_quotation_id');
  requireDate(header.booking_date,         'booking_date');
  requireDate(header.etd, 'etd');
  requireDate(header.eta, 'eta');
  requireDate(header.cargo_readiness_date, 'cargo_readiness_date');
  validateDateOrdering(header);
  validateLineItems(services, equipment);
  validateShippers(shippers);
  shippers.forEach((s, i) => {
    const id = typeof s === 'string' ? s : s?.shipper_id;
    checkOptionalUuid(id, `shippers[${i}].shipper_id`);
  });

  // Totals are derived — never trust whatever the client sent.
  const { total_revenue, total_cost } = computeTotalsFromPayload(services, equipment);
  header.total_revenue = total_revenue;
  header.total_cost    = total_cost;
  const canReassignAgent = canAccess(req.user, REASSIGN_AGENT_PERMISSION);
  if (canReassignAgent) checkOptionalUuid(header.assigned_agent_id, 'assigned_agent_id');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const defaultCurrency = await getDefaultCurrency(conn);
    header.currency = header.currency || defaultCurrency;

    const beforeRow = await snapshotRow(conn, 'bookings', req.params.id);
    if (!beforeRow) {
      await conn.rollback();
      throw new AppError(404, 'Booking not found', 'NOT_FOUND');
    }

    if (header.status) {
      const allowedStatuses = await loadActiveStatusNames(conn);
      const statusUnchanged = header.status === beforeRow.status;
      if (!statusUnchanged && allowedStatuses.length && !allowedStatuses.includes(header.status)) {
        throw new AppError(400, `Invalid status: ${header.status}`, 'INVALID_STATUS');
      }
    }

    // Lock the assigned agent for callers without reassign permission so an
    // edit submitted with a stale or tampered payload can't move the booking.
    if (!canReassignAgent) {
      header.assigned_agent_id = beforeRow?.assigned_agent_id ?? null;
    }
    checkOptionalUuid(header.assigned_agent_id, 'assigned_agent_id');

    const shipperIds = shipperIdsFromInput(shippers);
    if (!header.shipper_id && shipperIds.length) header.shipper_id = shipperIds[0];

    const updateColumns = [...HEADER_COLUMNS];
    const updateValues = HEADER_COLUMNS.map((c) => header[c]);

    // The booking number can be edited from the header. A blank value is
    // ignored so it can never wipe the existing NOT NULL UNIQUE column.
    const newBookingNumber = typeof req.body.booking_number === 'string'
      ? req.body.booking_number.trim()
      : '';
    if (newBookingNumber) {
      if (newBookingNumber.length > 30) {
        throw new AppError(400, 'Booking number must be 30 characters or fewer', 'INVALID_BOOKING_NUMBER');
      }
      updateColumns.push('booking_number');
      updateValues.push(newBookingNumber);
    }

    const assignments = updateColumns.map((c) => `${c}=?`).concat(['updated_by=?']).join(', ');
    const values = [...updateValues, req.user?.username ?? null, req.params.id];

    let result;
    try {
      [result] = await conn.query(`UPDATE bookings SET ${assignments} WHERE id=?`, values);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' && /booking_number/i.test(err.sqlMessage || '')) {
        throw new AppError(409, `Booking number "${newBookingNumber}" is already in use`, 'DUPLICATE_BOOKING_NUMBER');
      }
      throw err;
    }

    if (result.affectedRows === 0) {
      await conn.rollback();
      throw new AppError(404, 'Booking not found', 'NOT_FOUND');
    }

    await writeShippers(conn, req.params.id, shippers);
    await reconcileBookingServices(conn, req.params.id, services, defaultCurrency);
    await reconcileBookingEquipment(conn, req.params.id, equipment);

    const afterRow = await snapshotRow(conn, 'bookings', req.params.id);
    await logAudit(conn, { tableName: 'bookings', rowId: req.params.id, action: 'UPDATE', actor: req.user, before: beforeRow, after: afterRow });

    await conn.commit();
    res.json({ message: 'Booking updated' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// PATCH notes — lightweight endpoint so notes can be saved independently of the
// full booking edit flow (e.g. in view mode, without touching any other field).
router.patch('/:id/notes', asyncHandler(async (req, res) => {
  const { internal_notes, free_text_comments } = req.body;
  const [result] = await db.query(
    `UPDATE bookings SET internal_notes=?, free_text_comments=?, updated_by=? WHERE id=?`,
    [internal_notes ?? null, free_text_comments ?? null, req.user?.username ?? null, req.params.id],
  );
  if (result.affectedRows === 0) {
    throw new AppError(404, 'Booking not found', 'NOT_FOUND');
  }
  res.json({ message: 'Notes saved' });
}));

// DELETE booking
router.delete('/:id', asyncHandler(async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const beforeRow = await snapshotRow(conn, 'bookings', req.params.id);
    const [result] = await conn.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      throw new AppError(404, 'Booking not found', 'NOT_FOUND');
    }
    await logAudit(conn, { tableName: 'bookings', rowId: req.params.id, action: 'DELETE', actor: req.user, before: beforeRow });
    await conn.commit();
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
