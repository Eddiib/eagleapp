-- Configurable booking statuses with display colors.
-- Replaces the previously hardcoded status list; managed from Settings.
-- `color` is a hex string (e.g. #2563eb) rendered as a badge in the UI.

-- Status names are configurable up to 50 chars; keep the bookings column in
-- sync so any status accepted by this table can be stored on a booking.
ALTER TABLE bookings
  MODIFY COLUMN status VARCHAR(50) DEFAULT 'Draft';

CREATE TABLE IF NOT EXISTS booking_statuses (
  id          VARCHAR(36)  PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  color       VARCHAR(7)   NOT NULL DEFAULT '#6b7280',
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed the workflow statuses in order, each with a distinct colour.
INSERT IGNORE INTO booking_statuses (id, name, color, sort_order) VALUES
  (UUID(), 'Pending',               '#f59e0b', 10),
  (UUID(), 'Confirmed',             '#2563eb', 20),
  (UUID(), 'Empty to Shipper',      '#0d9488', 30),
  (UUID(), 'Gate in Full',          '#6366f1', 40),
  (UUID(), 'Departed (In Transit)', '#0ea5e9', 50),
  (UUID(), 'Discharged',            '#8b5cf6', 60),
  (UUID(), 'Gate Out Full',         '#f97316', 70),
  (UUID(), 'Empty Return',          '#16a34a', 80);

-- Legacy statuses remain colour-configured but inactive so existing bookings
-- can be displayed and saved without reintroducing them into the active flow.
INSERT IGNORE INTO booking_statuses (id, name, color, sort_order, is_active) VALUES
  (UUID(), 'Draft',      '#6b7280', 0,  0),
  (UUID(), 'In Transit', '#f59e0b', 55, 0),
  (UUID(), 'Delivered',  '#16a34a', 85, 0),
  (UUID(), 'Cancelled',  '#dc2626', 90, 0);
