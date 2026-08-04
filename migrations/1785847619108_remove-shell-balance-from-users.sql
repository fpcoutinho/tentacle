-- Up Migration

ALTER TABLE users DROP COLUMN shell_balance;

-- Down Migration

ALTER TABLE users ADD COLUMN shell_balance integer NOT NULL DEFAULT 0 CHECK (shell_balance >= 0);

UPDATE users u
SET shell_balance = COALESCE(
  (SELECT balance_after FROM shell_ledger sl WHERE sl.user_id = u.id ORDER BY sl.id DESC LIMIT 1),
  0
);
