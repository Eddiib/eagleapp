// Company settings — singleton row at id='singleton'.
// GET is open to any authenticated user (logo + defaults are used across
// the app). PUT and logo upload/delete require admin.

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { requirePermission } = require('../middleware/auth');
const { requireString, requireNumber } = require('../middleware/validate');

const LOGO_DIR = path.join(__dirname, '..', '..', 'uploads', 'company');
const MAX_LOGO_BYTES = 512 * 1024; // 512 KB
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']);

fs.mkdirSync(LOGO_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, LOGO_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^.\w]/g, '') || '.bin';
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_LOGO_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new AppError(400, `Unsupported logo type: ${file.mimetype}. Use PNG, JPEG, SVG or WebP.`, 'INVALID_LOGO_TYPE'));
    }
    cb(null, true);
  },
});

const UPDATABLE_FIELDS = [
  'legal_name', 'trading_name', 'registration_number', 'tax_number', 'vat_number',
  'eori_number', 'address_line', 'city', 'country', 'zip_code',
  'phone', 'email', 'website',
  'default_currency', 'invoice_prefix', 'payment_terms', 'bank_details', 'invoice_footer',
];

function publicShape(row) {
  if (!row) return null;
  const hasLogo = Boolean(row.logo_storage_path);
  const { logo_storage_path: _lsp, ...rest } = row;
  return {
    ...rest,
    has_logo: hasLogo,
    logo_url: hasLogo ? `/api/company-settings/logo` : null,
  };
}

async function loadSettings() {
  const [rows] = await db.query('SELECT * FROM company_settings WHERE id = ?', ['singleton']);
  return rows[0] || null;
}

router.get('/', asyncHandler(async (_req, res) => {
  const row = await loadSettings();
  res.json(publicShape(row));
}));

// GET /logo — stream the current logo. Open to any authenticated user.
router.get('/logo', asyncHandler(async (_req, res) => {
  const row = await loadSettings();
  if (!row || !row.logo_storage_path) throw new AppError(404, 'No logo uploaded', 'NO_LOGO');
  const abs = path.join(__dirname, '..', '..', row.logo_storage_path);
  if (!fs.existsSync(abs)) throw new AppError(410, 'Logo file missing', 'LOGO_MISSING');
  res.setHeader('Content-Type', row.logo_mime_type || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=300');
  fs.createReadStream(abs).pipe(res);
}));

router.put('/', requirePermission('edit:company-settings'), asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (body.email !== undefined && body.email !== null && String(body.email).trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
      throw new AppError(400, 'email is not a valid address', 'INVALID_EMAIL');
    }
  }
  if (body.default_currency !== undefined && body.default_currency !== null && String(body.default_currency).trim()) {
    const cur = String(body.default_currency).toUpperCase();
    if (!/^[A-Z]{3}$/.test(cur)) {
      throw new AppError(400, 'default_currency must be a 3-letter code', 'INVALID_CURRENCY');
    }
    body.default_currency = cur;
  }
  if (body.invoice_prefix !== undefined && body.invoice_prefix !== null) {
    requireString(body.invoice_prefix, 'invoice_prefix', { maxLength: 20 });
  }

  const assignments = [];
  const values = [];
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) {
      assignments.push(`${field} = ?`);
      values.push(body[field] === '' ? null : body[field]);
    }
  }
  if (!assignments.length) {
    return res.json(publicShape(await loadSettings()));
  }
  assignments.push('updated_by = ?');
  values.push(req.user?.id ?? null);

  await db.query(
    `UPDATE company_settings SET ${assignments.join(', ')} WHERE id = 'singleton'`,
    values,
  );
  res.json(publicShape(await loadSettings()));
}));

// POST /logo — multipart upload (field name "logo"). Replaces existing logo.
router.post('/logo', requirePermission('edit:company-settings'), upload.single('logo'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'No file uploaded (expected field "logo")', 'NO_FILE');

  const existing = await loadSettings();
  const relPath = path.relative(path.join(__dirname, '..', '..'), req.file.path);

  await db.query(
    `UPDATE company_settings
        SET logo_storage_path = ?, logo_mime_type = ?, logo_size_bytes = ?, updated_by = ?
      WHERE id = 'singleton'`,
    [relPath, req.file.mimetype, req.file.size, req.user?.id ?? null],
  );

  if (existing?.logo_storage_path) {
    const oldAbs = path.join(__dirname, '..', '..', existing.logo_storage_path);
    fs.promises.unlink(oldAbs).catch(() => { /* best effort */ });
  }

  res.status(201).json(publicShape(await loadSettings()));
}));

router.delete('/logo', requirePermission('edit:company-settings'), asyncHandler(async (_req, res) => {
  const existing = await loadSettings();
  if (!existing?.logo_storage_path) throw new AppError(404, 'No logo to delete', 'NO_LOGO');

  await db.query(
    `UPDATE company_settings
        SET logo_storage_path = NULL, logo_mime_type = NULL, logo_size_bytes = NULL
      WHERE id = 'singleton'`,
  );
  const abs = path.join(__dirname, '..', '..', existing.logo_storage_path);
  fs.promises.unlink(abs).catch(() => { /* best effort */ });
  res.json(publicShape(await loadSettings()));
}));

module.exports = router;
