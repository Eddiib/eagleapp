const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireEnum } = require('../middleware/validate');

const VALID_CATEGORIES = [
  'Main Freight',
  'Local Charge (Origin)',
  'Local Charge (Destination)',
  'Documentation',
  'Handling / Terminal',
  'Trucking',
  'Warehouse',
  'Value-Added Service',
];
const VALID_BUY_SELL = ['Buy', 'Sell', 'Both'];
const VALID_PRICE_BEHAVIOR = ['Fixed', 'Tiered', 'Formula-based', 'Formula'];

// ── Service Groups ───────────────────────────────────────────────────────────

// Translate the DB unique-key violation into a friendly 409 instead of 500.
function rethrowDuplicateGroupCode(err) {
  if (err && err.code === 'ER_DUP_ENTRY') {
    throw new AppError(409, 'A service group with this code already exists', 'DUPLICATE_GROUP_CODE');
  }
  throw err;
}

router.get('/groups', asyncHandler(async (_req, res) => {
  // Surface used-in-services count so the UI can warn before delete.
  const [rows] = await db.query(
    `SELECT g.*, COALESCE(s.usage_count, 0) AS used_in_services
       FROM service_groups g
       LEFT JOIN (
         SELECT service_group_id, COUNT(*) AS usage_count
           FROM services
          WHERE service_group_id IS NOT NULL
          GROUP BY service_group_id
       ) s ON s.service_group_id = g.id
      ORDER BY g.group_code`,
  );
  res.json(rows);
}));

