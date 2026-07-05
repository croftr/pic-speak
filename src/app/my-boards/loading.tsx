export default function MyBoardsLoading() {
    return (
        <main className="min-h-screen p-3 sm:p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-6 sm:mb-8 md:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl sm:text-4xl font-display font-black text-gray-900 dark:text-white tracking-tight mb-1">
                            My Boards
                        </h1>
                        <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none bg-gray-200 dark:bg-gray-700 h-12 rounded-full animate-pulse w-36"></div>
                    </div>
                </header>

                {/* Boards Grid Skeleton — mirrors the cover-banner tile layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                        >
                            <div className="w-full aspect-[2/1] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            <div className="p-4 sm:p-5">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4 animate-pulse"></div>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                    <div className="w-14 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
