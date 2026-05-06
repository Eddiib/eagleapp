-- MVP contract alignment: align DB schema with frontend-driven contracts.
-- Covers three gaps: services schema (replaced with UI-driven fields), partners
-- taxonomy (broadened partner_type + added partner_class), and partner_trade_lanes
-- (catch up with columns that partners.js already writes).

-- ---------- partners: add partner_class, broaden partner_type ----------
ALTER TABLE partners
  MODIFY COLUMN partner_type VARCHAR(50) NOT NULL DEFAULT 'Client';

ALTER TABLE partners
  ADD COLUMN partner_class ENUM('Carrier','Non Carrier') NULL AFTER partner_type;

-- ---------- partner_trade_lanes: add missing columns ----------
ALTER TABLE partner_trade_lanes
  ADD COLUMN place_of_loading      VARCHAR(100)  NULL,
  ADD COLUMN pol                   VARCHAR(20)   NULL,
  ADD COLUMN pod                   VARCHAR(20)   NULL,
  ADD COLUMN final_destination     VARCHAR(100)  NULL,
  ADD COLUMN total_annual_volume   VARCHAR(50)   NULL,
  ADD COLUMN preferred_carrier_id  VARCHAR(36)   NULL,
  ADD COLUMN preferred_corridor    VARCHAR(100)  NULL,
  ADD COLUMN mode_of_transport     VARCHAR(20)   NULL,
  ADD COLUMN mode_of_trailer       VARCHAR(30)   NULL;

-- ---------- services: swap in UI-driven columns ----------
-- We keep the legacy columns present to avoid data loss in dev, but add the new
-- canonical columns used by the frontend. New writes target the new columns.
ALTER TABLE services
  ADD COLUMN category                    VARCHAR(50)   NULL,
  ADD COLUMN transport_modes             JSON          NULL,
  ADD COLUMN applies_to_list             JSON          NULL,
  ADD COLUMN charge_unit                 VARCHAR(40)   NULL,
  ADD COLUMN default_currency            VARCHAR(10)   NULL,
  ADD COLUMN buy_sell_type               ENUM('Buy','Sell','Both') NULL,
  ADD COLUMN default_vat_rate            DECIMAL(6,3)  NULL,
  ADD COLUMN default_gl_code             VARCHAR(50)   NULL,
  ADD COLUMN price_behavior              VARCHAR(30)   NULL,
  ADD COLUMN pricing_model_id            VARCHAR(36)   NULL,
  ADD COLUMN related_partner_types       JSON          NULL,
  ADD COLUMN location_type               VARCHAR(40)   NULL,
  ADD COLUMN documentation_required      TINYINT(1)    NOT NULL DEFAULT 0,
  ADD COLUMN mandatory_for_shipment_types JSON         NULL,
  ADD COLUMN visible_to_sales            TINYINT(1)    NOT NULL DEFAULT 1,
  ADD COLUMN visible_to_marketplace      TINYINT(1)    NOT NULL DEFAULT 0,
  ADD COLUMN notes                       TEXT          NULL,
  ADD COLUMN used_in_pricing             INT           NOT NULL DEFAULT 0,
  ADD COLUMN used_in_invoices            INT           NOT NULL DEFAULT 0;

-- service_group_id is no longer required in the new contract (category supersedes it).
ALTER TABLE services
  MODIFY COLUMN service_group_id VARCHAR(36) NULL;
