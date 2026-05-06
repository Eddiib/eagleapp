// Booking attachments: upload / list / download / delete.
// Files land in backend/uploads/bookings/<bookingId>/ and their metadata rows
// live in `booking_attachments`. Serves the right-sidebar document list on the
// Booking detail screen.
//
// Mounted in index.js under `/api/bookings/:bookingId/attachments` with
// `mergeParams: true` so :bookingId is available on req.params.

const express = require('express');
const router = express.Router({ mergeParams: true });
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads', 'bookings');
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, req.params.bookingId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 180);
    cb(null, `${uuidv4()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

async function assertBookingExists(bookingId) {
  const [rows] = await db.query('SELECT id FROM bookings WHERE id = ?', [bookingId]);
  if (!rows.length) throw new AppError(404, 'Booking not found', 'NOT_FOUND');
}

// GET list
router.get('/', asyncHandler(async (req, res) => {
  await assertBookingExists(req.params.bookingId);
  const [rows] = await db.query(
    `SELECT id, filename, original_filename, mime_type, size_bytes,
            doc_type, doc_date, uploaded_by, uploaded_at
       FROM booking_attachments
      WHERE booking_id = ?
      ORDER BY uploaded_at DESC`,
    [req.params.bookingId]
  );
  res.json(rows);
}));

// POST upload (multipart/form-data with field name 'file')
router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'No file uploaded (expected field "file")', 'NO_FILE');
  await assertBookingExists(req.params.bookingId);

  const id = uuidv4();
  const { doc_type, doc_date, uploaded_by } = req.body;
  const relPath = path.relative(
    path.join(__dirname, '..', '..'),
    req.file.path
  );

  await db.query(
    `INSERT INTO booking_attachments
       (id, booking_id, filename, original_filename, mime_type, size_bytes,
        doc_type, doc_date, storage_path, uploaded_by)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, req.params.bookingId, req.file.filename, req.file.originalname,
      req.file.mimetype, req.file.size,
      doc_type || null, doc_date || null, relPath, uploaded_by || null]
  );

  res.status(201).json({
    id,
    filename: req.file.filename,
    original_filename: req.file.originalname,
    mime_type: req.file.mimetype,
    size_bytes: req.file.size,
    doc_type: doc_type || null,
    doc_date: doc_date || null,
    uploaded_by: uploaded_by || null,
  });
}));

// GET single file (download stream)
router.get('/:attachmentId', asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    'SELECT original_filename, mime_type, storage_path FROM booking_attachments WHERE id = ? AND booking_id = ?',
    [req.params.attachmentId, req.params.bookingId]
  );
  if (!rows.length) throw new AppError(404, 'Attachment not found', 'NOT_FOUND');
  const row = rows[0];
  const absPath = path.join(__dirname, '..', '..', row.storage_path);
  if (!fs.existsSync(absPath)) throw new AppError(410, 'File missing from storage', 'FILE_MISSING');
  res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${row.original_filename}"`);
  fs.createReadStream(absPath).pipe(res);
}));

// DELETE
router.delete('/:attachmentId', asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    'SELECT storage_path FROM booking_attachments WHERE id = ? AND booking_id = ?',
    [req.params.attachmentId, req.params.bookingId]
  );
  if (!rows.length) throw new AppError(404, 'Attachment not found', 'NOT_FOUND');
  const absPath = path.join(__dirname, '..', '..', rows[0].storage_path);

  await db.query('DELETE FROM booking_attachments WHERE id = ?', [req.params.attachmentId]);
  fs.promises.unlink(absPath).catch(() => { /* best effort */ });
  res.json({ message: 'Attachment deleted' });
}));

module.exports = router;
