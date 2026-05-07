const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const {
  SYSTEM_ROLES,
  getActiveRole,
  getRolePermissions,
  canAccess,
} = require('../lib/permissions');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Add it to backend/.env');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const ROLES = SYSTEM_ROLES.map((role) => role.key);

async function verifyToken(req, _res, next) {
  const header = req.headers['authorization'];
  if (!header) return next(new AppError(401, 'No token provided', 'NO_TOKEN'));

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const role = await getActiveRole(payload.role);
    if (!role) {
      return next(new AppError(401, 'Invalid role in token', 'INVALID_ROLE'));
    }

    req.user = {
      ...payload,
      role: role.role_key || role.key,
      role_name: role.role_name || role.name,
      permissions: await getRolePermissions(payload.role),
    };
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

function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
    if (!canAccess(req.user, permission)) {
      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
}

function requireModuleAccess(moduleResolver) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
    const moduleKey = typeof moduleResolver === 'function' ? moduleResolver(req) : moduleResolver;
    const action = ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? 'view' : 'edit';
    const permission = `${action}:${moduleKey}`;
    if (!canAccess(req.user, permission)) {
      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  requireModuleAccess,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ROLES,
};
