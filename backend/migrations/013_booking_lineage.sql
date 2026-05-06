-- Migration 013: Booking lineage
--
-- Adds FK columns to bookings so we can trace each booking back to the
-- sales lead and/or quotation it originated from. Both are optional: a
-- booking may be created directly without either, but when the booking
-- flow passes through Sales Leads or Quotations the IDs are recorded
-- here instead of being stuffed into free-text notes.
--
-- ON DELETE SET NULL: we never want deletion of an upstream lead or
-- quote to cascade-delete a booking (bookings are the system of record
-- for shipments); losing the lineage pointer is acceptable.

ALTER TABLE bookings
  ADD COLUMN source_sales_lead_id VARCHAR(36) NULL AFTER consignee_id,
  ADD COLUMN source_quotation_id  VARCHAR(36) NULL AFTER source_sales_lead_id,
  ADD CONSTRAINT fk_bookings_source_sales_lead
    FOREIGN KEY (source_sales_lead_id) REFERENCES sales_leads(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_bookings_source_quotation
    FOREIGN KEY (source_quotation_id)  REFERENCES quotations(id)  ON DELETE SET NULL;

CREATE INDEX idx_bookings_source_sales_lead ON bookings(source_sales_lead_id);
CREATE INDEX idx_bookings_source_quotation  ON bookings(source_quotation_id);
