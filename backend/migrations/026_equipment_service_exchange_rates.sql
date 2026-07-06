-- Per-service-line currencies and exchange rates so agreed rate (revenue side)
-- and agreed cost (supplier side) can be entered in foreign currencies and
-- converted to the company base currency (EUR). NULL means base currency @ 1.0,
-- which preserves the meaning of all existing rows.

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment_services' AND COLUMN_NAME = 'rate_currency'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment_services ADD COLUMN rate_currency CHAR(3) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment_services' AND COLUMN_NAME = 'rate_exchange_rate'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment_services ADD COLUMN rate_exchange_rate DECIMAL(14,6) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment_services' AND COLUMN_NAME = 'cost_currency'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment_services ADD COLUMN cost_currency CHAR(3) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment_services' AND COLUMN_NAME = 'cost_exchange_rate'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment_services ADD COLUMN cost_exchange_rate DECIMAL(14,6) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
