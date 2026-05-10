-- Migration 020: add commercial partner roles.
-- partner_type remains the granular logistics/category taxonomy. partner_roles
-- stores the commercial relationship axis: Buyer, Seller, or both.

ALTER TABLE partners
  ADD COLUMN partner_roles JSON NULL AFTER partner_class;

UPDATE partners
SET partner_roles = CASE
  WHEN partner_type IN ('Client', 'Buyer') THEN JSON_ARRAY('Buyer')
  ELSE JSON_ARRAY('Seller')
END
WHERE partner_roles IS NULL;
