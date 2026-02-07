'use client';

import { Search, X } from 'lucide-react';
import { Card } from '@/types';
import { getCategoryEmoji } from '@/lib/categories';
import clsx from 'clsx';

interface BoardFilterProps {
    cards: Card[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    categoryFilter: string;
    setCategoryFilter: (category: string) => void;
    isEditing: boolean;
}

export default function BoardFilter({
    cards,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    isEditing
}: BoardFilterProps) {
    // Get unique categories from cards (excluding empty/undefined), normalized for case/whitespace
    const normalizeCategory = (cat: string) => cat.trim().toLowerCase().replace(/^\w/, c => c.toUpperCase());

    const existingCategories = [...new Set(cards.map(c => c.category).filter((c): c is string => !!c).map(normalizeCategory))];
    const showCategoryFilter = existingCategories.length > 0;
    const showSearch = isEditing && cards.length > 6;

    if (!showCategoryFilter && !showSearch) {
        return null;
    }

    return (
        <>
            {/* Search Bar - Only show when there are many cards */}
            {showSearch && (
                <div className="max-w-7xl mx-auto mb-3 sm:mb-4 px-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search cards..."
                            className="w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Category Filter - Only show if categories exist */}
            {showCategoryFilter && (
                <div className="max-w-7xl mx-auto mb-4 sm:mb-6 px-1">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            onClick={() => setCategoryFilter('All')}
                            className={clsx(
                                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 whitespace-nowrap flex-shrink-0",
                                categoryFilter === 'All'
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                            )}
                        >
                            All ({cards.length})
                        </button>
                        {existingCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={clsx(
                                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 whitespace-nowrap flex-shrink-0",
                                    categoryFilter === cat
                                        ? "bg-primary text-white shadow-md"
                                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                )}
                            >
                                {getCategoryEmoji(cat) && <span>{getCategoryEmoji(cat)}</span>} {cat} ({cards.filter(c => c.category ? normalizeCategory(c.category) === cat : false).length})
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
