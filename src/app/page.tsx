'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Mic, Image as ImageIcon, Smile, Plus, Eye } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Board } from '@/types';

export default function LandingPage() {
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-4 md:pt-12 lg:pt-20 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left z-10">
            <SignedIn>
              <Link
                href="/my-boards"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-lg mb-8 hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/40 group active:scale-95"
              >
                Go to My Boards
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </SignedIn>
            <SignedOut>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-8">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Now with AI Image Generation
              </div>
            </SignedOut>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 dark:text-white mb-8 leading-[1.1]">
              Give a Voice to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                Every Picture
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Create personalized PECS boards in seconds. Upload photos, record sounds, and help non-verbal children communicate with confidence.
            </p>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
              {/* Trust badges placeholders */}
              <span className="font-bold text-xl flex items-center gap-2"><Smile className="w-6 h-6" /> Trusted by Parents</span>
            </div>
          </div>

          <div className="flex-1 relative w-full aspect-square max-w-lg lg:max-w-none">
            {/* Abstract decorations */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl mix-blend-multiply animate-pulse" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl mix-blend-multiply animate-pulse delay-75" />

            {/* Mockup */}
            <div className="relative z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl rotate-[-6deg] hover:rotate-0 transition-transform duration-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-2 flex flex-col items-center">
                  <div className="bg-red-100 w-full flex-1 rounded-xl mb-2 flex items-center justify-center">
                    <span className="text-4xl">🍎</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">Apple</span>
                </div>
                <div className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-2 flex flex-col items-center">
                  <div className="bg-blue-100 w-full flex-1 rounded-xl mb-2 flex items-center justify-center">
                    <span className="text-4xl">🥤</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">Juice</span>
                </div>
                <div className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-2 flex flex-col items-center">
                  <div className="bg-green-100 w-full flex-1 rounded-xl mb-2 flex items-center justify-center">
                    <span className="text-4xl">👕</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">Clothes</span>
                </div>
                <div className="aspect-[3/4] bg-primary/10 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -right-8 top-1/2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center gap-3 animate-float delay-100">
                <Mic className="w-6 h-6 text-red-500" />
                <span className="font-bold text-sm">"I want juice!"</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Custom Pictures</h3>
              <p className="text-gray-500">Upload real photos of your home, family, and items to make recognition easier.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Voice Recording</h3>
              <p className="text-gray-500">Record familiarity voices like Mom or Dad, or upload professional audio clips.</p>
            </div>
            <div className="space-y-4">
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
      {!isLoadingBoards && publicBoards.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                Explore Public Boards
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Check out these communication boards shared by our community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicBoards.map((board) => (
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
      )}
    </div>
  );
}
