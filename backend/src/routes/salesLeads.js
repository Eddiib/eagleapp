const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requireFields, requireEnum, requireUUID, requireDate, requireNumber } = require('../middleware/validate');

const VALID_LEAD_STATUSES  = ['New', 'Contacted', 'Quoted', 'Booked', 'Lost', 'Inactive'];
const VALID_LEAD_RANKINGS  = ['High', 'Medium', 'Low'];
const VALID_CONTACT_TYPES  = ['Phone Call', 'Email', 'WhatsApp', 'Physical Meeting', 'Video Call', 'Other'];
const VALID_NEXT_ACTIONS   = ['Send Quotation', 'Follow-Up Call', 'Schedule Meeting', 'Waiting on Client', 'Closed / Not Interested'];
const VALID_MINUTE_STATUSES = ['draft', 'completed', 'follow-up-pending'];

// Derive the next `LEAD-NNNN` id, scanning existing rows in order.
async function nextLeadId() {
  const [rows] = await db.query(`SELECT lead_id FROM sales_leads WHERE lead_id LIKE 'LEAD-%'`);
  const max = rows.reduce((m, r) => {
    const n = parseInt(String(r.lead_id).split('-')[1], 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `LEAD-${String(max + 1).padStart(4, '0')}`;
}

// ── Sales Leads ───────────────────────────────────────────────

router.get('/', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`
    SELECT sl.*,
      p.company_legal_name AS client_name,
      p.partner_code,
      p.city,
      p.country,
      p.main_trades        AS preferred_trades,
      p.status             AS partner_status,
      p.assigned_agent_id  AS partner_assigned_agent_id,
      COALESCE(sl.assigned_sales_agent_id, p.assigned_agent_id) AS effective_assigned_sales_agent_id,
      CONCAT(e.first_name, ' ', e.surname) AS assigned_sales_agent,
      pc.name              AS contact_person,
      pc.email             AS contact_email,
      pc.phone             AS contact_phone,
      (
        SELECT COUNT(*)
        FROM meeting_minutes mm
        WHERE mm.sales_lead_id = sl.id
      ) AS meeting_minutes_count
    FROM sales_leads sl
    LEFT JOIN partners  p ON sl.partner_id              = p.id
    LEFT JOIN employees e ON COALESCE(sl.assigned_sales_agent_id, p.assigned_agent_id) = e.id
    LEFT JOIN partner_contacts pc ON pc.partner_id = p.id AND pc.is_primary = 1
    ORDER BY sl.created_at DESC
  `);
  res.json(rows);
}));

// ── Standalone minute routes (MUST come before /:id) ────────────

// GET /sales-leads/minutes — all meeting minutes across all leads
router.get('/minutes', asyncHandler(async (_req, res) => {
  const [rows] = await db.query(`${MINUTES_SELECT} ORDER BY mm.meeting_date DESC, mm.created_at DESC`);
  res.json(rows);
}));

