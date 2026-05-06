-- 015_audit_log.sql
-- Minimal audit trail. Application-level logging (not DB triggers) so the
-- authenticated user from the JWT is captured as actor_id / actor_name.
-- before_data / after_data are JSON snapshots of the affected row; for INSERT
-- before_data is NULL, for DELETE after_data is NULL.

CREATE TABLE IF NOT EXISTS audit_log (
  id           VARCHAR(36) PRIMARY KEY,
  table_name   VARCHAR(64)  NOT NULL,
  row_id       VARCHAR(36)  NOT NULL,
  action       ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  actor_id     VARCHAR(36),
  actor_name   VARCHAR(255),
  changed_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  before_data  JSON,
  after_data   JSON,
  INDEX idx_audit_lookup (table_name, row_id, changed_at),
  INDEX idx_audit_actor  (actor_id, changed_at)
);
