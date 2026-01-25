-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    label TEXT NOT NULL,
    image_url TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    "order" INTEGER DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'Thing',
    template_key TEXT,
    source_board_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Migration: Add source_board_id column to existing cards table
-- Run this if upgrading from an older schema:
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS source_board_id TEXT;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_order ON cards(board_id, "order");
