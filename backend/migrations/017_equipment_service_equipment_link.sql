-- Move the equipment-type selection from the booking_equipment row level down to
-- each individual service line, so different services within one equipment row
-- can reference different equipment types.

-- 1. Add equipment_id to service lines (nullable FK to the equipment catalog).
ALTER TABLE booking_equipment_services
  ADD COLUMN equipment_id VARCHAR(36) NULL,
  ADD CONSTRAINT fk_bes_equipment_type
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;

-- 2. Make booking_equipment.equipment_id nullable so rows can be saved without
--    requiring a top-level equipment type selection.
ALTER TABLE booking_equipment
  MODIFY COLUMN equipment_id VARCHAR(36) NULL;
