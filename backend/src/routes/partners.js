const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireEnum, requireUUID, requireEmail, requireNumber, requireArray } = require('../middleware/validate');
const { logAudit, snapshotRow } = require('../lib/audit');

// Must stay in sync with frontend PartnerType / PartnerStatus / PartnerClass unions
// (see frontend/types/partner.ts). Mismatch here silently blocks partner
// creation from the UI.
const VALID_PARTNER_TYPES = [
  'Client', 'Buyer', 'Shipping Line', 'Air Carrier', 'Trucking Company',
  'Rail Operator', 'Overseas Agent', 'Customs Broker', 'Warehouse / Depot',
  'Insurance Company', 'Surveyor / Inspector', 'Special Services Provider',
  'Other',
];
const VALID_STATUSES = ['Active', 'Suspended', 'Blacklisted', 'Archived'];
const VALID_PARTNER_CLASSES = ['Carrier', 'Non Carrier'];
const VALID_PARTNER_ROLES = ['Buyer', 'Seller'];
const VALID_DOCUMENT_TYPES = ['Contract', 'LOA', 'Certificate', 'License', 'Other'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

// Translate the DB unique-key violation into a friendly 409 instead of 500.
function rethrowDuplicatePartnerCode(err) {
  if (err && err.code === 'ER_DUP_ENTRY' && /partner_code/i.test(err.sqlMessage || '')) {
    throw new AppError(409, 'A partner with this code already exists', 'DUPLICATE_PARTNER_CODE');
  }
  throw err;
}

// Generate a unique PTR##### partner code, retrying on collision. Server-side
// generation prevents two concurrent creates from racing on the same random number.
async function generateUniquePartnerCode(conn, attempts = 25) {
  for (let i = 0; i < attempts; i++) {
    const code = `PTR${Math.floor(Math.random() * 90000) + 10000}`;
    const [rows] = await conn.query('SELECT 1 FROM partners WHERE partner_code = ? LIMIT 1', [code]);
    if (!rows.length) return code;
  }
  throw new AppError(500, 'Failed to allocate a unique partner code', 'CODE_ALLOCATION_FAILED');
}

function mapTradeLane(t) {
  return {
    id: t.id,
    countryOfOrigin: t.origin,
    countryOfDestination: t.destination,
    placeOfLoading: t.place_of_loading,
    pol: t.pol,
    pod: t.pod,
    finalDestination: t.final_destination,
    totalAnnualVolume: t.total_annual_volume,
    preferredCarrierId: t.preferred_carrier_id,
    preferredCorridor: t.preferred_corridor,
    modeOfTransport: t.mode_of_transport,
    modeOfTrailer: t.mode_of_trailer,
  };
}

function parsePartnerRoles(value) {
  if (Array.isArray(value)) return value;
  if (Buffer.isBuffer(value)) return parsePartnerRoles(value.toString('utf8'));
  if (typeof value !== 'string' || value.trim() === '') return null;
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') return [parsed];
  } catch {
    // Accept simple form-encoded / hand-written values too.
    return trimmed.split(',').map((role) => role.trim()).filter(Boolean);
  }
  return null;
}

function derivePartnerRoles(partnerType) {
  return ['Client', 'Buyer'].includes(partnerType) ? ['Buyer'] : ['Seller'];
}

function normalizePartnerRoles(value, partnerType, existingValue) {
  const parsed = value === undefined
    ? parsePartnerRoles(existingValue)
    : parsePartnerRoles(value);
  const source = parsed ?? derivePartnerRoles(partnerType);

  if (!Array.isArray(source)) {
    throw new AppError(400, 'Invalid partner_roles: must be an array', 'INVALID_ARRAY');
  }

  const roles = [...new Set(source)];
  const invalid = roles.filter((role) => !VALID_PARTNER_ROLES.includes(role));
  if (invalid.length) {
    throw new AppError(
      400,
      `Invalid partner_roles: must contain only ${VALID_PARTNER_ROLES.join(', ')}`,
      'INVALID_ENUM',
    );
  }
  if (roles.length === 0) {
    throw new AppError(400, 'Select at least one partner role', 'MISSING_FIELDS');
  }

  return roles;
}

// ── Diff-and-merge helpers ────────────────────────────────────────────────────
// Each child collection is reconciled by ID instead of being deleted-and-rebuilt.
// Existing rows update in place, new rows insert with a fresh UUID, and rows
// missing from the payload are deleted. This preserves child IDs across edits
// so anything referencing them (invoices → bank, bookings → address) stays intact.

