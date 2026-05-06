const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

const AUDITED_TABLES = ['bookings', 'invoices', 'cost_control', 'partners'];
const VALID_ACTIONS  = ['INSERT', 'UPDATE', 'DELETE'];
const MAX_LIMIT = 500;

router.get('/', asyncHandler(async (req, res) => {
  const { table, row_id, actor_id, action, from, to } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, MAX_LIMIT);

  const where = [];
  const params = [];
  if (table) {
    if (!AUDITED_TABLES.includes(table)) return res.json([]);
    where.push('table_name = ?');
    params.push(table);
  }
  if (row_id)  { where.push('row_id = ?');    params.push(row_id); }
  if (actor_id){ where.push('actor_id = ?');  params.push(actor_id); }
  if (action && VALID_ACTIONS.includes(action)) { where.push('action = ?'); params.push(action); }
  if (from)    { where.push('changed_at >= ?'); params.push(from); }
  if (to)      { where.push('changed_at <= ?'); params.push(to); }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT id, table_name, row_id, action, actor_id, actor_name, changed_at, before_data, after_data
       FROM audit_log
       ${whereClause}
   ORDER BY changed_at DESC
      LIMIT ?`,
    [...params, limit]
  );
  res.json(rows);
}));

module.exports = router;