// POST /sales-leads/minutes — create standalone (no lead required)
router.post('/minutes', asyncHandler(async (req, res) => {
  const f = minuteFields(req.body);
  if (!f.summary && !f.key_points && !f.purpose) {
    throw new AppError(400, 'At least a summary, key points, or purpose is required', 'MISSING_FIELDS');
  }
  requireUUID(f.partner_id, 'partner_id');
  requireUUID(f.sales_agent_id, 'sales_agent_id');
  requireDate(f.meeting_date, 'meeting_date');
  requireDate(f.next_action_date, 'next_action_date');
  requireEnum(f.contact_type, VALID_CONTACT_TYPES, 'contact_type');
  requireEnum(f.next_action,  VALID_NEXT_ACTIONS,  'next_action');
  requireEnum(f.status,       VALID_MINUTE_STATUSES, 'status');
  requireNumber(f.duration_minutes, 'duration_minutes', { min: 0, integer: true });
  const id = uuidv4();
  await db.query(
    `INSERT INTO meeting_minutes
       (id, sales_lead_id, partner_id, sales_agent_id, sales_agent,
        contact_type, meeting_date, meeting_time, summary, client_needs,
        next_action, next_action_date, created_by,
        meeting_type, location, duration_minutes, purpose, key_points,
        proposed_solutions, competitors_mentioned,
        action_items, communication_methods, client_participants, company_participants,
        contact_person, status)
     VALUES (?,NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, f.partner_id, f.sales_agent_id, f.sales_agent,
     f.contact_type, f.meeting_date, f.meeting_time, f.summary, f.client_needs,
     f.next_action, f.next_action_date, f.created_by,
     f.meeting_type, f.location, f.duration_minutes, f.purpose, f.key_points,
     f.proposed_solutions, f.competitors_mentioned,
     f.action_items, f.communication_methods, f.client_participants, f.company_participants,
     f.contact_person, f.status]
  );
  res.status(201).json({ id, message: 'Meeting minute created' });
}));

// PUT /sales-leads/minutes/:minuteId — update any minute
router.put('/minutes/:minuteId', asyncHandler(async (req, res) => {
  const f = minuteFields(req.body);
  requireUUID(f.partner_id, 'partner_id');
  requireUUID(f.sales_agent_id, 'sales_agent_id');
  requireDate(f.meeting_date, 'meeting_date');
  requireDate(f.next_action_date, 'next_action_date');
  requireEnum(f.contact_type, VALID_CONTACT_TYPES, 'contact_type');
  requireEnum(f.next_action,  VALID_NEXT_ACTIONS,  'next_action');
  requireEnum(f.status,       VALID_MINUTE_STATUSES, 'status');
  requireNumber(f.duration_minutes, 'duration_minutes', { min: 0, integer: true });
  const [result] = await db.query(
    `UPDATE meeting_minutes SET
       partner_id=?, sales_agent_id=?, sales_agent=?,
       contact_type=?, meeting_date=?, meeting_time=?, summary=?, client_needs=?,
       next_action=?, next_action_date=?,
       meeting_type=?, location=?, duration_minutes=?, purpose=?, key_points=?,
       proposed_solutions=?, competitors_mentioned=?,
       action_items=?, communication_methods=?, client_participants=?, company_participants=?,
       contact_person=?, status=?
     WHERE id=?`,
    [f.partner_id, f.sales_agent_id, f.sales_agent,
     f.contact_type, f.meeting_date, f.meeting_time, f.summary, f.client_needs,
     f.next_action, f.next_action_date,
     f.meeting_type, f.location, f.duration_minutes, f.purpose, f.key_points,
     f.proposed_solutions, f.competitors_mentioned,
     f.action_items, f.communication_methods, f.client_participants, f.company_participants,
     f.contact_person, f.status, req.params.minuteId]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Meeting minute not found', 'NOT_FOUND');
  res.json({ message: 'Meeting minute updated' });
}));

// DELETE /sales-leads/minutes/:minuteId — delete any minute
router.delete('/minutes/:minuteId', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM meeting_minutes WHERE id = ?', [req.params.minuteId]);
  if (result.affectedRows === 0) throw new AppError(404, 'Meeting minute not found', 'NOT_FOUND');
  res.json({ message: 'Meeting minute deleted' });
}));

// ── Sales Lead by ID and nested routes ───────────────────────────

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT sl.*,
      p.company_legal_name AS client_name,
      p.partner_code,
      p.city,
      p.country,
      p.main_trades        AS preferred_trades,
      p.status             AS partner_status,
      p.assigned_agent_id  AS partner_assigned_agent_id,
      COALESCE(sl.assigned_sales_agent_id, p.assigned_agent_id) AS effective_assigned_sales_agent_id,
      CONCAT(e.first_name, ' ', e.surname) AS assigned_sales_agent,
      pc.name              AS contact_person,
      pc.email             AS contact_email,
      pc.phone             AS contact_phone,
      (
        SELECT COUNT(*)
        FROM meeting_minutes mm
        WHERE mm.sales_lead_id = sl.id
      ) AS meeting_minutes_count
    FROM sales_leads sl
    LEFT JOIN partners  p ON sl.partner_id              = p.id
    LEFT JOIN employees e ON COALESCE(sl.assigned_sales_agent_id, p.assigned_agent_id) = e.id
    LEFT JOIN partner_contacts pc ON pc.partner_id = p.id AND pc.is_primary = 1
    WHERE sl.id = ?
  `, [req.params.id]);

  if (!rows.length) throw new AppError(404, 'Sales lead not found', 'NOT_FOUND');

  const lead = rows[0];
  const [minutes] = await db.query(
    'SELECT * FROM meeting_minutes WHERE sales_lead_id = ? ORDER BY meeting_date DESC',
    [req.params.id]
  );
  lead.meetingMinutes = minutes;
  res.json(lead);
}));

