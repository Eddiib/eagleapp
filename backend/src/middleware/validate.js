// Lightweight request validation helpers. No external deps.
// Each helper throws AppError(400, ...) on failure so errorHandler picks it up.

const { AppError } = require('./errorHandler');

const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;

function requireFields(body, fields) {
  if (!body || typeof body !== 'object') {
    throw new AppError(400, 'Request body must be a JSON object', 'INVALID_BODY');
  }
  const missing = fields.filter(f => {
    const v = body[f];
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  });
  if (missing.length) {
    throw new AppError(
      400,
      `Missing required field(s): ${missing.join(', ')}`,
      'MISSING_FIELDS'
    );
  }
}

function requireEnum(value, allowed, fieldName) {
  if (value === undefined || value === null) return; // use requireFields for required
  if (!allowed.includes(value)) {
    throw new AppError(
      400,
      `Invalid ${fieldName}: must be one of ${allowed.join(', ')}`,
      'INVALID_ENUM'
    );
  }
}

function requireEmail(value, fieldName = 'email') {
  if (value === undefined || value === null || value === '') return;
  // pragmatic regex — not RFC-perfect but rejects obvious junk
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new AppError(400, `Invalid ${fieldName}`, 'INVALID_EMAIL');
  }
}

function requireNumber(value, fieldName, { min, max, integer = false } = {}) {
  if (value === undefined || value === null || value === '') return;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new AppError(400, `Invalid ${fieldName}: must be a number`, 'INVALID_NUMBER');
  }
  if (integer && !Number.isInteger(n)) {
    throw new AppError(400, `Invalid ${fieldName}: must be an integer`, 'INVALID_NUMBER');
  }
  if (min !== undefined && n < min) {
    throw new AppError(400, `Invalid ${fieldName}: must be ≥ ${min}`, 'INVALID_NUMBER');
  }
  if (max !== undefined && n > max) {
    throw new AppError(400, `Invalid ${fieldName}: must be ≤ ${max}`, 'INVALID_NUMBER');
  }
}

function requireUUID(value, fieldName) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new AppError(400, `Invalid ${fieldName}: must be a UUID`, 'INVALID_UUID');
  }
}

function requireDate(value, fieldName) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string' || !DATE_RE.test(value) || Number.isNaN(Date.parse(value))) {
    throw new AppError(400, `Invalid ${fieldName}: must be YYYY-MM-DD`, 'INVALID_DATE');
  }
}

function requireArray(value, fieldName) {
  if (value === undefined || value === null) return;
  if (!Array.isArray(value)) {
    throw new AppError(400, `Invalid ${fieldName}: must be an array`, 'INVALID_ARRAY');
  }
}

function requireString(value, fieldName, { maxLength } = {}) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string') {
    throw new AppError(400, `Invalid ${fieldName}: must be a string`, 'INVALID_STRING');
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new AppError(400, `Invalid ${fieldName}: exceeds ${maxLength} chars`, 'INVALID_STRING');
  }
}

module.exports = {
  requireFields, requireEnum, requireEmail,
  requireNumber, requireUUID, requireDate, requireArray, requireString,
};
