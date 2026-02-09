-- App-wide settings table (key-value store for admin-configurable values)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default limits
INSERT INTO app_settings (key, value) VALUES ('max_boards_per_user', '5') ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('max_cards_per_board', '100') ON CONFLICT (key) DO NOTHING;
