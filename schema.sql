-- Full database schema for pic-speak
-- This file represents the current state of the database after all migrations.
-- For incremental changes, add a new file in migrations/ instead of editing this.
--
-- To set up a fresh database, run: npm run db:migrate

-- Migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    creator_name TEXT,
    creator_image_url TEXT,
    owner_email TEXT,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    label TEXT,
    image_url TEXT,
    audio_url TEXT,
    color TEXT DEFAULT '#6366f1',
    "order" INTEGER DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'Thing',
    template_key TEXT,
    source_board_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Board likes
CREATE TABLE IF NOT EXISTS board_likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, board_id)
);

-- Board comments
CREATE TABLE IF NOT EXISTS board_comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    content TEXT NOT NULL,
    commenter_name TEXT NOT NULL,
    commenter_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_is_public ON boards(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_order ON cards(board_id, "order");
CREATE INDEX IF NOT EXISTS idx_board_likes_board_id ON board_likes(board_id);
CREATE INDEX IF NOT EXISTS idx_board_likes_user_id ON board_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_board_id ON board_comments(board_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_user_id ON board_comments(user_id);
