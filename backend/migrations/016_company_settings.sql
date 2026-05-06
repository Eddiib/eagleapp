-- 016_company_settings.sql
-- Singleton row holding app-wide company / branding / invoicing defaults.
-- Enforced as singleton via a CHECK/UNIQUE on a fixed `id = 'singleton'` key.

CREATE TABLE IF NOT EXISTS company_settings (
  id                  VARCHAR(36)   PRIMARY KEY DEFAULT 'singleton',
  legal_name          VARCHAR(255),
  trading_name        VARCHAR(255),
  registration_number VARCHAR(100),
  tax_number          VARCHAR(100),
  vat_number          VARCHAR(100),
  eori_number         VARCHAR(100),
  address_line        VARCHAR(255),
  city                VARCHAR(100),
  country             VARCHAR(100),
  zip_code            VARCHAR(40),
  phone               VARCHAR(60),
  email               VARCHAR(255),
  website             VARCHAR(255),
  default_currency    CHAR(3)       DEFAULT 'EUR',
  invoice_prefix      VARCHAR(20)   DEFAULT 'INV',
  payment_terms       VARCHAR(100),
  bank_details        TEXT,
  invoice_footer      TEXT,
  logo_storage_path   VARCHAR(500),
  logo_mime_type      VARCHAR(100),
  logo_size_bytes     INT,
  updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by          VARCHAR(36)
);

INSERT IGNORE INTO company_settings (id) VALUES ('singleton');