router.post('/groups', asyncHandler(async (req, res) => {
  requireFields(req.body, ['group_code', 'group_name']);
  const { group_code, group_name, description, default_where_used, default_modes, is_active, created_by } = req.body;
  const id = uuidv4();
  try {
    await db.query(
      `INSERT INTO service_groups (id, group_code, group_name, description, default_where_used, default_modes, is_active, created_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        id,
        group_code,
        group_name,
        description ?? null,
        JSON.stringify(default_where_used || []),
        JSON.stringify(default_modes || []),
        is_active == null ? 1 : (is_active ? 1 : 0),
        created_by ?? null,
      ]
    );
  } catch (err) {
    rethrowDuplicateGroupCode(err);
  }
  res.status(201).json({ id, message: 'Service group created' });
}));

router.put('/groups/:id', asyncHandler(async (req, res) => {
  const { group_code, group_name, description, default_where_used, default_modes, is_active, modified_by } = req.body;
  let result;
  try {
    [result] = await db.query(
      `UPDATE service_groups
         SET group_code=?, group_name=?, description=?, default_where_used=?, default_modes=?, is_active=?, modified_by=?
       WHERE id=?`,
      [
        group_code,
        group_name,
        description ?? null,
        JSON.stringify(default_where_used || []),
        JSON.stringify(default_modes || []),
        is_active == null ? 1 : (is_active ? 1 : 0),
        modified_by ?? null,
        req.params.id,
      ]
    );
  } catch (err) {
    rethrowDuplicateGroupCode(err);
  }
  if (result.affectedRows === 0) throw new AppError(404, 'Service group not found', 'NOT_FOUND');
  res.json({ message: 'Service group updated' });
}));

router.delete('/groups/:id', asyncHandler(async (req, res) => {
  const [[usage]] = await db.query(
    'SELECT COUNT(*) AS count FROM services WHERE service_group_id = ?',
    [req.params.id]
  );

  if (usage?.count > 0) {
    throw new AppError(
      409,
      `Cannot delete: ${usage.count} service${usage.count === 1 ? '' : 's'} still link to this group`,
      'GROUP_IN_USE',
    );
  }

  const [result] = await db.query('DELETE FROM service_groups WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Service group not found', 'NOT_FOUND');
  res.json({ message: 'Service group deleted' });
}));

// ── Services (UI-driven contract) ────────────────────────────────────────────

router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM services ORDER BY service_code');
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
  if (!rows.length) throw new AppError(404, 'Service not found', 'NOT_FOUND');
  res.json(rows[0]);
}));

router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['service_code', 'service_name']);
  const {
    service_code, service_name, service_group_id, category, transport_modes, applies_to,
    charge_unit, default_currency, buy_sell_type, default_vat_rate, default_gl_code,
    price_behavior, pricing_model_id, related_partner_types, location_type,
    documentation_required, mandatory_for_shipment_types, is_active,
    visible_to_sales, visible_to_marketplace, notes, created_by,
  } = req.body;

  requireEnum(category, VALID_CATEGORIES, 'category');
  requireEnum(buy_sell_type, VALID_BUY_SELL, 'buy_sell_type');
  requireEnum(price_behavior, VALID_PRICE_BEHAVIOR, 'price_behavior');

  const id = uuidv4();
  await db.query(
    `INSERT INTO services
       (id, service_code, service_name, service_group_id, category, transport_modes, applies_to_list,
        charge_unit, default_currency, buy_sell_type, default_vat_rate, default_gl_code,
        price_behavior, pricing_model_id, related_partner_types, location_type,
        documentation_required, mandatory_for_shipment_types, is_active,
        visible_to_sales, visible_to_marketplace, notes, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, service_code, service_name, service_group_id || null, category ?? null,
      JSON.stringify(transport_modes || []),
      JSON.stringify(applies_to || []),
      charge_unit ?? null, default_currency ?? null, buy_sell_type ?? null,
      default_vat_rate ?? 0, default_gl_code ?? null,
      price_behavior ?? null, pricing_model_id ?? null,
      JSON.stringify(related_partner_types || []),
      location_type ?? null,
      documentation_required ? 1 : 0,
      JSON.stringify(mandatory_for_shipment_types || []),
      is_active == null ? 1 : (is_active ? 1 : 0),
      visible_to_sales == null ? 1 : (visible_to_sales ? 1 : 0),
      visible_to_marketplace ? 1 : 0,
      notes ?? null, created_by ?? null,
    ]
  );

  res.status(201).json({ id, message: 'Service created' });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const {
    service_code, service_name, service_group_id, category, transport_modes, applies_to,
    charge_unit, default_currency, buy_sell_type, default_vat_rate, default_gl_code,
    price_behavior, pricing_model_id, related_partner_types, location_type,
    documentation_required, mandatory_for_shipment_types, is_active,
    visible_to_sales, visible_to_marketplace, notes, modified_by,
  } = req.body;

  requireEnum(category, VALID_CATEGORIES, 'category');
  requireEnum(buy_sell_type, VALID_BUY_SELL, 'buy_sell_type');
  requireEnum(price_behavior, VALID_PRICE_BEHAVIOR, 'price_behavior');

  const [result] = await db.query(
    `UPDATE services SET
        service_code=?, service_name=?, service_group_id=?, category=?, transport_modes=?, applies_to_list=?,
        charge_unit=?, default_currency=?, buy_sell_type=?, default_vat_rate=?, default_gl_code=?,
        price_behavior=?, pricing_model_id=?, related_partner_types=?, location_type=?,
        documentation_required=?, mandatory_for_shipment_types=?, is_active=?,
        visible_to_sales=?, visible_to_marketplace=?, notes=?, modified_by=?
     WHERE id=?`,
    [
      service_code, service_name, service_group_id || null, category ?? null,
      JSON.stringify(transport_modes || []),
      JSON.stringify(applies_to || []),
      charge_unit ?? null, default_currency ?? null, buy_sell_type ?? null,
      default_vat_rate ?? 0, default_gl_code ?? null,
      price_behavior ?? null, pricing_model_id ?? null,
      JSON.stringify(related_partner_types || []),
      location_type ?? null,
      documentation_required ? 1 : 0,
      JSON.stringify(mandatory_for_shipment_types || []),
      is_active == null ? 1 : (is_active ? 1 : 0),
      visible_to_sales == null ? 1 : (visible_to_sales ? 1 : 0),
      visible_to_marketplace ? 1 : 0,
      notes ?? null, modified_by ?? null, req.params.id,
    ]
  );

  if (result.affectedRows === 0) throw new AppError(404, 'Service not found', 'NOT_FOUND');
  res.json({ message: 'Service updated' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Service not found', 'NOT_FOUND');
  res.json({ message: 'Service deleted' });
}));

module.exports = router;
