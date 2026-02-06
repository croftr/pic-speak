'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn } from '@clerk/nextjs';
import { Home, Grid, Globe } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on board pages — the board view is the primary interaction surface
    if (pathname.startsWith('/board/')) return null;

    const isActive = (path: string) =>
        path === '/' ? pathname === '/' : pathname.startsWith(path);

    const linkClass = (path: string) =>
        `flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] rounded-xl transition-colors touch-manipulation ${isActive(path)
            ? 'text-primary'
            : 'text-gray-400 dark:text-gray-500 active:text-gray-600'
        }`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
                    <Link href="/" className={linkClass('/')}>
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">Home</span>
                    </Link>

                    <SignedIn>
                        <Link href="/my-boards" className={linkClass('/my-boards')}>
                            <Grid className="w-5 h-5" />
                            <span className="text-[10px] font-semibold">My Boards</span>
                        </Link>
                    </SignedIn>

                    <Link href="/public-boards" className={linkClass('/public-boards')}>
                        <Globe className="w-5 h-5" />
                        <span className="text-[10px] font-semibold">Explore</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
