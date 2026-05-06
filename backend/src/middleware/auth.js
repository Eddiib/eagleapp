const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Add it to backend/.env');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const ROLES = ['admin', 'manager', 'sales', 'operations', 'accounting', 'viewer'];

function verifyToken(req, _res, next) {
  const header = req.headers['authorization'];
  if (!header) return next(new AppError(401, 'No token provided', 'NO_TOKEN'));

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!ROLES.includes(payload.role)) {
      return next(new AppError(401, 'Invalid role in token', 'INVALID_ROLE'));
    }
    req.user = payload;
    next();
  } catch (err) {
    const code = err && err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    next(new AppError(401, 'Invalid or expired token', code));
  }
}

// Middleware factory: requireRole('admin', 'manager')
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, JWT_SECRET, JWT_EXPIRES_IN, ROLES };
