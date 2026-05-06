-- Phase 5 / booking-header-panels — extend bookings to back the approved UI:
--   BookingHeader (BL fields, freight terms, routing detail, cargo details)
--   Right-hand Sidebar (internal notes, free-text comments, attachments)
--   Multi-shipper chip selector (join table; legacy `shipper_id` kept as a
--   convenience "primary shipper" column for list-view displays).

ALTER TABLE bookings
  ADD COLUMN booking_date             DATE          NULL,
  ADD COLUMN carrier_ref              VARCHAR(100)  NULL,
  ADD COLUMN supplier_ref             VARCHAR(100)  NULL,
  ADD COLUMN master_bl                VARCHAR(100)  NULL,
  ADD COLUMN house_bl                 VARCHAR(100)  NULL,
  ADD COLUMN bl_type                  VARCHAR(30)   NULL,
  ADD COLUMN bl_status                VARCHAR(30)   NULL,
  ADD COLUMN freight_terms            VARCHAR(30)   NULL,
  ADD COLUMN notify_party_id          VARCHAR(36)   NULL,
  ADD COLUMN place_of_loading_city    VARCHAR(100)  NULL,
  ADD COLUMN place_of_loading_country VARCHAR(3)    NULL,
  ADD COLUMN final_destination        VARCHAR(200)  NULL,
  ADD COLUMN cargo_readiness_date     DATE          NULL,
  ADD COLUMN cargo_nature             VARCHAR(50)   NULL,
  ADD COLUMN internal_notes           TEXT          NULL,
  ADD COLUMN free_text_comments       TEXT          NULL,
  ADD CONSTRAINT fk_bookings_notify_party
    FOREIGN KEY (notify_party_id) REFERENCES partners(id) ON DELETE SET NULL;

-- Multi-shipper: the header shows chips. `bookings.shipper_id` stays populated
-- with the first row so existing list views keep working.
CREATE TABLE IF NOT EXISTS booking_shippers (
  booking_id VARCHAR(36) NOT NULL,
  shipper_id VARCHAR(36) NOT NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (booking_id, shipper_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)  ON DELETE CASCADE,
  FOREIGN KEY (shipper_id) REFERENCES partners(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_attachments (
  id                VARCHAR(36)  PRIMARY KEY,
  booking_id        VARCHAR(36)  NOT NULL,
  filename          VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type         VARCHAR(100),
  size_bytes        BIGINT,
  doc_type          VARCHAR(40),
  doc_date          DATE,
  storage_path      VARCHAR(500) NOT NULL,
  uploaded_by       VARCHAR(100),
  uploaded_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
