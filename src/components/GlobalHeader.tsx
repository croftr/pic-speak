'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Grid, Globe } from 'lucide-react';
import Image from 'next/image';

export default function GlobalHeader() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show header when scrolling up, hide when scrolling down
            if (currentScrollY < lastScrollY || currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                            <Image
                                src="/logo.svg"
                                alt="Pic Speak Logo"
                                width={100}
                                height={100}
                                className="object-contain"
                            />
                        </div>
                        <span className="text-lg sm:text-xl font-black tracking-tighter text-gray-900 dark:text-white">
                            Pic Speak
                        </span>
                    </Link>

                    {/* Desktop Nav Links - hidden on mobile, shown on sm+ */}
                    <nav className="hidden sm:flex items-center gap-1">
                        <SignedIn>
                            <Link
                                href="/my-boards"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive('/my-boards')
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Grid className="w-4 h-4" />
                                My Boards
                            </Link>
                        </SignedIn>
                        <Link
                            href="/public-boards"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive('/public-boards')
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Globe className="w-4 h-4" />
                            Explore
                        </Link>
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        <SignedIn>
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: 'w-8 h-8 sm:w-9 sm:h-9'
                                    }
                                }}
                            />
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-3 sm:px-4 py-2 font-semibold text-sm text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
                                    Login
                                </button>
                            </SignInButton>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </header>
    );
}
