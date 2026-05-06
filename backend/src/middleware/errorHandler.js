// Centralised error handling. Backend routes throw AppError (or any Error);
// this middleware shapes the response so the frontend can parse `data.error`
// (string message) and optionally `data.code` (machine-readable code).

class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'ERROR';
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
}

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate value', code: 'DUPLICATE' });
  }
  if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referenced record not found', code: 'FK_VIOLATION' });
  }
  // Unexpected — log server-side, return generic message
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL' });
}

module.exports = { AppError, asyncHandler, errorHandler, notFoundHandler };
