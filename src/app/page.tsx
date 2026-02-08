'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Globe, Grid, LogIn, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';

// NavCard Component for consistent, big, friendly buttons
interface NavCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  delay?: number;
  href?: string;
  className?: string;
  as?: 'button' | 'div';
}

function NavCard({ icon, label, colorClass, delay = 0, href, className, style, as = 'button', ...props }: NavCardProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 h-full w-full pointer-events-none">
      <div className="mb-4 transform transition-transform group-hover:scale-110 duration-300">
        {icon}
      </div>
      <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200">
        {label}
      </span>
    </div>
  );

  const containerClasses = clsx(
    "relative group w-full aspect-[4/3] sm:aspect-square max-w-sm mx-auto",
    "rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300",
    "border-4 border-white/50 dark:border-white/10",
    "hover:-translate-y-2 active:scale-95 touch-manipulation",
    "backdrop-blur-sm bg-white/80 dark:bg-slate-800/80",
    colorClass,
    "animate-in fade-in zoom-in duration-500 fill-mode-backwards",
    className
  );

  const combinedStyle = { animationDelay: `${delay}ms`, ...style };

  if (href) {
    return (
      <Link href={href} className={containerClasses} style={combinedStyle}>
        {content}
      </Link>
    );
  }

  const Component = as;

  return (
    <Component type={as === 'button' ? "button" : undefined} className={containerClasses} style={combinedStyle} {...(props as any)}>
      {content}
    </Component>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 flex flex-col items-center justify-center p-4">

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 sm:gap-12">

        {/* Logo / Header Area */}
        <div className="text-center space-y-4 animate-in slide-in-from-top-10 duration-700">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-lg flex items-center justify-center p-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <Image src="/logo.svg" alt="My Voice Board Logo" width={100} height={100} className="w-full h-full" priority />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
            My Voice Board
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">
            Giving a voice to every child
          </p>
        </div>

        {/* Action Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 px-4">

          <SignedOut>
            <SignInButton mode="modal">
              <NavCard
                as="div"
                icon={<LogIn size={64} className="text-green-500" />}
                label="Log In"
                colorClass="border-green-100 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-700 hover:ring-4 ring-green-400/30"
                delay={100}
              />
            </SignInButton>

            <NavCard
              href="/public-boards"
              icon={<Globe size={64} className="text-blue-500" />}
              label="Public Boards"
              colorClass="border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 hover:ring-4 ring-blue-400/30"
              delay={200}
            />
          </SignedOut>

          <SignedIn>
            <NavCard
              href="/my-boards"
              icon={<Grid size={64} className="text-purple-500" />}
              label="My Boards"
              colorClass="border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 hover:ring-4 ring-purple-400/30"
              delay={100}
            />

            <NavCard
              href="/public-boards"
              icon={<Globe size={64} className="text-blue-500" />}
              label="Public Boards"
              colorClass="border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 hover:ring-4 ring-blue-400/30"
              delay={200}
            />
          </SignedIn>
        </div>

        {/* Footer/Info */}
        <div className="mt-8 text-center text-slate-400 text-sm animate-in fade-in duration-1000 delay-500">
          <Link href="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
            About My Voice Board & Privacy
          </Link>
        </div>

      </div>
    </main>
  );
}
