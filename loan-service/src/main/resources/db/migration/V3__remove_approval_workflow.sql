UPDATE loans SET status = 'BORROWED' WHERE status IN ('PENDING', 'PENDING_RETURN');
DELETE FROM loans WHERE status = 'REJECTED';

ALTER TABLE loans
  DROP CONSTRAINT IF EXISTS loans_status_check;

ALTER TABLE loans
  ADD CONSTRAINT loans_status_check
  CHECK (status IN ('BORROWED','RETURNED'));