async function reconcileChildren(conn, {
  table,
  partnerId,
  incoming,
  insert,    // (conn, id, partnerId, item) => Promise
  update,    // (conn, id, item) => Promise
}) {
  const [existing] = await conn.query(
    `SELECT id FROM ${table} WHERE partner_id = ?`,
    [partnerId],
  );
  const existingIds = new Set(existing.map((r) => r.id));
  const keptIds = new Set();

  for (const item of incoming || []) {
    if (item.id && isUuid(item.id) && existingIds.has(item.id)) {
      await update(conn, item.id, item);
      keptIds.add(item.id);
    } else {
      const newId = uuidv4();
      await insert(conn, newId, partnerId, item);
    }
  }

  const removedIds = [...existingIds].filter((id) => !keptIds.has(id));
  if (removedIds.length) {
    await conn.query(
      `DELETE FROM ${table} WHERE id IN (?)`,
      [removedIds],
    );
  }
}

const insertContact = (conn, id, partnerId, c) =>
  conn.query(
    'INSERT INTO partner_contacts (id, partner_id, name, position, phone, email, is_primary) VALUES (?,?,?,?,?,?,?)',
    [id, partnerId, c.name, c.position, c.phone, c.email, c.isPrimary ? 1 : 0],
  );
const updateContact = (conn, id, c) =>
  conn.query(
    'UPDATE partner_contacts SET name=?, position=?, phone=?, email=?, is_primary=? WHERE id=?',
    [c.name, c.position, c.phone, c.email, c.isPrimary ? 1 : 0, id],
  );

const insertBank = (conn, id, partnerId, b) =>
  conn.query(
    `INSERT INTO partner_bank_details (id, partner_id, bank_name, iban, swift, account_number,
        currency, intermediary_bank_name, intermediary_swift, is_default)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, partnerId, b.bankName, b.iban, b.swift, b.accountNumber,
      b.currency, b.intermediaryBankName, b.intermediarySwift, b.isDefault ? 1 : 0],
  );
const updateBank = (conn, id, b) =>
  conn.query(
    `UPDATE partner_bank_details SET bank_name=?, iban=?, swift=?, account_number=?,
        currency=?, intermediary_bank_name=?, intermediary_swift=?, is_default=?
       WHERE id=?`,
    [b.bankName, b.iban, b.swift, b.accountNumber, b.currency,
      b.intermediaryBankName, b.intermediarySwift, b.isDefault ? 1 : 0, id],
  );

const insertAddress = (conn, id, partnerId, a) =>
  conn.query(
    `INSERT INTO partner_delivery_addresses (id, partner_id, address_name, full_address, city,
        country, zip_code, contact_person, contact_phone, is_default)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, partnerId, a.addressName, a.fullAddress, a.city,
      a.country, a.zipCode, a.contactPerson, a.contactPhone, a.isDefault ? 1 : 0],
  );
const updateAddress = (conn, id, a) =>
  conn.query(
    `UPDATE partner_delivery_addresses SET address_name=?, full_address=?, city=?, country=?,
        zip_code=?, contact_person=?, contact_phone=?, is_default=?
       WHERE id=?`,
    [a.addressName, a.fullAddress, a.city, a.country,
      a.zipCode, a.contactPerson, a.contactPhone, a.isDefault ? 1 : 0, id],
  );

