-- Migration 010: extend meeting_minutes with richer form fields.
-- Idempotent because some local databases have these columns before this
-- migration is recorded in schema_migrations.

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'meeting_type'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN meeting_type VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'location'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN location VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'duration_minutes'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN duration_minutes INT NULL DEFAULT 60', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'purpose'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN purpose TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'key_points'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN key_points TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'proposed_solutions'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN proposed_solutions TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'competitors_mentioned'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN competitors_mentioned TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'action_items'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN action_items JSON NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'communication_methods'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN communication_methods JSON NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'client_participants'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN client_participants JSON NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'company_participants'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN company_participants JSON NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'contact_person'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN contact_person VARCHAR(200) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meeting_minutes' AND COLUMN_NAME = 'status'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE meeting_minutes ADD COLUMN status ENUM(''draft'',''completed'',''follow-up-pending'') NOT NULL DEFAULT ''draft''', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
