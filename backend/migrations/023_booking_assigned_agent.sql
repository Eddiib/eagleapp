-- Migration 023: Booking assigned agent + reassign permission
--
-- Adds an `assigned_agent_id` to bookings so each booking has an explicit
-- responsible agent (defaults to the creator's linked employee). Introduces a
-- granular permission module so only roles with `edit:booking-agent-assignment`
-- may change the agent away from the default during create/edit.

ALTER TABLE bookings
  ADD COLUMN assigned_agent_id VARCHAR(36) NULL AFTER updated_by;

ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_assigned_agent
  FOREIGN KEY (assigned_agent_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX idx_bookings_assigned_agent ON bookings(assigned_agent_id);

-- Backfill: link existing rows to the employee whose user matches created_by.
UPDATE bookings b
  LEFT JOIN users u ON u.username = b.created_by
   SET b.assigned_agent_id = u.employee_id
 WHERE b.assigned_agent_id IS NULL
   AND u.employee_id IS NOT NULL;

INSERT INTO modules (module_key, module_name, category, sort_order, is_active) VALUES
  ('booking-agent-assignment', 'Reassign Booking Agent', 'Booking Desk', 105, 1)
ON DUPLICATE KEY UPDATE
  module_name = VALUES(module_name),
  category = VALUES(category),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);

-- Default: admin + manager may reassign; other roles inherit their own agent.
INSERT INTO role_module_permissions (role_key, module_key, can_view, can_edit) VALUES
  ('admin', 'booking-agent-assignment', 1, 1),
  ('manager', 'booking-agent-assignment', 1, 1)
ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_edit = VALUES(can_edit);
