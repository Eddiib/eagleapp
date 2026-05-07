-- Move the equipment-type selection from the booking_equipment row level down to
-- each individual service line, so different services within one equipment row
-- can reference different equipment types.
-- Idempotent because some local databases have the column before this migration
-- is recorded in schema_migrations.

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment_services' AND COLUMN_NAME = 'equipment_id'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment_services ADD COLUMN equipment_id VARCHAR(36) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_constraint = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment_services' AND CONSTRAINT_NAME = 'fk_bes_equipment_type'
);
SET @ddl = IF(@has_constraint = 0, 'ALTER TABLE booking_equipment_services ADD CONSTRAINT fk_bes_equipment_type FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE booking_equipment
  MODIFY COLUMN equipment_id VARCHAR(36) NULL;
