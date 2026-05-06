-- Phase 5 (Commercial Workflows) — quotation rejection tracking.
-- `rejection_reason` persists the reason captured in RejectionReasonModal.

ALTER TABLE quotations
  ADD COLUMN rejection_reason TEXT NULL;
