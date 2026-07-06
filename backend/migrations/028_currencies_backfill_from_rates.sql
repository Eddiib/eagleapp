-- Backfill the currency master list with any currency that already appears in
-- exchange_rates rows. Before migration 027 the BookingForm/ServiceForm
-- dropdowns derived options from rate rows, so an org-specific currency that
-- was never in a hardcoded list (e.g. NOK known only via NOK->EUR rates)
-- would otherwise disappear from dropdowns at deploy time.

INSERT IGNORE INTO currencies (code, name, is_active, sort_order)
SELECT DISTINCT from_currency, from_currency, 1, 999
  FROM exchange_rates
 WHERE from_currency REGEXP '^[A-Z]{3}$';

INSERT IGNORE INTO currencies (code, name, is_active, sort_order)
SELECT DISTINCT to_currency, to_currency, 1, 999
  FROM exchange_rates
 WHERE to_currency REGEXP '^[A-Z]{3}$';
