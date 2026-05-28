const db = require('../db');

const SYSTEM_ROLES = [
  {
    key: 'admin',
    name: 'Administrator',
    description: 'Full system access, including users, roles, settings, and audit logs.',
  },
  {
    key: 'manager',
    name: 'Manager',
    description: 'Operational management access across commercial, operations, and finance modules.',
  },
  {
    key: 'sales',
    name: 'Sales',
    description: 'Sales desk access for leads, quotations, partners, bookings, and pricing.',
  },
  {
    key: 'operations',
    name: 'Operations',
    description: 'Operational access for bookings, equipment, services, partners, and pricing.',
  },
  {
    key: 'accounting',
    name: 'Accounting',
    description: 'Finance access for costs, invoices, receivables, payables, rates, and reporting.',
  },
  {
    key: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to approved modules.',
  },
];

const MODULES = [
  { key: 'main-dashboard', name: 'Dashboard', category: 'Dashboard', sortOrder: 10 },
  { key: 'sales-leads', name: 'Sales Leads', category: 'CRM', sortOrder: 20 },
  { key: 'meeting-minutes', name: 'Meeting Minutes', category: 'CRM', sortOrder: 30 },
  { key: 'quotation-desk', name: 'Quotation Desk', category: 'CRM', sortOrder: 40 },
  { key: 'available-loads', name: 'Available Loads', category: 'Pricing', sortOrder: 50 },
  { key: 'buy-rates-contracts', name: 'Buy Rates & Contracts', category: 'Pricing', sortOrder: 60 },
  { key: 'pricing-models', name: 'Pricing Models', category: 'Pricing', sortOrder: 70 },
  { key: 'supplier-directory', name: 'Supplier Directory', category: 'Pricing', sortOrder: 80 },
  { key: 'booking-sheet', name: 'Booking Sheet', category: 'Booking Desk', sortOrder: 90 },
  { key: 'booking-details', name: 'Booking Details', category: 'Booking Desk', sortOrder: 100 },
  { key: 'booking-agent-assignment', name: 'Reassign Booking Agent', category: 'Booking Desk', sortOrder: 105 },
  { key: 'partners-management', name: 'Partners Management', category: 'Partners', sortOrder: 110 },
  { key: 'service-management', name: 'Service Management', category: 'Services', sortOrder: 120 },
  { key: 'equipment', name: 'Equipment', category: 'Services', sortOrder: 130 },
  { key: 'cost-control', name: 'Cost Control', category: 'Financials', sortOrder: 140 },
  { key: 'invoicing', name: 'Invoicing', category: 'Financials', sortOrder: 150 },
  { key: 'receivables', name: 'Receivables', category: 'Financials', sortOrder: 160 },
  { key: 'payables', name: 'Payables', category: 'Financials', sortOrder: 170 },
  { key: 'bank-transactions', name: 'Bank Transactions', category: 'Financials', sortOrder: 180 },
  { key: 'forex-management', name: 'Exchange Rates', category: 'Financials', sortOrder: 190 },
  { key: 'profit-loss', name: 'Profit & Loss', category: 'Financials', sortOrder: 200 },
  { key: 'tax-compliance', name: 'Tax Compliance', category: 'Financials', sortOrder: 210 },
  { key: 'employees', name: 'Employees', category: 'Human Resources', sortOrder: 220 },
  { key: 'user-management', name: 'User Management', category: 'Administration', sortOrder: 230 },
  { key: 'audit-log', name: 'Audit Log', category: 'Administration', sortOrder: 240 },
  { key: 'ports-management', name: 'Ports', category: 'Administration', sortOrder: 245 },
  { key: 'company-settings', name: 'Company Settings', category: 'Administration', sortOrder: 250 },
];

const ROLE_MODULE_PERMISSIONS = {
  admin: allModules({ edit: true }),
  manager: {
    'main-dashboard': 'edit',
    'sales-leads': 'edit',
    'meeting-minutes': 'edit',
    'quotation-desk': 'edit',
    'available-loads': 'edit',
    'buy-rates-contracts': 'edit',
    'pricing-models': 'edit',
    'supplier-directory': 'view',
    'booking-sheet': 'edit',
    'booking-details': 'view',
    'booking-agent-assignment': 'edit',
    'partners-management': 'edit',
    'service-management': 'edit',
    equipment: 'edit',
    'cost-control': 'edit',
    invoicing: 'edit',
    receivables: 'view',
    payables: 'view',
    'forex-management': 'edit',
    'profit-loss': 'view',
    employees: 'view',
  },
  sales: {
    'main-dashboard': 'view',
    'sales-leads': 'edit',
    'meeting-minutes': 'edit',
    'quotation-desk': 'edit',
    'available-loads': 'edit',
    'buy-rates-contracts': 'view',
    'supplier-directory': 'view',
    'booking-sheet': 'edit',
    'booking-details': 'view',
    'partners-management': 'edit',
    equipment: 'view',
  },
  operations: {
    'main-dashboard': 'view',
    'available-loads': 'edit',
    'buy-rates-contracts': 'view',
    'supplier-directory': 'view',
    'booking-sheet': 'edit',
    'booking-details': 'view',
    'partners-management': 'view',
    'service-management': 'view',
    equipment: 'edit',
  },
  accounting: {
    'main-dashboard': 'view',
    'booking-sheet': 'view',
    'booking-details': 'view',
    'partners-management': 'view',
    'cost-control': 'edit',
    invoicing: 'edit',
    receivables: 'edit',
    payables: 'edit',
    'forex-management': 'edit',
    'profit-loss': 'view',
  },
  viewer: {
    'main-dashboard': 'view',
    'sales-leads': 'view',
    'meeting-minutes': 'view',
    'quotation-desk': 'view',
    'booking-sheet': 'view',
    'booking-details': 'view',
    'partners-management': 'view',
    'service-management': 'view',
    equipment: 'view',
    'cost-control': 'view',
    employees: 'view',
  },
};

