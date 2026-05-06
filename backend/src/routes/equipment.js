const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { requireFields } = require('../middleware/validate');

// GET all equipment
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM equipment ORDER BY category, equipment_code');
    res.json(rows);
  } catch (err) { next(err); }
});

// GET single equipment
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM equipment WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Equipment not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST create equipment
router.post('/', async (req, res, next) => {
  try {
    requireFields(req.body, ['equipment_code', 'equipment_name', 'category']);
    const id = uuidv4();
    const { equipment_code, equipment_name, category, size, specifications, teu_equivalent, is_active, notes, created_by } = req.body;
    await db.query(
      `INSERT INTO equipment (id, equipment_code, equipment_name, category, size, specifications, teu_equivalent, is_active, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, equipment_code, equipment_name, category, size, specifications, teu_equivalent, is_active ? 1 : 0, notes, created_by]
    );
    res.status(201).json({ id, message: 'Equipment created' });
  } catch (err) { next(err); }
});

// PUT update equipment
router.put('/:id', async (req, res, next) => {
  try {
    const { equipment_name, category, size, specifications, teu_equivalent, is_active, notes, updated_by } = req.body;
    await db.query(
      `UPDATE equipment SET equipment_name=?, category=?, size=?, specifications=?, teu_equivalent=?, is_active=?, notes=?, updated_by=?
       WHERE id=?`,
      [equipment_name, category, size, specifications, teu_equivalent, is_active ? 1 : 0, notes, updated_by, req.params.id]
    );
    res.json({ message: 'Equipment updated' });
  } catch (err) { next(err); }
});

// DELETE equipment
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM equipment WHERE id = ?', [req.params.id]);
    res.json({ message: 'Equipment deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
