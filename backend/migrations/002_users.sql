CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager','sales','operations','accounting','viewer') NOT NULL DEFAULT 'viewer',
  employee_id   VARCHAR(36)  NULL,
  is_active     TINYINT(1)   DEFAULT 1,
  last_login    DATETIME     NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);
