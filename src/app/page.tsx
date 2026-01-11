'use client';

import Link from 'next/link';
import { ArrowRight, MessageSquare, Mic, Image as ImageIcon, Smile, Plus } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto p-6 md:p-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
            Pic Speak
          </span>
        </div>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-6 py-2.5 font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-full hover:opacity-90 transition-opacity">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/my-boards"
              className="mr-4 font-bold text-primary hover:underline"
            >
              My Boards
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-12 md:pt-24 lg:pt-32 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Now with Audio Upload
            </div>

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
    </div>
  );
}
