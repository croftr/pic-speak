import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Shield, Smartphone, Smile, Mic, Grid, Lock, Globe, Users, ArrowRight, Gift, Play } from 'lucide-react';
import type { Metadata } from 'next';
import ExploreMoreLinks from '@/components/marketing/ExploreMoreLinks';

export const metadata: Metadata = {
    title: 'About - My Voice Board | Custom Communication Boards',
    description: 'Learn how My Voice Board helps you create personalized communication boards for non-verbal children and adults. Private, secure, and ad-free.',
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        title: 'About My Voice Board',
        description: 'Giving a voice to everyone. Create personalized communication boards with custom photos and familiar voices.',
        url: '/about',
    },
};

export default function AboutPage() {
    return (
        <main className="min-h-screen pb-16">
            {/* Hero Section */}
            <section className="relative overflow-hidden px-4 sm:px-6 pt-12 pb-14 sm:pt-20 sm:pb-20">
                <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-50 dark:opacity-20"></div>
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-violet-400/20 dark:bg-violet-600/15 blur-3xl"></div>
                    <div className="absolute -bottom-40 right-0 w-[24rem] h-[24rem] rounded-full bg-rose-300/15 dark:bg-rose-500/10 blur-3xl"></div>
                </div>

                <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-violet-500/10 flex items-center justify-center mb-6 transform -rotate-3 animate-fade-up">
                        <Image src="/logo.svg" alt="My Voice Board Logo" width={64} height={64} className="w-14 h-14 sm:w-16 sm:h-16" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium text-sm mb-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
                        <Heart size={16} className="shrink-0" />
                        <span>Free for families, teachers &amp; carers</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-5 animate-fade-up" style={{ animationDelay: '160ms' }}>
                        Giving a <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-rose-500">voice</span> to everyone
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-8 animate-fade-up" style={{ animationDelay: '240ms' }}>
                        My Voice Board turns your own photos and voices into picture communication boards for non-verbal children and adults. Tap a card — it speaks.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto animate-fade-up" style={{ animationDelay: '320ms' }}>
                        <Link href="/my-boards" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg transition-all shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:-translate-y-1 touch-manipulation">
                            Get Started
                            <ArrowRight size={20} />
                        </Link>
                        <Link href="/board/starter-template" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-700 touch-manipulation">
                            <Play size={20} className="text-orange-500" />
                            Try a Board
                        </Link>
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">

                {/* Mission Statement */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/5 p-6 sm:p-10 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                        <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-2xl text-violet-600 dark:text-violet-400 shrink-0">
                            <Heart size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                Why We Built This
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                My Voice Board is designed for families, caregivers, and teachers to create customized communication boards for non-verbal children and adults. We believe that everyone deserves to be heard, and communication tools should be accessible, personal, and easy to use.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 100% Free Guarantee */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl p-6 sm:p-10 border border-emerald-100 dark:border-emerald-800">
                    <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-800/50 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Gift size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                100% Free. No Subscriptions. No Fees.
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                As a parent of two non-verbal children, I know firsthand how challenging and expensive communication tools can be. I built My Voice Board to help other families and individuals going through the exact same struggles.
                            </p>
                        </div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">How It Works</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Simple steps to start communicating</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center hover:border-violet-300 transition-colors">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                                <Grid size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">1. Create a Board</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Start a new board for a specific activity, place, or routine.</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center hover:border-violet-300 transition-colors">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full flex items-center justify-center mb-4">
                                <Smile size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">2. Add Cards</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Upload your own photos or choose from our library of symbols.</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center hover:border-violet-300 transition-colors">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
                                <Mic size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">3. Add Voice</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Record familiar voices or use our high-quality text-to-speech.</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center hover:border-violet-300 transition-colors">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                                <Smartphone size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">4. Communicate</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Use the board on any device. Tap a card to speak!</p>
                        </div>
                    </div>
                </div>

                {/* Community & Public Boards */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-indigo-100 dark:border-slate-700">
                    <div className="text-center mb-8 sm:mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Join Our Community</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-2">
                            My Voice Board isn&apos;t just a tool; it&apos;s a growing library of shared resources.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        {/* Box 1 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-10 transition-transform duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Globe size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Public Board Library</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                Browse boards created by other parents, teachers, and therapists. Find pre-made boards for specific needs like &quot;School Morning Routine,&quot; &quot;Sensory Activities,&quot; or &quot;Restaurant Visits.&quot;
                            </p>
                            <Link href="/public-boards" className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 group">
                                Explore Public Boards <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* Box 2 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-10 transition-transform duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                                    <Users size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share &amp; Collaborate</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                Have you created a great board? Share it with the community to help others! You can share entire boards or individual cards, making it easier for other caregivers to find exactly what they need.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Privacy & Safety */}
                <div className="bg-slate-900 text-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-6 sm:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-green-400" size={32} />
                            <h2 className="text-2xl sm:text-3xl font-bold">Privacy &amp; Safety</h2>
                        </div>

                        <div className="space-y-6 text-slate-300 leading-relaxed">
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                    <Lock size={20} className="text-violet-400" />
                                    The Short Version
                                </h3>
                                <p className="font-medium text-white/90">
                                    I built My Voice Board to help people communicate, not to harvest data. I do not sell your data, I do not advertise to you, and the photos you upload for your boards remain yours.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold text-lg mb-2">Your Data is Yours</h3>
                                <p>
                                    We collect only the minimum information needed to make the app work (like your account login to save your boards). Your custom images and audio recordings are stored securely and are only accessible by you (unless you explicitly choose to publish a board to the public library).
                                </p>
                            </div>

                            <div>
                                <h3 className="text-white font-bold text-lg mb-2">No Advertising</h3>
                                <p>
                                    This is a tool for communication, not a platform for ads. We will never serve advertisements to you or your loved ones within the application.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cross-links to use-case pages */}
            <ExploreMoreLinks current="about" />

            {/* CTA */}
            <div className="text-center px-4 sm:px-6 pb-4">
                <Link
                    href="/my-boards"
                    className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-violet-500/20 touch-manipulation"
                >
                    Get Started Now
                    <ArrowRight size={20} />
                </Link>
            </div>
        </main>
    );
}
