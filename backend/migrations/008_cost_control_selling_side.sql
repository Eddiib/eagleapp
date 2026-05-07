-- Migration 008: extend cost_control with selling-side fields and exchange rates.
-- Idempotent because some local databases have these columns before this
-- migration is recorded in schema_migrations.

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'buying_exchange_rate'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN buying_exchange_rate DECIMAL(12,6) NULL DEFAULT 1.000000', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'selling_price'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN selling_price DECIMAL(15,2) NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'selling_currency'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN selling_currency VARCHAR(10) NULL DEFAULT ''USD''', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'selling_exchange_rate'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN selling_exchange_rate DECIMAL(12,6) NULL DEFAULT 1.000000', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'selling_invoice_number'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN selling_invoice_number VARCHAR(50) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'selling_invoice_date'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN selling_invoice_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'client_id'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN client_id VARCHAR(36) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'quantity'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN quantity DECIMAL(12,4) NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'is_locked'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN is_locked TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'last_modified_by'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN last_modified_by VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_column = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND COLUMN_NAME = 'last_modified_at'
);
SET @ddl = IF(@has_column = 0, 'ALTER TABLE cost_control ADD COLUMN last_modified_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_constraint = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'cost_control' AND CONSTRAINT_NAME = 'fk_cc_client'
);
SET @ddl = IF(@has_constraint = 0, 'ALTER TABLE cost_control ADD CONSTRAINT fk_cc_client FOREIGN KEY (client_id) REFERENCES partners(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
