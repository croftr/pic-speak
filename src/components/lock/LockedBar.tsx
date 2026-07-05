'use client';

import { Grid3X3, Grid2X2, LayoutGrid } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import UnlockButton from './UnlockButton';

interface LockedBarProps {
    boardName: string;
}

export default function LockedBar({ boardName }: LockedBarProps) {
    const { cardSize: userCardSize, setCardSize } = useSettings();

    return (
        <header className="max-w-7xl mx-auto mb-4 md:mb-6 flex items-center justify-between gap-2 px-1.5 py-1.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-sm border border-gray-100/80 dark:border-gray-800/80">
            <h1 className="text-sm sm:text-base font-display font-bold text-gray-900 dark:text-white truncate min-w-0 flex-1 px-1">
                {boardName || 'Loading...'}
            </h1>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={() => {
                        const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                        const currentIndex = sizes.indexOf(userCardSize);
                        const nextIndex = (currentIndex + 1) % sizes.length;
                        setCardSize(sizes[nextIndex]);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
                    title={`Card size: ${userCardSize}`}
                >
                    {userCardSize === 'small' && <Grid3X3 className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                    {userCardSize === 'medium' && <Grid2X2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                    {userCardSize === 'large' && <LayoutGrid className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                </button>
                <UnlockButton />
            </div>
        </header>
    );
}
