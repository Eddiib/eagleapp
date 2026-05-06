const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { requireFields, requireEmail } = require('../middleware/validate');

// GET all employees
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY first_name, surname');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create employee
router.post('/', async (req, res, next) => {
  try {
    requireFields(req.body, ['employee_code', 'first_name', 'surname']);
    requireEmail(req.body.email);
    requireEmail(req.body.personal_email, 'personal_email');
    const id = uuidv4();
    const {
      employee_code, first_name, surname, position, department, is_active, is_sales_person,
      date_of_hire, email, phone, date_of_birth, personal_id, gender, address, city, country,
      date_of_termination, employment_type, is_manager, has_system_access, personal_email,
      mobile_phone, emergency_contact_name, emergency_contact_phone, salary_type,
      basic_salary, currency, iban, tax_code, notes
    } = req.body;

    await db.query(
      `INSERT INTO employees (id, employee_code, first_name, surname, position, department,
        is_active, is_sales_person, date_of_hire, email, phone, date_of_birth, personal_id,
        gender, address, city, country, date_of_termination, employment_type, is_manager,
        has_system_access, personal_email, mobile_phone, emergency_contact_name,
        emergency_contact_phone, salary_type, basic_salary, currency, iban, tax_code, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, employee_code, first_name, surname, position, department,
        is_active ? 1 : 0, is_sales_person ? 1 : 0, date_of_hire, email, phone, date_of_birth,
        personal_id, gender, address, city, country, date_of_termination, employment_type,
        is_manager ? 1 : 0, has_system_access ? 1 : 0, personal_email, mobile_phone,
        emergency_contact_name, emergency_contact_phone, salary_type, basic_salary,
        currency, iban, tax_code, notes]
    );

    res.status(201).json({ id, message: 'Employee created' });
  } catch (err) { next(err); }
});

// PUT update employee
router.put('/:id', async (req, res, next) => {
  try {
    requireEmail(req.body && req.body.email);
    requireEmail(req.body && req.body.personal_email, 'personal_email');
    const {
      first_name, surname, position, department, is_active, is_sales_person,
      date_of_hire, email, phone, date_of_birth, personal_id, gender, address, city, country,
      date_of_termination, employment_type, is_manager, has_system_access, personal_email,
      mobile_phone, emergency_contact_name, emergency_contact_phone, salary_type,
      basic_salary, currency, iban, tax_code, notes
    } = req.body;

    await db.query(
      `UPDATE employees SET first_name=?, surname=?, position=?, department=?,
        is_active=?, is_sales_person=?, date_of_hire=?, email=?, phone=?, date_of_birth=?,
        personal_id=?, gender=?, address=?, city=?, country=?, date_of_termination=?,
        employment_type=?, is_manager=?, has_system_access=?, personal_email=?, mobile_phone=?,
        emergency_contact_name=?, emergency_contact_phone=?, salary_type=?, basic_salary=?,
        currency=?, iban=?, tax_code=?, notes=?
       WHERE id=?`,
      [first_name, surname, position, department, is_active ? 1 : 0, is_sales_person ? 1 : 0,
        date_of_hire, email, phone, date_of_birth, personal_id, gender, address, city, country,
        date_of_termination, employment_type, is_manager ? 1 : 0, has_system_access ? 1 : 0,
        personal_email, mobile_phone, emergency_contact_name, emergency_contact_phone,
        salary_type, basic_salary, currency, iban, tax_code, notes, req.params.id]
    );

    res.json({ message: 'Employee updated' });
  } catch (err) { next(err); }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
