ALTER TABLE users
  MODIFY role VARCHAR(50) NOT NULL DEFAULT 'viewer';

CREATE TABLE IF NOT EXISTS roles (
  role_key    VARCHAR(50)  PRIMARY KEY,
  role_name   VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   TINYINT(1)   NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
  module_key  VARCHAR(80)  PRIMARY KEY,
  module_name VARCHAR(120) NOT NULL,
  category    VARCHAR(80)  NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_module_permissions (
  role_key   VARCHAR(50) NOT NULL,
  module_key VARCHAR(80) NOT NULL,
  can_view   TINYINT(1)  NOT NULL DEFAULT 0,
  can_edit   TINYINT(1)  NOT NULL DEFAULT 0,
  updated_at DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (role_key, module_key),
  CONSTRAINT fk_role_module_permissions_role
    FOREIGN KEY (role_key) REFERENCES roles(role_key) ON DELETE CASCADE,
  CONSTRAINT fk_role_module_permissions_module
    FOREIGN KEY (module_key) REFERENCES modules(module_key) ON DELETE CASCADE
);

INSERT INTO roles (role_key, role_name, description, is_system, is_active) VALUES
  ('admin', 'Administrator', 'Full system access, including users, roles, settings, and audit logs.', 1, 1),
  ('manager', 'Manager', 'Operational management access across commercial, operations, and finance modules.', 1, 1),
  ('sales', 'Sales', 'Sales desk access for leads, quotations, partners, bookings, and pricing.', 1, 1),
  ('operations', 'Operations', 'Operational access for bookings, equipment, services, partners, and pricing.', 1, 1),
  ('accounting', 'Accounting', 'Finance access for costs, invoices, receivables, payables, rates, and reporting.', 1, 1),
  ('viewer', 'Viewer', 'Read-only access to approved modules.', 1, 1)
ON DUPLICATE KEY UPDATE
  role_name = VALUES(role_name),
  description = VALUES(description),
  is_system = VALUES(is_system),
  is_active = VALUES(is_active);

INSERT INTO modules (module_key, module_name, category, sort_order, is_active) VALUES
  ('main-dashboard', 'Dashboard', 'Dashboard', 10, 1),
  ('sales-leads', 'Sales Leads', 'CRM', 20, 1),
  ('meeting-minutes', 'Meeting Minutes', 'CRM', 30, 1),
  ('quotation-desk', 'Quotation Desk', 'CRM', 40, 1),
  ('available-loads', 'Available Loads', 'Pricing', 50, 1),
  ('buy-rates-contracts', 'Buy Rates & Contracts', 'Pricing', 60, 1),
  ('pricing-models', 'Pricing Models', 'Pricing', 70, 1),
  ('supplier-directory', 'Supplier Directory', 'Pricing', 80, 1),
  ('booking-sheet', 'Booking Sheet', 'Booking Desk', 90, 1),
  ('booking-details', 'Booking Details', 'Booking Desk', 100, 1),
  ('partners-management', 'Partners Management', 'Partners', 110, 1),
  ('service-management', 'Service Management', 'Services', 120, 1),
  ('equipment', 'Equipment', 'Services', 130, 1),
  ('cost-control', 'Cost Control', 'Financials', 140, 1),
  ('invoicing', 'Invoicing', 'Financials', 150, 1),
  ('receivables', 'Receivables', 'Financials', 160, 1),
  ('payables', 'Payables', 'Financials', 170, 1),
  ('bank-transactions', 'Bank Transactions', 'Financials', 180, 1),
  ('forex-management', 'Exchange Rates', 'Financials', 190, 1),
  ('profit-loss', 'Profit & Loss', 'Financials', 200, 1),
  ('tax-compliance', 'Tax Compliance', 'Financials', 210, 1),
  ('employees', 'Employees', 'Human Resources', 220, 1),
  ('user-management', 'User Management', 'Administration', 230, 1),
  ('audit-log', 'Audit Log', 'Administration', 240, 1),
  ('company-settings', 'Company Settings', 'Administration', 250, 1)
ON DUPLICATE KEY UPDATE
  module_name = VALUES(module_name),
  category = VALUES(category),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);

INSERT INTO role_module_permissions (role_key, module_key, can_view, can_edit)
SELECT 'admin', module_key, 1, 1 FROM modules
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_edit = VALUES(can_edit);

INSERT INTO role_module_permissions (role_key, module_key, can_view, can_edit) VALUES
  ('manager', 'main-dashboard', 1, 1),
  ('manager', 'sales-leads', 1, 1),
  ('manager', 'meeting-minutes', 1, 1),
  ('manager', 'quotation-desk', 1, 1),
  ('manager', 'available-loads', 1, 1),
  ('manager', 'buy-rates-contracts', 1, 1),
  ('manager', 'pricing-models', 1, 1),
  ('manager', 'supplier-directory', 1, 0),
  ('manager', 'booking-sheet', 1, 1),
  ('manager', 'booking-details', 1, 0),
  ('manager', 'partners-management', 1, 1),
  ('manager', 'service-management', 1, 1),
  ('manager', 'equipment', 1, 1),
  ('manager', 'cost-control', 1, 1),
  ('manager', 'invoicing', 1, 1),
  ('manager', 'receivables', 1, 0),
  ('manager', 'payables', 1, 0),
  ('manager', 'forex-management', 1, 1),
  ('manager', 'profit-loss', 1, 0),
  ('manager', 'employees', 1, 0),
  ('sales', 'main-dashboard', 1, 0),
  ('sales', 'sales-leads', 1, 1),
  ('sales', 'meeting-minutes', 1, 1),
  ('sales', 'quotation-desk', 1, 1),
  ('sales', 'available-loads', 1, 1),
  ('sales', 'buy-rates-contracts', 1, 0),
  ('sales', 'supplier-directory', 1, 0),
  ('sales', 'booking-sheet', 1, 1),
  ('sales', 'booking-details', 1, 0),
  ('sales', 'partners-management', 1, 1),
  ('sales', 'equipment', 1, 0),
  ('operations', 'main-dashboard', 1, 0),
  ('operations', 'available-loads', 1, 1),
  ('operations', 'buy-rates-contracts', 1, 0),
  ('operations', 'supplier-directory', 1, 0),
  ('operations', 'booking-sheet', 1, 1),
  ('operations', 'booking-details', 1, 0),
  ('operations', 'partners-management', 1, 0),
  ('operations', 'service-management', 1, 0),
  ('operations', 'equipment', 1, 1),
  ('accounting', 'main-dashboard', 1, 0),
  ('accounting', 'booking-sheet', 1, 0),
  ('accounting', 'booking-details', 1, 0),
  ('accounting', 'partners-management', 1, 0),
  ('accounting', 'cost-control', 1, 1),
  ('accounting', 'invoicing', 1, 1),
  ('accounting', 'receivables', 1, 1),
  ('accounting', 'payables', 1, 1),
  ('accounting', 'forex-management', 1, 1),
  ('accounting', 'profit-loss', 1, 0),
  ('viewer', 'main-dashboard', 1, 0),
  ('viewer', 'sales-leads', 1, 0),
  ('viewer', 'meeting-minutes', 1, 0),
  ('viewer', 'quotation-desk', 1, 0),
  ('viewer', 'booking-sheet', 1, 0),
  ('viewer', 'booking-details', 1, 0),
  ('viewer', 'partners-management', 1, 0),
  ('viewer', 'service-management', 1, 0),
  ('viewer', 'equipment', 1, 0),
  ('viewer', 'cost-control', 1, 0),
  ('viewer', 'employees', 1, 0)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_edit = VALUES(can_edit);
