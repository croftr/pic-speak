-- Rate limit tracking table for distributed rate limiting across serverless instances
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_log (user_id, endpoint, created_at);

-- Daily usage tracking for per-user and global daily caps
CREATE TABLE IF NOT EXISTS daily_usage (
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, endpoint, usage_date)
);
