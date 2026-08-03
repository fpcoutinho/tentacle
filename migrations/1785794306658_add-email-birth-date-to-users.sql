-- Up Migration

ALTER TABLE users
  ADD COLUMN email text,
  ADD COLUMN birth_date date;

UPDATE users SET email = id || '@placeholder.invalid' WHERE email IS NULL;

ALTER TABLE users
  ALTER COLUMN email SET NOT NULL,
  ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Down Migration

ALTER TABLE users
  DROP CONSTRAINT users_email_unique,
  DROP COLUMN email,
  DROP COLUMN birth_date;
