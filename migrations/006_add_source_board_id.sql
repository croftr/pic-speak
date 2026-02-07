-- Track which public board a card was inherited from
ALTER TABLE cards ADD COLUMN IF NOT EXISTS source_board_id TEXT;
