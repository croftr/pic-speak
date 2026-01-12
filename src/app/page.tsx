'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, MessageSquare, Mic, Image as ImageIcon, Smile, Plus, Eye, User } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Board } from '@/types';

function PublicBoardsSection() {
  const searchParams = useSearchParams();
  const creatorFilter = searchParams.get('creator');

  const [publicBoards, setPublicBoards] = useState<Board[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);

  useEffect(() => {
    fetch('/api/boards/public')
      .then(res => res.json())
      .then(data => {
        setPublicBoards(data);
        setIsLoadingBoards(false);
      })
      .catch(err => {
        console.error('Error loading public boards:', err);
        setIsLoadingBoards(false);
      });
  }, []);

  // Filter boards by creator if specified
  const displayedBoards = creatorFilter
    ? publicBoards.filter(board => board.userId === creatorFilter)
    : publicBoards;

  if (isLoadingBoards || displayedBoards.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
            {creatorFilter ? `Boards by ${displayedBoards[0]?.creatorName || 'Creator'}` : 'Explore Public Boards'}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {creatorFilter ? 'All public boards from this creator' : 'Check out these communication boards shared by our community'}
          </p>
          {creatorFilter && (
            <Link
              href="/"
              className="inline-block mt-4 text-primary hover:underline font-medium"
            >
              ← View all public boards
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBoards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="group relative block p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <div className="absolute top-3 right-3 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Public
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-16 group-hover:text-primary transition-colors">
                {board.name}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                {board.description || 'No description provided.'}
              </p>
              {board.creatorName && (
                <div className="mb-3 flex items-center gap-2">
                  {board.creatorImageUrl ? (
                    <img
                      src={board.creatorImageUrl}
                      alt={board.creatorName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {board.creatorName}
                    </p>
                    {board.userId && (
                      <Link
                        href={`/?creator=${board.userId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const url = new URL(window.location.href);
                          url.searchParams.set('creator', board.userId);
                          window.location.href = url.toString();
                        }}
                        className="text-[10px] text-primary hover:underline"
                      >
                        View more boards
                      </Link>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {new Date(board.createdAt).toLocaleDateString()}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-4 md:pt-12 lg:pt-20 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              Help your child{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                communicate
              </span>{' '}
              with pictures & voice
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-2xl mx-auto lg:mx-0">
              Create custom PECS boards with your own photos and voice recordings. Perfect for children with communication needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="group bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:border-primary hover:text-primary transition-all duration-300">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/my-boards" className="group bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                  Go to My Boards
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="flex-1 relative">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Floating cards */}
              <div className="absolute inset-0 animate-float">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-2xl transform rotate-12 flex items-center justify-center">
                  <MessageSquare className="w-16 h-16 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 animate-float-delayed">
                <div className="absolute bottom-20 left-10 w-28 h-28 bg-gradient-to-br from-accent to-pink-500 rounded-3xl shadow-2xl transform -rotate-12 flex items-center justify-center">
                  <Mic className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 animate-float-delayed-2">
                <div className="absolute top-32 left-0 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl transform rotate-6 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 dark:text-white mb-16">
            Everything you need to build communication boards
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 space-y-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Your Photos</h3>
              <p className="text-gray-500">Use familiar images from your own camera roll. Real photos help children connect faster.</p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 space-y-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Your Voice</h3>
              <p className="text-gray-500">Record words in your own voice or upload audio. Familiar voices create comfort and trust.</p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 space-y-4">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Easy to Use</h3>
              <p className="text-gray-500">Designed for accessibility. Big buttons, clear visuals, and instant feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Boards Section */}
      <Suspense fallback={<div className="py-16 text-center">Loading boards...</div>}>
        <PublicBoardsSection />
      </Suspense>
    </div>
  );
}
