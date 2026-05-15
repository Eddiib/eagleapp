-- Add planned completion date to each equipment service line so operations can
-- track when each service is scheduled to be completed and keep the client updated.

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_equipment_services' AND COLUMN_NAME = 'planned_date'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE booking_equipment_services ADD COLUMN planned_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
