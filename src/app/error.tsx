'use client';

import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="text-6xl">😕</div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Something went wrong
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Don&apos;t worry — your boards and cards are safe. Try refreshing the page.
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 active:scale-95 transition-all"
                    >
                        <RefreshCw size={20} />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all"
                    >
                        <Home size={20} />
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
