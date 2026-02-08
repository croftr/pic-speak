import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Probabilistic cleanup: ~1 in 20 requests will clean old rows
async function maybeCleanup() {
    if (Math.random() > 0.05) return;
    try {
        await pool.query(`DELETE FROM rate_limit_log WHERE created_at < NOW() - INTERVAL '5 minutes'`);
        await pool.query(`DELETE FROM daily_usage WHERE usage_date < CURRENT_DATE - INTERVAL '7 days'`);
    } catch {
        // Cleanup failure is non-critical
    }
}

/**
 * Distributed rate limiter backed by Postgres.
 *
 * Returns null if the request is allowed, or a 429 NextResponse if rate limited.
 */
export async function rateLimit(
    userId: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number,
): Promise<NextResponse | null> {
    maybeCleanup();

    try {
        const windowSeconds = Math.ceil(windowMs / 1000);

        // Count recent requests and insert current one atomically
        const id = crypto.randomUUID();
        await pool.query(
            `INSERT INTO rate_limit_log (id, user_id, endpoint) VALUES ($1, $2, $3)`,
            [id, userId, endpoint]
        );

        const result = await pool.query(
            `SELECT COUNT(*) as count FROM rate_limit_log
             WHERE user_id = $1 AND endpoint = $2
             AND created_at > NOW() - make_interval(secs => $3)`,
            [userId, endpoint, windowSeconds]
        );

        const count = parseInt(result.rows[0].count, 10);

        if (count > maxRequests) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${windowSeconds} seconds.` },
                {
                    status: 429,
                    headers: { 'Retry-After': String(windowSeconds) },
                },
            );
        }

        return null;
    } catch {
        // If rate limiting fails (DB error), allow the request through
        // rather than blocking all users
        return null;
    }
}

/**
 * Check and increment daily usage for a user+endpoint.
 * Returns null if within limit, or a 429 NextResponse if daily cap exceeded.
 *
 * Uses atomic INSERT ... ON CONFLICT to safely increment across concurrent requests.
 */
export async function checkDailyLimit(
    userId: string,
    endpoint: string,
    maxPerDay: number,
): Promise<NextResponse | null> {
    try {
        // Atomic upsert: insert or increment count
        const result = await pool.query(
            `INSERT INTO daily_usage (user_id, endpoint, usage_date, count)
             VALUES ($1, $2, CURRENT_DATE, 1)
             ON CONFLICT (user_id, endpoint, usage_date)
             DO UPDATE SET count = daily_usage.count + 1
             RETURNING count`,
            [userId, endpoint]
        );

        const count = result.rows[0].count;

        if (count > maxPerDay) {
            return NextResponse.json(
                { error: `Daily limit reached. You can use this feature up to ${maxPerDay} times per day.` },
                { status: 429 },
            );
        }

        return null;
    } catch {
        // If daily limit check fails, allow the request through
        return null;
    }
}

/**
 * Check global daily usage across all users (circuit breaker).
 * Uses a special '__global__' user_id key.
 */
export async function checkGlobalDailyLimit(
    endpoint: string,
    maxPerDay: number,
): Promise<NextResponse | null> {
    return checkDailyLimit('__global__', endpoint, maxPerDay);
}
