import { Plus, Sparkles } from 'lucide-react';

export default function MyBoardsLoading() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-950 p-3 sm:p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-6 sm:mb-8 md:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-1 sm:mb-2">
                            My Boards
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500">Manage your communication boards</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none bg-gray-200 dark:bg-gray-700 h-10 sm:h-12 rounded-full animate-pulse w-32"></div>
                    </div>
                </header>

                {/* Template Boards Section Skeleton */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-6 h-6 text-amber-500 opacity-50" />
                        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2].map(i => (
                            <div
                                key={i}
                                className="p-5 sm:p-6 md:p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl sm:rounded-3xl border-2 border-amber-200 dark:border-amber-800 shadow-sm"
                            >
                                <div className="h-7 sm:h-8 bg-amber-200/50 dark:bg-amber-700/30 rounded-lg mb-2 sm:mb-3 w-3/4 animate-pulse"></div>
                                <div className="space-y-2 mb-4 sm:mb-6">
                                    <div className="h-4 bg-amber-200/50 dark:bg-amber-700/30 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-amber-200/50 dark:bg-amber-700/30 rounded w-5/6 animate-pulse"></div>
                                </div>
                                <div className="h-12 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl opacity-50 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* My Boards Section Skeleton */}
                <div className="mb-6">
                    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Boards Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="p-5 sm:p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm"
                        >
                            <div className="h-7 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 sm:mb-3 w-3/4 animate-pulse"></div>
                            <div className="space-y-2 mb-3 sm:mb-4 min-h-[3em] sm:min-h-[4.5em]">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
                            </div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
