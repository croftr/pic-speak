export type ValidationResult =
    | { isValid: true; prompt: string }
    | { isValid: false; error: string };

export function validateImagePrompt(prompt: unknown): ValidationResult {
    if (prompt === undefined || prompt === null) {
        return { isValid: false, error: 'Prompt is required' };
    }

    if (typeof prompt !== 'string') {
        return { isValid: false, error: 'Prompt must be a string' };
    }

    const trimmed = prompt.trim();

    if (trimmed.length === 0) {
        return { isValid: false, error: 'Prompt cannot be empty' };
    }

    if (trimmed.length > 500) {
        return { isValid: false, error: 'Prompt is too long (max 500 characters)' };
    }

    return { isValid: true, prompt: trimmed };
}
