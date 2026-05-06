-- Migration 012: Normalize country column widths
--
-- Standard: all country fields store ISO 3166-1 alpha-2 codes (2 characters).
-- Cities remain free-text VARCHAR(100).
-- Frontend uses getCountryName(code) from frontend/data/countries.ts for display.
--
-- This migration aligns the one outlier column width with the rest.

ALTER TABLE bookings
  MODIFY COLUMN place_of_loading_country VARCHAR(10);
