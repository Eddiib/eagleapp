-- Extend booking_equipment with per-row dimensions panel fields.
-- Also creates booking_equipment_services for the per-row Services sub-tab.
-- The column additions are intentionally idempotent because some local
-- databases were bootstrapped from schema snapshots before this migration
-- was recorded in schema_migrations.

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'net_weight'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN net_weight DECIMAL(12,2) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'net_weight_unit'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN net_weight_unit VARCHAR(10) NULL DEFAULT ''kg''', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'length_val'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN length_val DECIMAL(10,3) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'width_val'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN width_val DECIMAL(10,3) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'height_val'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN height_val DECIMAL(10,3) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'dimension_unit'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN dimension_unit VARCHAR(10) NULL DEFAULT ''cm''', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'total_volume'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN total_volume DECIMAL(12,3) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment' AND COLUMN_NAME = 'total_density'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment ADD COLUMN total_density DECIMAL(12,4) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS booking_equipment_services (
  id               VARCHAR(36)    NOT NULL PRIMARY KEY,
  equipment_row_id VARCHAR(36)    NOT NULL,
  booking_id       VARCHAR(36)    NOT NULL,
  service_id       VARCHAR(36)    NULL,
  invoice_party_id VARCHAR(36)    NULL,
  agreed_rate      DECIMAL(12,2)  NULL,
  supplier_id      VARCHAR(36)    NULL,
  agreed_cost      DECIMAL(12,2)  NULL,
  sort_order       INT            NOT NULL DEFAULT 0,
  CONSTRAINT fk_bes_equipment FOREIGN KEY (equipment_row_id) REFERENCES booking_equipment(id) ON DELETE CASCADE,
  CONSTRAINT fk_bes_booking   FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_bes_service   FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  CONSTRAINT fk_bes_invoice   FOREIGN KEY (invoice_party_id) REFERENCES partners(id) ON DELETE SET NULL,
  CONSTRAINT fk_bes_supplier  FOREIGN KEY (supplier_id) REFERENCES partners(id) ON DELETE SET NULL
);
