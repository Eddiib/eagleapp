-- Migration 008: extend cost_control with selling-side fields and exchange rates

ALTER TABLE cost_control
  ADD COLUMN buying_exchange_rate  DECIMAL(12,6) NULL DEFAULT 1.000000,
  ADD COLUMN selling_price         DECIMAL(15,2) NULL DEFAULT 0,
  ADD COLUMN selling_currency      VARCHAR(10)   NULL DEFAULT 'USD',
  ADD COLUMN selling_exchange_rate DECIMAL(12,6) NULL DEFAULT 1.000000,
  ADD COLUMN selling_invoice_number VARCHAR(50)  NULL,
  ADD COLUMN selling_invoice_date  DATE          NULL,
  ADD COLUMN client_id             VARCHAR(36)   NULL,
  ADD COLUMN quantity              DECIMAL(12,4) NULL DEFAULT 1,
  ADD COLUMN is_locked             TINYINT(1)    NOT NULL DEFAULT 0,
  ADD COLUMN last_modified_by      VARCHAR(100)  NULL,
  ADD COLUMN last_modified_at      DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  ADD CONSTRAINT fk_cc_client FOREIGN KEY (client_id) REFERENCES partners(id) ON DELETE SET NULL;
