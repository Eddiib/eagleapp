-- Currency master list so dropdown options can be managed from the admin UI
-- (Financials → Exchange Rates) instead of hardcoded per-component lists.
-- Seeded with the union of every list previously hardcoded in the frontend
-- so no currency currently in use disappears.

CREATE TABLE IF NOT EXISTS currencies (
  code        CHAR(3)      PRIMARY KEY,   -- ISO 4217
  name        VARCHAR(50)  NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 999,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO currencies (code, name, is_active, sort_order) VALUES
  ('EUR', 'Euro',              1,  10),
  ('USD', 'US Dollar',         1,  20),
  ('GBP', 'British Pound',     1,  30),
  ('CHF', 'Swiss Franc',       1,  40),
  ('ALL', 'Albanian Lek',      1,  50),
  ('CNY', 'Chinese Yuan',      1,  60),
  ('JPY', 'Japanese Yen',      1,  70),
  ('AED', 'UAE Dirham',        1,  80),
  ('TRY', 'Turkish Lira',      1,  90),
  ('CAD', 'Canadian Dollar',   1, 100),
  ('AUD', 'Australian Dollar', 1, 110),
  ('SGD', 'Singapore Dollar',  1, 120);
