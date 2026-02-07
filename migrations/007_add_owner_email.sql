-- Add email notification support for board owners
ALTER TABLE boards ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;