function allModules({ edit = false } = {}) {
  return Object.fromEntries(MODULES.map((module) => [module.key, edit ? 'edit' : 'view']));
}

function isRoleKey(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{1,49}$/.test(value);
}

function normalizePermissions(input = {}) {
  const byModule = new Map(MODULES.map((module) => [module.key, { view: false, edit: false }]));

  if (Array.isArray(input)) {
    for (const permission of input) {
      if (typeof permission !== 'string') continue;
      const [action, moduleKey] = permission.split(':');
      if (!byModule.has(moduleKey)) continue;
      if (action === 'view') byModule.get(moduleKey).view = true;
      if (action === 'edit') {
        byModule.get(moduleKey).view = true;
        byModule.get(moduleKey).edit = true;
      }
    }
    return byModule;
  }

  if (input && typeof input === 'object') {
    for (const [moduleKey, value] of Object.entries(input)) {
      if (!byModule.has(moduleKey)) continue;
      if (value === 'edit') {
        byModule.set(moduleKey, { view: true, edit: true });
      } else if (value === 'view') {
        byModule.set(moduleKey, { view: true, edit: false });
      } else if (value && typeof value === 'object') {
        const canEdit = Boolean(value.edit ?? value.can_edit ?? value.canEdit);
        const canView = canEdit || Boolean(value.view ?? value.can_view ?? value.canView);
        byModule.set(moduleKey, { view: canView, edit: canEdit });
      }
    }
  }

  return byModule;
}

function permissionStringsFromRows(rows) {
  const permissions = new Set();
  for (const row of rows) {
    if (row.can_view) permissions.add(`view:${row.module_key}`);
    if (row.can_edit) {
      permissions.add(`view:${row.module_key}`);
      permissions.add(`edit:${row.module_key}`);
    }
  }
  return Array.from(permissions).sort();
}

function defaultPermissionsForRole(roleKey) {
  const modulePermissions = normalizePermissions(ROLE_MODULE_PERMISSIONS[roleKey] || {});
  const rows = [];
  for (const [moduleKey, permission] of modulePermissions) {
    if (permission.view || permission.edit) {
      rows.push({
        module_key: moduleKey,
        can_view: permission.view ? 1 : 0,
        can_edit: permission.edit ? 1 : 0,
      });
    }
  }
  return permissionStringsFromRows(rows);
}

async function getActiveRole(roleKey) {
  if (!isRoleKey(roleKey)) return null;
  try {
    const [rows] = await db.query(
      'SELECT role_key, role_name, description, is_system, is_active FROM roles WHERE role_key = ? AND is_active = 1',
      [roleKey]
    );
    return rows[0] || SYSTEM_ROLES.find((role) => role.key === roleKey) || null;
  } catch (err) {
    return SYSTEM_ROLES.find((role) => role.key === roleKey) || null;
  }
}

async function getRolePermissions(roleKey) {
  if (!isRoleKey(roleKey)) return [];
  try {
    const [rows] = await db.query(
      `SELECT module_key, can_view, can_edit
       FROM role_module_permissions
       WHERE role_key = ?`,
      [roleKey]
    );
    if (!rows.length && SYSTEM_ROLES.some((role) => role.key === roleKey)) {
      return defaultPermissionsForRole(roleKey);
    }
    return permissionStringsFromRows(rows);
  } catch (err) {
    return defaultPermissionsForRole(roleKey);
  }
}

async function getAssignableRoles() {
  const [rows] = await db.query(
    `SELECT role_key, role_name, description, is_system, is_active, created_at, updated_at
     FROM roles
     WHERE is_active = 1
     ORDER BY is_system DESC, role_name`
  );
  return rows;
}

function canAccess(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

module.exports = {
  SYSTEM_ROLES,
  MODULES,
  ROLE_MODULE_PERMISSIONS,
  isRoleKey,
  normalizePermissions,
  permissionStringsFromRows,
  defaultPermissionsForRole,
  getActiveRole,
  getRolePermissions,
  getAssignableRoles,
  canAccess,
};
