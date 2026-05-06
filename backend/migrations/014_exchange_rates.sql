-- Migration 014: Exchange rates
--
-- Adds a simple FX table so dashboard aggregations (and the upcoming
-- P&L view) can normalize mixed-currency totals into a single base
-- currency. Rates are stored per (from_currency, to_currency, effective_date)
-- with a UNIQUE key so upserts are straightforward; the most recent row
-- on-or-before a target date wins.
--
-- No external FX source is wired up — rates are entered manually by an
-- admin. This is intentional for MVP: predictable, auditable, no third-
-- party dependency.

CREATE TABLE IF NOT EXISTS exchange_rates (
  id             VARCHAR(36)   PRIMARY KEY,
  from_currency  CHAR(3)       NOT NULL,
  to_currency    CHAR(3)       NOT NULL,
  rate           DECIMAL(20,8) NOT NULL,
  effective_date DATE          NOT NULL,
  created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rate_triple (from_currency, to_currency, effective_date),
  INDEX idx_from_to (from_currency, to_currency, effective_date)
);

-- Seed identity rows so USD→USD, EUR→EUR, etc. always resolve to 1.0 even
-- if an admin hasn't entered anything yet. The normalization helper also
-- short-circuits when from === to, so this is belt-and-braces.
INSERT IGNORE INTO exchange_rates (id, from_currency, to_currency, rate, effective_date) VALUES
  (UUID(), 'USD', 'USD', 1.0, '2000-01-01'),
  (UUID(), 'EUR', 'EUR', 1.0, '2000-01-01'),
  (UUID(), 'GBP', 'GBP', 1.0, '2000-01-01');
