// Public branding — minimal company info needed before login (logo + names).
// Mounted without auth so the LoginPage can render the company logo.

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

async function loadSettings() {
  const [rows] = await db.query(
    "SELECT trading_name, legal_name, logo_storage_path, logo_mime_type FROM company_settings WHERE id = 'singleton'",
  );
  return rows[0] || null;
}

router.get('/', asyncHandler(async (_req, res) => {
  const row = await loadSettings();
  res.json({
    trading_name: row?.trading_name ?? null,
    legal_name: row?.legal_name ?? null,
    has_logo: Boolean(row?.logo_storage_path),
    logo_url: row?.logo_storage_path ? '/api/branding/logo' : null,
  });
}));

router.get('/logo', asyncHandler(async (_req, res) => {
  const row = await loadSettings();
  if (!row?.logo_storage_path) throw new AppError(404, 'No logo uploaded', 'NO_LOGO');
  const abs = path.join(__dirname, '..', '..', row.logo_storage_path);
  if (!fs.existsSync(abs)) throw new AppError(410, 'Logo file missing', 'LOGO_MISSING');
  res.setHeader('Content-Type', row.logo_mime_type || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=300');
  fs.createReadStream(abs).pipe(res);
}));

module.exports = router;
