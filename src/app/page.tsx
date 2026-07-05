'use client';

import Link from 'next/link';
import { SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { Globe, Grid, LogIn, Play, Camera, Mic, Hand } from 'lucide-react';
import { useOfflineAuth } from '@/hooks/useOfflineAuth';
import { clsx } from 'clsx';
import Image from 'next/image';

// NavCard Component for consistent, big, friendly buttons
interface NavCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  description: string;
  iconBgClass: string;
  colorClass: string;
  delay?: number;
  href?: string;
  className?: string;
  as?: 'button' | 'div';
}

function NavCard({ icon, label, description, iconBgClass, colorClass, delay = 0, href, className, style, as = 'button', ...props }: NavCardProps) {
  const content = (
    <div className="flex flex-row sm:flex-col items-center sm:justify-center gap-4 sm:gap-0 p-5 sm:p-6 h-full w-full pointer-events-none text-left sm:text-center">
      <div className={clsx(
        "flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex-shrink-0 sm:mb-4",
        "transform transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300",
        iconBgClass
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <span className="block text-xl sm:text-2xl font-display font-extrabold text-slate-800 dark:text-white">
          {label}
        </span>
        <span className="block text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-0.5 sm:mt-1">
          {description}
        </span>
      </div>
    </div>
  );

  const containerClasses = clsx(
    "relative group w-full sm:aspect-square sm:max-w-sm mx-auto",
    "rounded-3xl shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all duration-300",
    "border border-slate-200/80 dark:border-white/10",
    "hover:-translate-y-1.5 active:scale-[0.98] touch-manipulation",
    "bg-white dark:bg-slate-800/80 backdrop-blur-sm",
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
    <Component type={as === 'button' ? "button" : undefined} className={containerClasses} style={combinedStyle} {...(props as React.HTMLAttributes<HTMLElement>)}>
      {content}
    </Component>
  );
}

// Small "how it works" step shown to visitors
function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-white/10 flex-shrink-0">
        {icon}
      </span>
      <span className="text-sm font-semibold">{text}</span>
    </div>
  );
}

export default function Home() {
  // Offline-aware: keeps "My Boards" reachable with no connection, when
  // Clerk can't confirm the session but the user's boards are cached.
  const { isSignedIn } = useOfflineAuth();
  // May be null while Clerk loads or offline — greeting falls back to a
  // nameless "Welcome back" in that case.
  const { user } = useUser();

  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 py-10">

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-8 sm:gap-12">

        {/* Logo / Header Area — full hero pitch for visitors, compact tagline for
            signed-in users (the header already carries the branding for them) */}
        {isSignedIn ? (
          <div className="text-center space-y-2 animate-in slide-in-from-top-10 duration-700">
            <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-800 dark:text-white tracking-tight">
              {user?.firstName ? `Hello, ${user.firstName}!` : 'Welcome back!'}
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">
              Pick a board and start talking.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 animate-in slide-in-from-top-10 duration-700">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-violet-500/10 flex items-center justify-center p-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Image src="/logo.svg" alt="My Voice Board Logo" width={100} height={100} className="w-full h-full" priority />
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-slate-800 dark:text-white tracking-tight">
              My Voice Board
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto text-balance">
              Picture boards made from your own photos and voice.
              Tap a card — it speaks.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-2">
              <Step icon={<Camera className="w-4 h-4 text-violet-500" />} text="Add your photos" />
              <Step icon={<Mic className="w-4 h-4 text-rose-500" />} text="Record your voice" />
              <Step icon={<Hand className="w-4 h-4 text-teal-500" />} text="Tap to talk" />
            </div>
          </div>
        )}

        {/* Action Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 sm:px-4">

          {isSignedIn && (
            <NavCard
              href="/my-boards"
              icon={<Grid size={40} className="text-violet-600 dark:text-violet-300" />}
              iconBgClass="bg-violet-100 dark:bg-violet-900/40"
              label="My Boards"
              description="Open or edit your boards"
              colorClass="hover:border-violet-300 dark:hover:border-violet-700 hover:ring-4 ring-violet-400/20"
              delay={100}
            />
          )}

          {!isSignedIn && (
            <NavCard
              href="/board/starter-template"
              icon={<Play size={40} className="text-orange-500 dark:text-orange-300" />}
              iconBgClass="bg-orange-100 dark:bg-orange-900/40"
              label="Try a Board"
              description="See how it works — no sign-up"
              colorClass="hover:border-orange-300 dark:hover:border-orange-700 hover:ring-4 ring-orange-400/20"
              delay={100}
            />
          )}

          <NavCard
            href="/public-boards"
            icon={<Globe size={40} className="text-sky-600 dark:text-sky-300" />}
            iconBgClass="bg-sky-100 dark:bg-sky-900/40"
            label="Explore Boards"
            description="Ready-made boards from the community"
            colorClass="hover:border-sky-300 dark:hover:border-sky-700 hover:ring-4 ring-sky-400/20"
            delay={200}
          />

          <SignedOut>
            <SignInButton mode="modal">
              <NavCard
                as="div"
                icon={<LogIn size={40} className="text-emerald-600 dark:text-emerald-300" />}
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/40"
                label="Get Started"
                description="Sign in to build your own boards"
                colorClass="hover:border-emerald-300 dark:hover:border-emerald-700 hover:ring-4 ring-emerald-400/20"
                delay={300}
                className="sm:col-span-2 sm:aspect-auto cursor-pointer"
              />
            </SignInButton>
          </SignedOut>
        </div>

        {/* Footer/Info */}
        <div className="mt-4 sm:mt-8 flex flex-col items-center gap-2 text-center text-slate-400 text-sm animate-in fade-in duration-1000 delay-500">
          <Link href="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
            About My Voice Board & Privacy
          </Link>
          <div className="flex gap-4 mt-2">
            <Link href="/use-cases/autism-communication" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              For Autism & PECS
            </Link>
            <Link href="/use-cases/stroke-recovery" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              For Stroke & Aphasia
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
