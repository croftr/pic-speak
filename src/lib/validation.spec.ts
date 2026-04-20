import { test, expect } from '@playwright/test';
import { validateColor, validateStringLength } from './validation';

test.describe('validateStringLength', () => {
    test('should return null for strings shorter than maxLength', () => {
        expect(validateStringLength('hello', 10, 'Label')).toBeNull();
        expect(validateStringLength('a', 1, 'Label')).toBeNull();
    });

    test('should return null for strings exactly maxLength', () => {
        expect(validateStringLength('12345', 5, 'Label')).toBeNull();
    });

    test('should return null for empty strings (within maxLength)', () => {
        expect(validateStringLength('', 5, 'Label')).toBeNull();
        expect(validateStringLength('', 0, 'Label')).toBeNull();
    });

    test('should return error for strings exceeding maxLength', () => {
        const result = validateStringLength('too long', 5, 'Label');
        expect(result).toBe('Label must be 5 characters or less.');
    });

    test('should return error for string length 1 with maxLength 0', () => {
        const result = validateStringLength('a', 0, 'Name');
        expect(result).toBe('Name must be 0 characters or less.');
    });
});

test.describe('validateColor', () => {
    test('should return null for valid 3-character hex colors', () => {
        expect(validateColor('#fff')).toBeNull();
        expect(validateColor('#000')).toBeNull();
        expect(validateColor('#abc')).toBeNull();
        expect(validateColor('#ABC')).toBeNull();
    });

    test('should return null for valid 6-character hex colors', () => {
        expect(validateColor('#ffffff')).toBeNull();
        expect(validateColor('#000000')).toBeNull();
        expect(validateColor('#6366f1')).toBeNull();
        expect(validateColor('#6366F1')).toBeNull();
    });

    test('should return null for valid 8-character hex colors', () => {
        expect(validateColor('#ffffff00')).toBeNull();
        expect(validateColor('#000000ff')).toBeNull();
        expect(validateColor('#12345678')).toBeNull();
    });

    test('should return null for valid CSS variables', () => {
        expect(validateColor('var(--primary)')).toBeNull();
        expect(validateColor('var(--bg-color)')).toBeNull();
        expect(validateColor('var(--color-123)')).toBeNull();
        expect(validateColor('var(--a)')).toBeNull();
    });

    test('should return error for hex colors missing #', () => {
        const error = 'Invalid color format. Use a hex color (e.g. #6366f1) or CSS variable (e.g. var(--primary)).';
        expect(validateColor('fff')).toBe(error);
        expect(validateColor('ffffff')).toBe(error);
    });

    test('should return error for invalid hex length', () => {
        const error = 'Invalid color format. Use a hex color (e.g. #6366f1) or CSS variable (e.g. var(--primary)).';
        expect(validateColor('#f')).toBe(error);
        expect(validateColor('#ff')).toBe(error);
        expect(validateColor('#fffff')).toBe(error);
        expect(validateColor('#fffffffff')).toBe(error);
    });

    test('should return error for invalid hex characters', () => {
        const error = 'Invalid color format. Use a hex color (e.g. #6366f1) or CSS variable (e.g. var(--primary)).';
        expect(validateColor('#ggg')).toBe(error);
        expect(validateColor('#ff ff')).toBe(error);
    });

    test('should return error for invalid CSS variable format', () => {
        const error = 'Invalid color format. Use a hex color (e.g. #6366f1) or CSS variable (e.g. var(--primary)).';
        expect(validateColor('var(-primary)')).toBe(error);
        expect(validateColor('--primary')).toBe(error);
        expect(validateColor('var(--)')).toBe(error);
        expect(validateColor('primary')).toBe(error);
    });

    test('should return error for empty string or null-like values', () => {
        const error = 'Invalid color format. Use a hex color (e.g. #6366f1) or CSS variable (e.g. var(--primary)).';
        expect(validateColor('')).toBe(error);
        // @ts-expect-error - testing invalid input type
        expect(validateColor(null)).toBe(error);
    });
});
