-- Migration 010: extend meeting_minutes with richer form fields

ALTER TABLE meeting_minutes
  ADD COLUMN meeting_type          VARCHAR(50)   NULL,
  ADD COLUMN location              VARCHAR(255)  NULL,
  ADD COLUMN duration_minutes      INT           NULL DEFAULT 60,
  ADD COLUMN purpose               TEXT          NULL,
  ADD COLUMN key_points            TEXT          NULL,
  ADD COLUMN proposed_solutions    TEXT          NULL,
  ADD COLUMN competitors_mentioned TEXT          NULL,
  ADD COLUMN action_items          JSON          NULL,
  ADD COLUMN communication_methods JSON          NULL,
  ADD COLUMN client_participants   JSON          NULL,
  ADD COLUMN company_participants  JSON          NULL,
  ADD COLUMN contact_person        VARCHAR(200)  NULL,
  ADD COLUMN status                ENUM('draft','completed','follow-up-pending') NOT NULL DEFAULT 'draft';