router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['partner_id']);
  const { lead_id, partner_id, assigned_sales_agent_id, lead_status, lead_ranking } = req.body;

  requireEnum(lead_status, VALID_LEAD_STATUSES, 'lead_status');
  requireEnum(lead_ranking, VALID_LEAD_RANKINGS, 'lead_ranking');
  requireUUID(partner_id, 'partner_id');
  requireUUID(assigned_sales_agent_id, 'assigned_sales_agent_id');

  const id = uuidv4();
  const resolvedLeadId = lead_id || (await nextLeadId());

  await db.query(
    `INSERT INTO sales_leads (id, lead_id, partner_id, assigned_sales_agent_id, lead_status, lead_ranking)
     VALUES (?,?,?,?,?,?)`,
    [id, resolvedLeadId, partner_id, assigned_sales_agent_id ?? null,
      lead_status || 'New', lead_ranking || 'Medium']
  );
  res.status(201).json({ id, lead_id: resolvedLeadId, message: 'Sales lead created' });
}));

// POST upsert from partner: create a sales_leads row for a partner if one doesn't
// exist yet. Used by the frontend when it opens SalesLeads — every Client partner
// gets a backing lead row so meeting minutes and status changes persist.
router.post('/upsert-from-partner/:partnerId', asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const [existing] = await db.query(`
    SELECT sl.id, sl.assigned_sales_agent_id, p.assigned_agent_id
    FROM sales_leads sl
    LEFT JOIN partners p ON p.id = sl.partner_id
    WHERE sl.partner_id = ?
    LIMIT 1
  `, [partnerId]);
  if (existing.length) {
    const lead = existing[0];
    if (!lead.assigned_sales_agent_id && lead.assigned_agent_id) {
      await db.query(
        'UPDATE sales_leads SET assigned_sales_agent_id = ? WHERE id = ?',
        [lead.assigned_agent_id, lead.id]
      );
    }
    return res.json({ id: lead.id, created: false });
  }

  const [partner] = await db.query('SELECT id, assigned_agent_id FROM partners WHERE id = ?', [partnerId]);
  if (!partner.length) throw new AppError(404, 'Partner not found', 'NOT_FOUND');

  const id = uuidv4();
  const resolvedLeadId = await nextLeadId();
  await db.query(
    `INSERT INTO sales_leads (id, lead_id, partner_id, assigned_sales_agent_id, lead_status, lead_ranking)
     VALUES (?,?,?,?,?,?)`,
    [id, resolvedLeadId, partnerId, partner[0].assigned_agent_id ?? null, 'New', 'Medium']
  );
  res.status(201).json({ id, lead_id: resolvedLeadId, created: true });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { assigned_sales_agent_id, lead_status, lead_ranking, last_contact_date } = req.body;

  requireEnum(lead_status, VALID_LEAD_STATUSES, 'lead_status');
  requireEnum(lead_ranking, VALID_LEAD_RANKINGS, 'lead_ranking');
  requireUUID(assigned_sales_agent_id, 'assigned_sales_agent_id');
  requireDate(last_contact_date, 'last_contact_date');

  const [result] = await db.query(
    `UPDATE sales_leads SET assigned_sales_agent_id=?, lead_status=?, lead_ranking=?, last_contact_date=?
     WHERE id=?`,
    [assigned_sales_agent_id ?? null, lead_status ?? null, lead_ranking ?? null,
      last_contact_date ?? null, req.params.id]
  );
  if (result.affectedRows === 0) throw new AppError(404, 'Sales lead not found', 'NOT_FOUND');
  res.json({ message: 'Sales lead updated' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM sales_leads WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new AppError(404, 'Sales lead not found', 'NOT_FOUND');
  res.json({ message: 'Sales lead deleted' });
}));

// ── Meeting Minutes ──────────────────────────────────────────

