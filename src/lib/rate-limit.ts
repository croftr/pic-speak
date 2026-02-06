import { NextResponse } from 'next/server';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
        if (now > entry.resetAt) {
            store.delete(key);
        }
    }
}

/**
 * Simple in-memory rate limiter keyed by userId.
 *
 * Returns null if the request is allowed, or a 429 NextResponse if rate limited.
 *
 * @param userId - The authenticated user's ID
 * @param endpoint - A label for the endpoint (used as part of the key)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
    userId: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number,
): NextResponse | null {
    cleanup();

    const key = `${endpoint}:${userId}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return null;
    }

    entry.count++;

    if (entry.count > maxRequests) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
            { error: `Too many requests. Please try again in ${retryAfterSec} seconds.` },
            {
                status: 429,
                headers: { 'Retry-After': String(retryAfterSec) },
            },
        );
    }

    return null;
}
