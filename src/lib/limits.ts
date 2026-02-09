import { getAppSetting } from '@/lib/storage';

// Hardcoded defaults (used if DB and env vars are both unavailable)
const DEFAULT_MAX_BOARDS = 5;
const DEFAULT_MAX_CARDS = 100;

// Static exports for env-var overrides (used in E2E tests and as sync fallback)
export const MAX_BOARDS_PER_USER = process.env.MAX_BOARDS_PER_USER ? parseInt(process.env.MAX_BOARDS_PER_USER) : DEFAULT_MAX_BOARDS;
export const MAX_CARDS_PER_BOARD = process.env.MAX_CARDS_PER_BOARD ? parseInt(process.env.MAX_CARDS_PER_BOARD) : DEFAULT_MAX_CARDS;

/**
 * Get the effective max boards per user.
 * Priority: env var override > DB setting > hardcoded default.
 * Env var takes highest priority so E2E tests can override without DB changes.
 */
export async function getMaxBoardsPerUser(): Promise<number> {
    if (process.env.MAX_BOARDS_PER_USER) {
        return parseInt(process.env.MAX_BOARDS_PER_USER);
    }
    const dbValue = await getAppSetting('max_boards_per_user');
    if (dbValue) {
        const parsed = parseInt(dbValue);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_MAX_BOARDS;
}

/**
 * Get the effective max cards per board.
 * Priority: env var override > DB setting > hardcoded default.
 */
export async function getMaxCardsPerBoard(): Promise<number> {
    if (process.env.MAX_CARDS_PER_BOARD) {
        return parseInt(process.env.MAX_CARDS_PER_BOARD);
    }
    const dbValue = await getAppSetting('max_cards_per_board');
    if (dbValue) {
        const parsed = parseInt(dbValue);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_MAX_CARDS;
}
