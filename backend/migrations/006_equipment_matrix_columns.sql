-- Extend booking_equipment to back the approved Equipment Matrix UI.
-- Each row is one physical container/unit with its own routing, cargo, and weight data.

ALTER TABLE booking_equipment
  ADD COLUMN container_id      VARCHAR(50)     NULL  COMMENT 'e.g. MSKU1234567',
  ADD COLUMN type_size         VARCHAR(20)     NULL  COMMENT 'e.g. 40HC, 20ST',
  ADD COLUMN carrier_id        VARCHAR(36)     NULL  COMMENT 'per-container carrier (overrides booking-level carrier)',
  ADD COLUMN place_of_loading  VARCHAR(200)    NULL,
  ADD COLUMN final_destination VARCHAR(200)    NULL,
  ADD COLUMN etd               DATE            NULL,
  ADD COLUMN eta               DATE            NULL,
  ADD COLUMN gross_weight_kg   DECIMAL(12,2)   NULL,
  ADD COLUMN volume_m3         DECIMAL(10,3)   NULL,
  ADD COLUMN packages          INT             NULL,
  ADD COLUMN commodity         VARCHAR(200)    NULL,
  ADD CONSTRAINT fk_booking_equipment_carrier
    FOREIGN KEY (carrier_id) REFERENCES partners(id) ON DELETE SET NULL;
