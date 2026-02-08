/**
 * Returns an error message if the string exceeds maxLength, or null if valid.
 */
export function validateStringLength(
    value: string,
    maxLength: number,
    fieldName: string,
): string | null {
    if (value.length > maxLength) {
        return `${fieldName} must be ${maxLength} characters or less.`;
    }
    return null;
}

/**
 * Validates a color string. Allows hex colors (#fff, #ffffff, #ffffffff)
 * and CSS variables (var(--name)). Returns an error message or null if valid.
 */
const COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|var\(--[a-zA-Z0-9-]+\))$/;

export function validateColor(value: string): string | null {
    if (!COLOR_REGEX.test(value)) {
        return 'Invalid color format. Use a hex color (e.g. #6366f1) or CSS variable (e.g. var(--primary)).';
    }
    return null;
}

/** Allowed TTS voices (Neural2 only — no expensive Studio/Polyglot voices) */
export const ALLOWED_TTS_VOICES = [
    'en-US-Neural2-A',
    'en-US-Neural2-C',
    'en-US-Neural2-D',
    'en-US-Neural2-E',
    'en-US-Neural2-F',
    'en-US-Neural2-G',
    'en-US-Neural2-H',
    'en-US-Neural2-I',
    'en-US-Neural2-J',
];
