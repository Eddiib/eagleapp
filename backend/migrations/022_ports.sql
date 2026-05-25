-- Move the UN/LOCODE port list into the DB so it can be managed from the
-- admin UI. Seeded with the same list previously hardcoded in
-- frontend/data/ports.ts so no port currently in use is lost.

CREATE TABLE IF NOT EXISTS ports (
  code        VARCHAR(10)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  country     VARCHAR(2)   NOT NULL,  -- ISO 3166-1 alpha-2
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO ports (code, name, country, sort_order) VALUES
  -- Major European Ports
  ('NLRTM', 'Rotterdam',       'NL',  10),
  ('BEANR', 'Antwerp',         'BE',  20),
  ('DEHAM', 'Hamburg',         'DE',  30),
  ('ESVLC', 'Valencia',        'ES',  40),
  ('ITGOA', 'Genoa',           'IT',  50),
  ('GRPIR', 'Piraeus',         'GR',  60),
  ('ALDRZ', 'Durres',          'AL',  70),
  ('FRLEH', 'Le Havre',        'FR',  80),
  ('GBFXT', 'Felixstowe',      'GB',  90),
  ('GBLGP', 'London Gateway',  'GB', 100),
  -- Mediterranean Ports
  ('TRIST', 'Istanbul',        'TR', 110),
  ('EGALY', 'Alexandria',      'EG', 120),
  ('MAPTM', 'Tanger Med',      'MA', 130),
  ('ITSAL', 'Salerno',         'IT', 140),
  ('ITNAP', 'Naples',          'IT', 150),
  -- Asian Ports
  ('CNSGH', 'Shanghai',        'CN', 160),
  ('CNSHK', 'Shekou',          'CN', 170),
  ('CNNGB', 'Ningbo',          'CN', 180),
  ('CNQIN', 'Qingdao',         'CN', 190),
  ('CNYTN', 'Yantian',         'CN', 200),
  ('SGSIN', 'Singapore',       'SG', 210),
  ('HKHKG', 'Hong Kong',       'HK', 220),
  ('KRPUS', 'Busan',           'KR', 230),
  ('JPUKB', 'Kobe',            'JP', 240),
  ('JPTYO', 'Tokyo',           'JP', 250),
  ('THBKK', 'Bangkok',         'TH', 260),
  ('VNSGN', 'Ho Chi Minh',     'VN', 270),
  ('INVTZ', 'Visakhapatnam',   'IN', 280),
  ('INMUN', 'Mumbai',          'IN', 290),
  -- Middle East Ports
  ('AEJEA', 'Jebel Ali',       'AE', 300),
  ('AEDXB', 'Dubai',           'AE', 310),
  ('SAJED', 'Jeddah',          'SA', 320),
  ('OMSAL', 'Salalah',         'OM', 330),
  -- North American Ports
  ('USLAX', 'Los Angeles',     'US', 340),
  ('USLGB', 'Long Beach',      'US', 350),
  ('USNYC', 'New York',        'US', 360),
  ('USORF', 'Norfolk',         'US', 370),
  ('USSEA', 'Seattle',         'US', 380),
  ('CAVAN', 'Vancouver',       'CA', 390),
  ('CAMTR', 'Montreal',        'CA', 400),
  -- South American Ports
  ('BRSST', 'Santos',          'BR', 410),
  ('ARBUE', 'Buenos Aires',    'AR', 420),
  ('CLSAI', 'San Antonio',     'CL', 430),
  -- African Ports
  ('ZADUR', 'Durban',          'ZA', 440),
  ('EGPSD', 'Port Said',       'EG', 450),
  ('MAMBA', 'Casablanca',      'MA', 460),
  -- Adriatic Ports
  ('HRRJK', 'Rijeka',          'HR', 470),
  ('SIKOP', 'Koper',           'SI', 480),
  ('ITTRZ', 'Trieste',         'IT', 490),
  ('ITVEN', 'Venice',          'IT', 500),
  ('MEBRV', 'Bar',             'ME', 510)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  country = VALUES(country),
  sort_order = VALUES(sort_order);

-- Register the management module so admins can pick "Ports" from the
-- Administration sidebar group.
INSERT INTO modules (module_key, module_name, category, sort_order, is_active) VALUES
  ('ports-management', 'Ports', 'Administration', 245, 1)
ON DUPLICATE KEY UPDATE
  module_name = VALUES(module_name),
  category = VALUES(category),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);

-- Admin gets full management access; other roles read ports through the
-- open GET endpoint (no module gate on read).
INSERT INTO role_module_permissions (role_key, module_key, can_view, can_edit) VALUES
  ('admin', 'ports-management', 1, 1)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_edit = VALUES(can_edit);