const insertLane = (conn, id, partnerId, t) =>
  conn.query(
    `INSERT INTO partner_trade_lanes (id, partner_id, origin, destination, place_of_loading,
        pol, pod, final_destination, total_annual_volume, preferred_carrier_id,
        preferred_corridor, mode_of_transport, mode_of_trailer)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, partnerId, t.countryOfOrigin, t.countryOfDestination,
      t.placeOfLoading, t.pol, t.pod, t.finalDestination,
      t.totalAnnualVolume, t.preferredCarrierId, t.preferredCorridor,
      t.modeOfTransport, t.modeOfTrailer],
  );
const updateLane = (conn, id, t) =>
  conn.query(
    `UPDATE partner_trade_lanes SET origin=?, destination=?, place_of_loading=?,
        pol=?, pod=?, final_destination=?, total_annual_volume=?, preferred_carrier_id=?,
        preferred_corridor=?, mode_of_transport=?, mode_of_trailer=?
       WHERE id=?`,
    [t.countryOfOrigin, t.countryOfDestination, t.placeOfLoading,
      t.pol, t.pod, t.finalDestination, t.totalAnnualVolume,
      t.preferredCarrierId, t.preferredCorridor, t.modeOfTransport, t.modeOfTrailer, id],
  );

const insertDoc = (conn, id, partnerId, d) =>
  conn.query(
    'INSERT INTO partner_documents (id, partner_id, name, type, url, uploaded_date, uploaded_by) VALUES (?,?,?,?,?,?,?)',
    [
      id, partnerId,
      d.name ?? null,
      VALID_DOCUMENT_TYPES.includes(d.type) ? d.type : 'Other',
      d.url ?? null,
      d.uploadedDate ? new Date(d.uploadedDate) : new Date(),
      d.uploadedBy ?? null,
    ],
  );
const updateDoc = (conn, id, d) =>
  conn.query(
    'UPDATE partner_documents SET name=?, type=?, url=?, uploaded_by=? WHERE id=?',
    [
      d.name ?? null,
      VALID_DOCUMENT_TYPES.includes(d.type) ? d.type : 'Other',
      d.url ?? null,
      d.uploadedBy ?? null,
      id,
    ],
  );

// ── Validation: enforce single-default / single-primary on the server too. ───
function validateSingleDefault(arr, label, key = 'isDefault') {
  if (!Array.isArray(arr)) return;
  const flagged = arr.filter((x) => x && x[key]).length;
  if (flagged > 1) {
    throw new AppError(400, `Only one ${label} may be marked default`, 'MULTI_DEFAULT');
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET all partners
router.get('/', asyncHandler(async (_req, res) => {
  const [partners] = await db.query('SELECT * FROM partners ORDER BY created_date DESC');

  if (partners.length === 0) return res.json([]);

  const ids = partners.map(p => p.id);
  const [contacts]          = await db.query('SELECT * FROM partner_contacts WHERE partner_id IN (?)', [ids]);
  const [bankDetails]       = await db.query('SELECT * FROM partner_bank_details WHERE partner_id IN (?)', [ids]);
  const [deliveryAddresses] = await db.query('SELECT * FROM partner_delivery_addresses WHERE partner_id IN (?)', [ids]);
  const [tradeLanes]        = await db.query('SELECT * FROM partner_trade_lanes WHERE partner_id IN (?)', [ids]);

  const group = (rows, key = 'partner_id') => rows.reduce((acc, r) => {
    (acc[r[key]] = acc[r[key]] || []).push(r);
    return acc;
  }, {});

  const contactsMap   = group(contacts);
  const banksMap      = group(bankDetails);
  const addressesMap  = group(deliveryAddresses);
  const tradeLanesMap = group(tradeLanes);

  for (const p of partners) {
    p.partner_roles     = normalizePartnerRoles(p.partner_roles, p.partner_type);
    p.contacts          = contactsMap[p.id]   || [];
    p.bankDetails       = banksMap[p.id]      || [];
    p.deliveryAddresses = addressesMap[p.id]  || [];
    p.tradeMarketInfo   = (tradeLanesMap[p.id] || []).map(mapTradeLane);
  }

  res.json(partners);
}));

// GET single partner
router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM partners WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Partner not found', 'NOT_FOUND');

  const partner = rows[0];
  partner.partner_roles = normalizePartnerRoles(partner.partner_roles, partner.partner_type);
  const [contacts]          = await db.query('SELECT * FROM partner_contacts WHERE partner_id = ?', [partner.id]);
  const [bankDetails]       = await db.query('SELECT * FROM partner_bank_details WHERE partner_id = ?', [partner.id]);
  const [deliveryAddresses] = await db.query('SELECT * FROM partner_delivery_addresses WHERE partner_id = ?', [partner.id]);
  const [documents]         = await db.query('SELECT * FROM partner_documents WHERE partner_id = ?', [partner.id]);
  const [activityLog]       = await db.query('SELECT * FROM partner_activity_log WHERE partner_id = ? ORDER BY performed_at DESC', [partner.id]);
  const [tradeLanes]        = await db.query('SELECT * FROM partner_trade_lanes WHERE partner_id = ?', [partner.id]);

  partner.contacts          = contacts;
  partner.bankDetails       = bankDetails;
  partner.deliveryAddresses = deliveryAddresses;
  partner.documents         = documents;
  partner.activityLog       = activityLog;
  partner.tradeMarketInfo   = tradeLanes.map(mapTradeLane);

  res.json(partner);
}));

// POST create partner
router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['company_legal_name', 'trading_name', 'partner_type']);
  requireEnum(req.body.partner_type,  VALID_PARTNER_TYPES,   'partner_type');
  requireEnum(req.body.partner_class, VALID_PARTNER_CLASSES, 'partner_class');
  requireEnum(req.body.status,        VALID_STATUSES,        'status');
  requireUUID(req.body.assigned_agent_id, 'assigned_agent_id');
  requireNumber(req.body.rating,       'rating',       { min: 0, max: 5, integer: true });
  requireNumber(req.body.credit_limit, 'credit_limit', { min: 0 });
  requireArray(req.body.contacts          ?? [], 'contacts');
  requireArray(req.body.bankDetails       ?? [], 'bankDetails');
  requireArray(req.body.deliveryAddresses ?? [], 'deliveryAddresses');
  requireArray(req.body.tradeMarketInfo   ?? [], 'tradeMarketInfo');
  requireArray(req.body.documents         ?? [], 'documents');
  (req.body.contacts ?? []).forEach((c, i) => requireEmail(c.email, `contacts[${i}].email`));

  validateSingleDefault(req.body.bankDetails,       'bank account');
  validateSingleDefault(req.body.deliveryAddresses, 'delivery address');
  validateSingleDefault(req.body.contacts,          'contact', 'isPrimary');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const id = uuidv4();
    const partnerCode = await generateUniquePartnerCode(conn);

    const {
      company_legal_name, trading_name, business_number, eori_number,
      partner_type, partner_class, country, city, address, zip_code, website,
      tax_number, registration_number, assigned_agent_id,
      payment_terms_as_supplier, payment_terms_as_client, credit_terms, currency,
      default_service_type, main_trades, notes, status, rating, credit_limit,
      contacts = [], bankDetails = [], deliveryAddresses = [], tradeMarketInfo = [],
      documents = [],
    } = req.body;
    const partner_roles = normalizePartnerRoles(req.body.partner_roles, partner_type);

    try {
      await conn.query(
        `INSERT INTO partners (id, partner_code, company_legal_name, trading_name, business_number,
          eori_number, partner_type, partner_class, partner_roles, partner_category, country, city, address, zip_code,
          website, tax_number, registration_number, assigned_agent_id, payment_terms,
          payment_terms_as_supplier, payment_terms_as_client, credit_terms, currency,
          default_service_type, main_trades, notes, status, rating, open_balance, credit_limit, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, partnerCode, company_legal_name, trading_name, business_number,
          eori_number, partner_type, partner_class, JSON.stringify(partner_roles), partner_type, // partner_category mirrors partner_type
          country, city, address, zip_code, website,
          tax_number, registration_number, assigned_agent_id || null,
          payment_terms_as_supplier || null, // legacy "payment_terms" mirrors supplier terms
          payment_terms_as_supplier || null, payment_terms_as_client || null,
          credit_terms, currency,
          default_service_type, JSON.stringify(main_trades || []), notes,
          status || 'Active', rating || 3, 0 /* open_balance is derived; never written from form */,
          credit_limit, req.user?.username ?? null]
      );
    } catch (err) {
      rethrowDuplicatePartnerCode(err);
    }

    for (const c of contacts) {
      await insertContact(conn, uuidv4(), id, c);
    }
    for (const b of bankDetails) {
      await insertBank(conn, uuidv4(), id, b);
    }
    for (const a of deliveryAddresses) {
      await insertAddress(conn, uuidv4(), id, a);
    }
    for (const t of tradeMarketInfo) {
      await insertLane(conn, uuidv4(), id, t);
    }
    for (const d of documents) {
      await insertDoc(conn, uuidv4(), id, d);
    }

    const after = await snapshotRow(conn, 'partners', id);
    await logAudit(conn, {
      tableName: 'partners', rowId: id, action: 'INSERT',
      actor: req.user, after,
    });

    await conn.commit();
    res.status(201).json({ id, partner_code: partnerCode, message: 'Partner created' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// PUT update partner
router.put('/:id', asyncHandler(async (req, res) => {
  requireEnum(req.body.partner_type,  VALID_PARTNER_TYPES,   'partner_type');
  requireEnum(req.body.partner_class, VALID_PARTNER_CLASSES, 'partner_class');
  requireEnum(req.body.status,        VALID_STATUSES,        'status');
  requireUUID(req.body.assigned_agent_id, 'assigned_agent_id');
  requireNumber(req.body.rating,       'rating',       { min: 0, max: 5, integer: true });
  requireNumber(req.body.credit_limit, 'credit_limit', { min: 0 });
  requireArray(req.body.contacts          ?? [], 'contacts');
  requireArray(req.body.bankDetails       ?? [], 'bankDetails');
  requireArray(req.body.deliveryAddresses ?? [], 'deliveryAddresses');
  requireArray(req.body.tradeMarketInfo   ?? [], 'tradeMarketInfo');
  requireArray(req.body.documents         ?? [], 'documents');
  (req.body.contacts ?? []).forEach((c, i) => requireEmail(c.email, `contacts[${i}].email`));

  validateSingleDefault(req.body.bankDetails,       'bank account');
  validateSingleDefault(req.body.deliveryAddresses, 'delivery address');
  validateSingleDefault(req.body.contacts,          'contact', 'isPrimary');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const before = await snapshotRow(conn, 'partners', req.params.id);
    if (!before) throw new AppError(404, 'Partner not found', 'NOT_FOUND');

    const {
      company_legal_name, trading_name, business_number, eori_number,
      partner_type, partner_class, country, city, address, zip_code, website,
      tax_number, registration_number, assigned_agent_id,
      payment_terms_as_supplier, payment_terms_as_client, credit_terms, currency,
      default_service_type, main_trades, notes, status, rating, credit_limit,
      contacts = [], bankDetails = [], deliveryAddresses = [], tradeMarketInfo = [],
      documents = [],
    } = req.body;
    const partner_roles = normalizePartnerRoles(req.body.partner_roles, partner_type ?? before.partner_type, before.partner_roles);

    try {
      await conn.query(
        `UPDATE partners SET company_legal_name=?, trading_name=?, business_number=?, eori_number=?,
          partner_type=?, partner_class=?, partner_roles=?, partner_category=?, country=?, city=?, address=?, zip_code=?,
          website=?, tax_number=?, registration_number=?, assigned_agent_id=?, payment_terms=?,
          payment_terms_as_supplier=?, payment_terms_as_client=?, credit_terms=?, currency=?,
          default_service_type=?, main_trades=?, notes=?, status=?, rating=?,
          credit_limit=?, last_updated_by=?, last_activity_date=NOW()
         WHERE id=?`,
        [company_legal_name, trading_name, business_number, eori_number,
          partner_type, partner_class, JSON.stringify(partner_roles), partner_type,
          country, city, address, zip_code, website,
          tax_number, registration_number, assigned_agent_id || null,
          payment_terms_as_supplier || null,
          payment_terms_as_supplier || null, payment_terms_as_client || null,
          credit_terms, currency,
          default_service_type, JSON.stringify(main_trades || []), notes, status, rating,
          credit_limit, req.user?.username ?? null, req.params.id]
      );
    } catch (err) {
      rethrowDuplicatePartnerCode(err);
    }

    await reconcileChildren(conn, {
      table: 'partner_contacts', partnerId: req.params.id,
      incoming: contacts, insert: insertContact, update: updateContact,
    });
    await reconcileChildren(conn, {
      table: 'partner_bank_details', partnerId: req.params.id,
      incoming: bankDetails, insert: insertBank, update: updateBank,
    });
    await reconcileChildren(conn, {
      table: 'partner_delivery_addresses', partnerId: req.params.id,
      incoming: deliveryAddresses, insert: insertAddress, update: updateAddress,
    });
    await reconcileChildren(conn, {
      table: 'partner_trade_lanes', partnerId: req.params.id,
      incoming: tradeMarketInfo, insert: insertLane, update: updateLane,
    });
    await reconcileChildren(conn, {
      table: 'partner_documents', partnerId: req.params.id,
      incoming: documents, insert: insertDoc, update: updateDoc,
    });

    const after = await snapshotRow(conn, 'partners', req.params.id);
    await logAudit(conn, {
      tableName: 'partners', rowId: req.params.id, action: 'UPDATE',
      actor: req.user, before, after,
    });

    await conn.commit();
    res.json({ message: 'Partner updated' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// DELETE partner
router.delete('/:id', asyncHandler(async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const before = await snapshotRow(conn, 'partners', req.params.id);
    if (!before) throw new AppError(404, 'Partner not found', 'NOT_FOUND');

    const [result] = await conn.query('DELETE FROM partners WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError(404, 'Partner not found', 'NOT_FOUND');

    await logAudit(conn, {
      tableName: 'partners', rowId: req.params.id, action: 'DELETE',
      actor: req.user, before,
    });

    await conn.commit();
    res.json({ message: 'Partner deleted' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