// Helper: build the full SELECT for all minutes with joins
const MINUTES_SELECT = `
  SELECT mm.*,
    p.company_legal_name AS partner_name,
    p.trading_name       AS partner_trading_name,
    CONCAT(e.first_name, ' ', e.surname) AS sales_agent_full_name
  FROM meeting_minutes mm
  LEFT JOIN partners  p ON mm.partner_id      = p.id
  LEFT JOIN employees e ON mm.sales_agent_id  = e.id
`;

// Helper: extract + normalise the extended fields from request body
function minuteFields(body) {
  const {
    partner_id, sales_agent_id, sales_agent, contact_type,
    meeting_date, meeting_time, summary, client_needs,
    next_action, next_action_date, created_by,
    // Extended fields
    meeting_type, location, duration_minutes, purpose, key_points,
    proposed_solutions, competitors_mentioned,
    action_items, communication_methods, client_participants, company_participants,
    contact_person, status,
  } = body;

  return {
    partner_id:             partner_id ?? null,
    sales_agent_id:         sales_agent_id ?? null,
    sales_agent:            sales_agent ?? null,
    contact_type:           contact_type ?? null,
    meeting_date:           meeting_date ?? null,
    meeting_time:           meeting_time ?? null,
    summary:                summary ?? null,
    client_needs:           client_needs ?? null,
    next_action:            next_action ?? null,
    next_action_date:       next_action_date ?? null,
    created_by:             created_by ?? null,
    meeting_type:           meeting_type ?? null,
    location:               location ?? null,
    duration_minutes:       duration_minutes ?? null,
    purpose:                purpose ?? null,
    key_points:             key_points ?? null,
    proposed_solutions:     proposed_solutions ?? null,
    competitors_mentioned:  competitors_mentioned ?? null,
    action_items:           action_items != null ? JSON.stringify(action_items) : null,
    communication_methods:  communication_methods != null ? JSON.stringify(communication_methods) : null,
    client_participants:    client_participants != null ? JSON.stringify(client_participants) : null,
    company_participants:   company_participants != null ? JSON.stringify(company_participants) : null,
    contact_person:         contact_person ?? null,
    status:                 status ?? 'draft',
  };
}

// ── Lead-scoped routes ────────────────────────────────────────

router.get('/:id/minutes', asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `${MINUTES_SELECT} WHERE mm.sales_lead_id = ? ORDER BY mm.meeting_date DESC`,
    [req.params.id]
  );
  res.json(rows);
}));

router.post('/:id/minutes', asyncHandler(async (req, res) => {
  const f = minuteFields(req.body);
  if (!f.summary) {
    throw new AppError(400, 'summary is required', 'MISSING_FIELDS');
  }
  requireUUID(f.partner_id, 'partner_id');
  requireUUID(f.sales_agent_id, 'sales_agent_id');
  requireDate(f.meeting_date, 'meeting_date');
  requireDate(f.next_action_date, 'next_action_date');
  requireEnum(f.contact_type, VALID_CONTACT_TYPES, 'contact_type');
  requireEnum(f.next_action,  VALID_NEXT_ACTIONS,  'next_action');
  requireEnum(f.status,       VALID_MINUTE_STATUSES, 'status');
  requireNumber(f.duration_minutes, 'duration_minutes', { min: 0, integer: true });
  const id = uuidv4();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO meeting_minutes
         (id, sales_lead_id, partner_id, sales_agent_id, sales_agent,
          contact_type, meeting_date, meeting_time, summary, client_needs,
          next_action, next_action_date, created_by,
          meeting_type, location, duration_minutes, purpose, key_points,
          proposed_solutions, competitors_mentioned,
          action_items, communication_methods, client_participants, company_participants,
          contact_person, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, req.params.id, f.partner_id, f.sales_agent_id, f.sales_agent,
       f.contact_type, f.meeting_date, f.meeting_time, f.summary, f.client_needs,
       f.next_action, f.next_action_date, f.created_by,
       f.meeting_type, f.location, f.duration_minutes, f.purpose, f.key_points,
       f.proposed_solutions, f.competitors_mentioned,
       f.action_items, f.communication_methods, f.client_participants, f.company_participants,
       f.contact_person, f.status]
    );
    await conn.query('UPDATE sales_leads SET last_contact_date = NOW() WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.status(201).json({ id, message: 'Meeting minute created' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
