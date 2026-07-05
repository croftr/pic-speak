'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Globe } from 'lucide-react';
import { useOfflineAuth } from '@/hooks/useOfflineAuth';

export default function BottomNav() {
    const pathname = usePathname();
    // Offline-aware: keep My Boards reachable when boards are cached but
    // Clerk can't confirm the session without a connection.
    const { isSignedIn } = useOfflineAuth();

    // Hide on board pages — the board view is the primary interaction surface
    if (pathname.startsWith('/board/')) return null;

    const isActive = (path: string) =>
        path === '/' ? pathname === '/' : pathname.startsWith(path);

    const linkClass = (path: string) =>
        `relative flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[72px] min-h-[52px] rounded-2xl transition-all touch-manipulation ${isActive(path)
            ? 'text-primary bg-primary/10'
            : 'text-gray-400 dark:text-gray-500 active:text-gray-600 active:bg-gray-100 dark:active:bg-slate-800'
        }`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-safe">
                <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
                    <Link href="/" className={linkClass('/')}>
                        <Home className="w-5 h-5" strokeWidth={isActive('/') ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">Home</span>
                    </Link>

                    {isSignedIn && (
                        <Link href="/my-boards" className={linkClass('/my-boards')}>
                            <Grid className="w-5 h-5" strokeWidth={isActive('/my-boards') ? 2.5 : 2} />
                            <span className="text-[11px] font-bold">My Boards</span>
                        </Link>
                    )}

                    <Link href="/public-boards" className={linkClass('/public-boards')}>
                        <Globe className="w-5 h-5" strokeWidth={isActive('/public-boards') ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">Explore</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
