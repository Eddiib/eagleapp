export const MODULE_PATHS: Record<string, string> = {
  'main-dashboard':       '/',
  'sales-leads':          '/crm/leads',
  'meeting-minutes':      '/crm/meetings',
  'quotation-desk':       '/crm/quotations',
  'available-loads':      '/pricing/loads',
  'buy-rates-contracts':  '/pricing/rates',
  'pricing-models':       '/pricing/models',
  'supplier-directory':   '/pricing/suppliers',
  'booking-sheet':        '/bookings',
  'booking-details':      '/bookings/details',
  'new-booking':          '/bookings/new',
  'partners-management':  '/partners',
  'service-management':   '/services',
  'equipment':            '/services/equipment',
  'cost-control':         '/financials/costs',
  'invoicing':            '/financials/invoicing',
  'receivables':          '/financials/receivables',
  'payables':             '/financials/payables',
  'bank-transactions':    '/financials/bank-transactions',
  'forex-management':     '/financials/exchange-rates',
  'profit-loss':          '/financials/pnl',
  'tax-compliance':       '/financials/tax',
  'employees':            '/hr/employees',
  'user-management':      '/admin/users',
  'audit-log':            '/admin/audit-log',
  'company-settings':     '/admin/settings',
  'administration':       '/admin',
};

const PATH_TO_MODULE: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_PATHS).map(([id, path]) => [path, id]),
);

export function pathToModuleId(pathname: string): string {
  return PATH_TO_MODULE[pathname] ?? 'main-dashboard';
}

export function moduleIdToPath(moduleId: string): string {
  return MODULE_PATHS[moduleId] ?? '/';
}

export const MODULE_TITLES: Record<string, string> = {
  'main-dashboard':       'Dashboard',
  'sales-leads':          'Sales Leads',
  'meeting-minutes':      'Meeting Minutes',
  'quotation-desk':       'Quotation Desk',
  'available-loads':      'Available Loads',
  'buy-rates-contracts':  'Buy Rates & Contracts',
  'pricing-models':       'Pricing Models',
  'supplier-directory':   'Supplier Directory',
  'booking-sheet':        'Booking Sheet',
  'booking-details':      'Booking Details',
  'new-booking':          'New Booking',
  'partners-management':  'Partners',
  'service-management':   'Service Management',
  'equipment':            'Equipment',
  'cost-control':         'Cost Control',
  'invoicing':            'Invoicing',
  'receivables':          'Receivables',
  'payables':             'Payables',
  'bank-transactions':    'Bank Transactions',
  'forex-management':     'Forex Management',
  'profit-loss':          'Profit & Loss',
  'tax-compliance':       'Tax Compliance',
  'employees':            'Employees',
  'user-management':      'User Management',
  'audit-log':            'Audit Log',
  'company-settings':     'Company Settings',
  'administration':       'Administration',
};

export function pathToTitle(pathname: string): string {
  return MODULE_TITLES[pathToModuleId(pathname)] ?? 'Page';
}
