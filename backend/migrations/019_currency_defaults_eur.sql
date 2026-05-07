-- Migration 019: align database fallback currency defaults with company settings.
-- Runtime API writes read company_settings.default_currency; these DEFAULTs are
-- only the final DB-level safety net for direct inserts and omitted fields.

ALTER TABLE bookings
  MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EUR';

ALTER TABLE booking_services
  MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EUR';

ALTER TABLE quotations
  MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EUR';

ALTER TABLE quotation_services
  MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EUR';

ALTER TABLE cost_control
  MODIFY COLUMN currency VARCHAR(10) DEFAULT 'EUR';

ALTER TABLE cost_control
  MODIFY COLUMN selling_currency VARCHAR(10) NULL DEFAULT 'EUR';

ALTER TABLE invoices
  MODIFY COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

ALTER TABLE invoice_lines
  MODIFY COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

ALTER TABLE pricing_quotes
  MODIFY COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

ALTER TABLE pricing_contracts
  MODIFY COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

ALTER TABLE services
  MODIFY COLUMN default_currency VARCHAR(10) NULL DEFAULT 'EUR';
