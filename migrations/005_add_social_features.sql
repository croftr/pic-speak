-- Add likes and comments tables for social features
CREATE TABLE IF NOT EXISTS board_likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, board_id)
);

CREATE INDEX IF NOT EXISTS idx_board_likes_board_id ON board_likes(board_id);
CREATE INDEX IF NOT EXISTS idx_board_likes_user_id ON board_likes(user_id);

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

CREATE INDEX IF NOT EXISTS idx_board_comments_board_id ON board_comments(board_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_user_id ON board_comments(user_id);
