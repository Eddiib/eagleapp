-- Eagle Logistics Management System
-- Database: transport
-- Run: mysql -u root transport < schema.sql

CREATE DATABASE IF NOT EXISTS transport;
USE transport;

-- ─────────────────────────────────────────────
-- SERVICE GROUPS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_groups (
  id              VARCHAR(36)   PRIMARY KEY,
  group_code      VARCHAR(20)   NOT NULL UNIQUE,
  group_name      VARCHAR(100)  NOT NULL,
  description     TEXT,
  default_where_used JSON,
  default_modes   JSON,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_by      VARCHAR(100),
  created_date    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  modified_by     VARCHAR(100),
  modified_date   DATETIME      ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- SERVICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id                          VARCHAR(36)   PRIMARY KEY,
  service_code                VARCHAR(20)   NOT NULL UNIQUE,
  service_name                VARCHAR(150)  NOT NULL,
  service_group_id            VARCHAR(36)   NOT NULL,
  is_active                   TINYINT(1)    NOT NULL DEFAULT 1,
  where_used                  JSON,
  applicable_modes            JSON,
  location_scope              VARCHAR(20),
  applies_to                  VARCHAR(20),
  charge_type                 VARCHAR(10),
  unit_basis                  VARCHAR(30),
  quantity_source             VARCHAR(10),
  minimum_charge              DECIMAL(12,2),
  tiered_pricing              TINYINT(1)    DEFAULT 0,
  free_time_value             INT,
  free_time_unit              VARCHAR(10),
  charge_after_free_time      TINYINT(1)    DEFAULT 0,
  pricing_type                VARCHAR(20),
  rate_validity_required      TINYINT(1)    DEFAULT 0,
  currency_allowed            JSON,
  allow_multiple_suppliers    TINYINT(1)    DEFAULT 0,
  requires_approval           TINYINT(1)    DEFAULT 0,
  supplier_required           TINYINT(1)    DEFAULT 0,
  operational_references      JSON,
  attachment_required         TINYINT(1)    DEFAULT 0,
  tax_category                VARCHAR(20),
  accrual_eligible            TINYINT(1)    DEFAULT 0,
  gl_mapping_code             VARCHAR(50),
  revenue_recognition         TINYINT(1)    DEFAULT 0,
  default_invoice_party_role  VARCHAR(20),
  default_cost_owner_role     VARCHAR(20),
  used_in_bookings            INT           DEFAULT 0,
  used_in_quotations          INT           DEFAULT 0,
  created_by                  VARCHAR(100),
  created_date                DATETIME      DEFAULT CURRENT_TIMESTAMP,
  modified_by                 VARCHAR(100),
  modified_date               DATETIME      ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_group_id) REFERENCES service_groups(id)
);

-- ─────────────────────────────────────────────
-- PARTNERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id                        VARCHAR(36)   PRIMARY KEY,
  partner_code              VARCHAR(20)   NOT NULL UNIQUE,
  company_legal_name        VARCHAR(200)  NOT NULL,
  trading_name              VARCHAR(200),
  business_number           VARCHAR(50),
  eori_number               VARCHAR(50),
  partner_type              VARCHAR(50) NOT NULL DEFAULT 'Client',
  partner_class             ENUM('Carrier','Non Carrier'),
  partner_roles             JSON,
  partner_category          VARCHAR(50),
  country                   VARCHAR(100),
  city                      VARCHAR(100),
  address                   TEXT,
  zip_code                  VARCHAR(20),
  website                   VARCHAR(255),
  tax_number                VARCHAR(50),
  registration_number       VARCHAR(50),
  assigned_agent_id         VARCHAR(36),
  payment_terms             VARCHAR(20),
  payment_terms_as_supplier VARCHAR(20),
  payment_terms_as_client   VARCHAR(20),
  credit_terms              TEXT,
  currency                  VARCHAR(10),
  default_service_type      VARCHAR(10),
  main_trades               JSON,
  notes                     TEXT,
  status                    ENUM('Active','Suspended','Blacklisted','Archived') NOT NULL DEFAULT 'Active',
  rating                    TINYINT       DEFAULT 3,
  open_balance              DECIMAL(15,2) DEFAULT 0,
  credit_limit              DECIMAL(15,2),
  created_date              DATETIME      DEFAULT CURRENT_TIMESTAMP,
  created_by                VARCHAR(100),
  last_updated_date         DATETIME      ON UPDATE CURRENT_TIMESTAMP,
  last_updated_by           VARCHAR(100),
  last_activity_date        DATETIME
);

