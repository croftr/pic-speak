export interface PredefinedCategory {
    name: string;
    emoji: string;
}

export const PREDEFINED_CATEGORIES: PredefinedCategory[] = [
    { name: 'Core', emoji: '⭐' },
    { name: 'Feelings', emoji: '💛' },
    { name: 'Food', emoji: '🍎' },
    { name: 'People', emoji: '👨‍👩‍👧‍👦' },
    { name: 'Activities', emoji: '🏃' },
    { name: 'Places', emoji: '🏠' },
    { name: 'Animals', emoji: '🐾' },
    { name: 'Music', emoji: '🎵' },
    { name: 'Health', emoji: '🩺' },
];

/** Look up the emoji for a category name (case-insensitive). */
export function getCategoryEmoji(categoryName: string): string | undefined {
    const normalized = categoryName.trim().toLowerCase();
    return PREDEFINED_CATEGORIES.find(c => c.name.toLowerCase() === normalized)?.emoji;
}
