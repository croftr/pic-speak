import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BoardLoading() {
    return (
        <main className="min-h-screen p-2 sm:p-4 md:p-8 relative pb-32">
            {/* Header Skeleton */}
            <header className="max-w-7xl mx-auto mb-4 md:mb-6 sticky top-16 sm:top-[4.5rem] z-40">
                <div className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Link
                            href="/my-boards"
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                            title="Back to My Boards"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-48 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </header>

            {/* Grid Skeleton */}
            <div className="max-w-7xl mx-auto">
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                        <div
                            key={i}
                            className="aspect-square bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-3 sm:p-4"
                        >
                            <div className="w-full h-3/4 bg-gray-200 dark:bg-gray-700 rounded-xl mb-2 sm:mb-3 animate-pulse"></div>
                            <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Loading spinner in center */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                <div className="animate-bounce p-4 rounded-full bg-primary/20">
                    <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                </div>
            </div>
        </main>
    );
}