CREATE TABLE IF NOT EXISTS partner_contacts (
  id            VARCHAR(36)  PRIMARY KEY,
  partner_id    VARCHAR(36)  NOT NULL,
  name          VARCHAR(100) NOT NULL,
  position      VARCHAR(100),
  phone         VARCHAR(50),
  email         VARCHAR(150),
  is_primary    TINYINT(1)   DEFAULT 0,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partner_bank_details (
  id                      VARCHAR(36)  PRIMARY KEY,
  partner_id              VARCHAR(36)  NOT NULL,
  bank_name               VARCHAR(150),
  iban                    VARCHAR(50),
  swift                   VARCHAR(20),
  account_number          VARCHAR(50),
  currency                VARCHAR(10),
  intermediary_bank_name  VARCHAR(150),
  intermediary_swift      VARCHAR(20),
  is_default              TINYINT(1)   DEFAULT 0,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partner_delivery_addresses (
  id              VARCHAR(36)  PRIMARY KEY,
  partner_id      VARCHAR(36)  NOT NULL,
  address_name    VARCHAR(150),
  full_address    TEXT,
  city            VARCHAR(100),
  country         VARCHAR(100),
  zip_code        VARCHAR(20),
  contact_person  VARCHAR(100),
  contact_phone   VARCHAR(50),
  is_default      TINYINT(1)   DEFAULT 0,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partner_trade_lanes (
  id            VARCHAR(36) PRIMARY KEY,
  partner_id    VARCHAR(36) NOT NULL,
  origin        VARCHAR(10),
  destination   VARCHAR(10),
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partner_documents (
  id            VARCHAR(36)  PRIMARY KEY,
  partner_id    VARCHAR(36)  NOT NULL,
  name          VARCHAR(200),
  type          ENUM('Contract','LOA','Certificate','License','Other'),
  url           TEXT,
  uploaded_date DATETIME,
  uploaded_by   VARCHAR(100),
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partner_activity_log (
  id            VARCHAR(36)   PRIMARY KEY,
  partner_id    VARCHAR(36)   NOT NULL,
  action        VARCHAR(50),
  description   TEXT,
  performed_by  VARCHAR(100),
  performed_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  details       TEXT,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- EMPLOYEES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id                      VARCHAR(36)  PRIMARY KEY,
  employee_code           VARCHAR(20)  NOT NULL UNIQUE,
  first_name              VARCHAR(100) NOT NULL,
  surname                 VARCHAR(100) NOT NULL,
  position                VARCHAR(100),
  department              ENUM('Sales','Operations','Accounting','Management','Administration','Other'),
  is_active               TINYINT(1)   DEFAULT 1,
  is_sales_person         TINYINT(1)   DEFAULT 0,
  date_of_hire            DATE,
  email                   VARCHAR(150),
  phone                   VARCHAR(50),
  date_of_birth           DATE,
  personal_id             VARCHAR(50),
  gender                  VARCHAR(20),
  address                 TEXT,
  city                    VARCHAR(100),
  country                 VARCHAR(100),
  date_of_termination     DATE,
  employment_type         ENUM('Full-time','Part-time','Contract','Internship'),
  is_manager              TINYINT(1)   DEFAULT 0,
  has_system_access       TINYINT(1)   DEFAULT 0,
  personal_email          VARCHAR(150),
  mobile_phone            VARCHAR(50),
  emergency_contact_name  VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  salary_type             ENUM('Monthly','Hourly','Commission-based'),
  basic_salary            DECIMAL(12,2),
  currency                VARCHAR(10),
  iban                    VARCHAR(50),
  tax_code                VARCHAR(50),
  notes                   TEXT,
  created_at              DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME     ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- EQUIPMENT
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
  id              VARCHAR(36)  PRIMARY KEY,
  equipment_code  VARCHAR(20)  NOT NULL UNIQUE,
  equipment_name  VARCHAR(150) NOT NULL,
  category        ENUM('Container','Trailer','Chassis','Vehicle','Pallet','Other'),
  size            VARCHAR(50),
  specifications  TEXT,
  teu_equivalent  DECIMAL(5,2),
  is_active       TINYINT(1)   DEFAULT 1,
  notes           TEXT,
  used_in_bookings INT          DEFAULT 0,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  created_by      VARCHAR(100),
  updated_at      DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  updated_by      VARCHAR(100)
);

-- ─────────────────────────────────────────────
-- BOOKINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                VARCHAR(36)   PRIMARY KEY,
  booking_number    VARCHAR(30)   NOT NULL UNIQUE,
  status            VARCHAR(30)   DEFAULT 'Draft',
  mode_of_transport VARCHAR(20),
  client_id         VARCHAR(36),
  carrier_id        VARCHAR(36),
  shipper_id        VARCHAR(36),
  consignee_id      VARCHAR(36),
  origin_country    VARCHAR(100),
  origin_port       VARCHAR(20),
  destination_country VARCHAR(100),
  destination_port  VARCHAR(20),
  etd               DATE,
  eta               DATE,
  commodity         VARCHAR(200),
  incoterm          VARCHAR(10),
  total_revenue     DECIMAL(15,2) DEFAULT 0,
  total_cost        DECIMAL(15,2) DEFAULT 0,
  currency          VARCHAR(10)   DEFAULT 'EUR',
  notes             TEXT,
  created_date      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  created_by        VARCHAR(100),
  updated_date      DATETIME      ON UPDATE CURRENT_TIMESTAMP,
  updated_by        VARCHAR(100),
  FOREIGN KEY (client_id)    REFERENCES partners(id) ON DELETE SET NULL,
  FOREIGN KEY (carrier_id)   REFERENCES partners(id) ON DELETE SET NULL,
  FOREIGN KEY (shipper_id)   REFERENCES partners(id) ON DELETE SET NULL,
  FOREIGN KEY (consignee_id) REFERENCES partners(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS booking_equipment (
  id            VARCHAR(36) PRIMARY KEY,
  booking_id    VARCHAR(36) NOT NULL,
  equipment_id  VARCHAR(36) NOT NULL,
  quantity      INT         DEFAULT 1,
  FOREIGN KEY (booking_id)   REFERENCES bookings(id)  ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_services (
  id          VARCHAR(36)   PRIMARY KEY,
  booking_id  VARCHAR(36)   NOT NULL,
  service_id  VARCHAR(36)   NOT NULL,
  supplier_id VARCHAR(36),
  quantity    DECIMAL(10,2) DEFAULT 1,
  unit_price  DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(15,2) DEFAULT 0,
  currency    VARCHAR(10)   DEFAULT 'EUR',
  notes       TEXT,
  FOREIGN KEY (booking_id)  REFERENCES bookings(id)  ON DELETE CASCADE,
  FOREIGN KEY (service_id)  REFERENCES services(id)  ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES partners(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- QUOTATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  id              VARCHAR(36)   PRIMARY KEY,
  quote_number    VARCHAR(30)   NOT NULL UNIQUE,
  status          ENUM('Draft','Sent','Accepted','Rejected','Expired') DEFAULT 'Draft',
  client_id       VARCHAR(36),
  mode_of_transport VARCHAR(20),
  origin_country  VARCHAR(100),
  origin_port     VARCHAR(20),
  destination_country VARCHAR(100),
  destination_port VARCHAR(20),
  valid_until     DATE,
  total_sell      DECIMAL(15,2) DEFAULT 0,
  total_cost      DECIMAL(15,2) DEFAULT 0,
  currency        VARCHAR(10)   DEFAULT 'EUR',
  notes           TEXT,
  rejection_reason TEXT,
  created_date    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  created_by      VARCHAR(100),
  updated_date    DATETIME      ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES partners(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quotation_services (
  id            VARCHAR(36)   PRIMARY KEY,
  quotation_id  VARCHAR(36)   NOT NULL,
  service_id    VARCHAR(36)   NOT NULL,
  supplier_id   VARCHAR(36),
  quantity      DECIMAL(10,2) DEFAULT 1,
  cost_price    DECIMAL(12,2) DEFAULT 0,
  sell_price    DECIMAL(12,2) DEFAULT 0,
  currency      VARCHAR(10)   DEFAULT 'EUR',
  notes         TEXT,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id)   REFERENCES services(id)   ON DELETE CASCADE,
  FOREIGN KEY (supplier_id)  REFERENCES partners(id)   ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- SALES LEADS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_leads (
  id                      VARCHAR(36)  PRIMARY KEY,
  lead_id                 VARCHAR(20)  NOT NULL UNIQUE,
  partner_id              VARCHAR(36)  NOT NULL,
  assigned_sales_agent_id VARCHAR(36),
  lead_status             ENUM('New','Contacted','Quoted','Booked','Lost','Inactive') DEFAULT 'New',
  lead_ranking            ENUM('High','Medium','Low') DEFAULT 'Medium',
  last_contact_date       DATETIME,
  created_at              DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id)              REFERENCES partners(id)  ON DELETE CASCADE,
  FOREIGN KEY (assigned_sales_agent_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- MEETING MINUTES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id                VARCHAR(36)  PRIMARY KEY,
  sales_lead_id     VARCHAR(36),
  partner_id        VARCHAR(36),
  sales_agent_id    VARCHAR(36),
  sales_agent       VARCHAR(100),
  contact_type      ENUM('Phone Call','Email','WhatsApp','Physical Meeting','Video Call','Other'),
  meeting_date      DATE,
  meeting_time      VARCHAR(10),
  summary           TEXT,
  client_needs      TEXT,
  next_action       ENUM('Send Quotation','Follow-Up Call','Schedule Meeting','Waiting on Client','Closed / Not Interested'),
  next_action_date  DATE,
  created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  created_by        VARCHAR(100),
  FOREIGN KEY (sales_lead_id) REFERENCES sales_leads(id) ON DELETE SET NULL,
  FOREIGN KEY (partner_id)    REFERENCES partners(id)    ON DELETE SET NULL,
  FOREIGN KEY (sales_agent_id) REFERENCES employees(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- COST CONTROL
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cost_control (
  id            VARCHAR(36)   PRIMARY KEY,
  booking_id    VARCHAR(36),
  service_id    VARCHAR(36),
  supplier_id   VARCHAR(36),
  description   TEXT,
  amount        DECIMAL(15,2) DEFAULT 0,
  currency      VARCHAR(10)   DEFAULT 'EUR',
  invoice_number VARCHAR(50),
  invoice_date  DATE,
  due_date      DATE,
  status        ENUM('Pending','Approved','Paid','Disputed') DEFAULT 'Pending',
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  created_by    VARCHAR(100),
  FOREIGN KEY (booking_id)  REFERENCES bookings(id)  ON DELETE SET NULL,
  FOREIGN KEY (service_id)  REFERENCES services(id)  ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES partners(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- USERS, ROLES, MODULE PERMISSIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  role_key    VARCHAR(50)  PRIMARY KEY,
  role_name   VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   TINYINT(1)   NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
  module_key  VARCHAR(80)  PRIMARY KEY,
  module_name VARCHAR(120) NOT NULL,
  category    VARCHAR(80)  NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_module_permissions (
  role_key   VARCHAR(50) NOT NULL,
  module_key VARCHAR(80) NOT NULL,
  can_view   TINYINT(1)  NOT NULL DEFAULT 0,
  can_edit   TINYINT(1)  NOT NULL DEFAULT 0,
  updated_at DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (role_key, module_key),
  FOREIGN KEY (role_key) REFERENCES roles(role_key) ON DELETE CASCADE,
  FOREIGN KEY (module_key) REFERENCES modules(module_key) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'viewer',
  employee_id   VARCHAR(36)  NULL,
  is_active     TINYINT(1)   DEFAULT 1,
  last_login    DATETIME     NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);
