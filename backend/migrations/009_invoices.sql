-- Migration 009: invoices and invoice_lines tables

CREATE TABLE IF NOT EXISTS invoices (
  id                VARCHAR(36)   NOT NULL PRIMARY KEY,
  invoice_number    VARCHAR(50)   NOT NULL UNIQUE,
  invoice_type      ENUM('Sales','Purchase','Credit Note') NOT NULL DEFAULT 'Sales',
  status            ENUM('Draft','Sent','Paid','Overdue','Cancelled','Void') NOT NULL DEFAULT 'Draft',
  client_id         VARCHAR(36)   NULL,
  booking_id        VARCHAR(36)   NULL,
  invoice_date      DATE          NOT NULL,
  due_date          DATE          NULL,
  currency          VARCHAR(10)   NOT NULL DEFAULT 'USD',
  exchange_rate     DECIMAL(12,6) NOT NULL DEFAULT 1.000000,
  subtotal          DECIMAL(15,2) NOT NULL DEFAULT 0,
  vat_amount        DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_paid       DECIMAL(15,2) NOT NULL DEFAULT 0,
  balance_due       DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  notes             TEXT          NULL,
  payment_terms     VARCHAR(100)  NULL,
  bank_details      TEXT          NULL,
  created_by        VARCHAR(100)  NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified_by  VARCHAR(100)  NULL,
  last_modified_at  DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_client  FOREIGN KEY (client_id)  REFERENCES partners(id) ON DELETE SET NULL,
  CONSTRAINT fk_inv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id                VARCHAR(36)    NOT NULL PRIMARY KEY,
  invoice_id        VARCHAR(36)    NOT NULL,
  sort_order        INT            NOT NULL DEFAULT 0,
  service_id        VARCHAR(36)    NULL,
  description       VARCHAR(500)   NOT NULL DEFAULT '',
  quantity          DECIMAL(12,4)  NOT NULL DEFAULT 1,
  unit_price        DECIMAL(15,2)  NOT NULL DEFAULT 0,
  vat_rate          DECIMAL(6,4)   NOT NULL DEFAULT 0,
  line_total        DECIMAL(15,2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
  vat_amount        DECIMAL(15,2)  GENERATED ALWAYS AS (quantity * unit_price * vat_rate) STORED,
  currency          VARCHAR(10)    NOT NULL DEFAULT 'USD',
  CONSTRAINT fk_invl_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_invl_service FOREIGN KEY (service_id) REFERENCES services(id)  ON DELETE SET NULL
);
