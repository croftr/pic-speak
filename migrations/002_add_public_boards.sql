-- Add public boards support
ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_boards_is_public ON boards(is_public) WHERE is_public = true;
