import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Shield, Smartphone, Smile, Mic, Grid, Lock, Globe, Users, ArrowRight } from 'lucide-react';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-violet-600 dark:bg-violet-900 text-white">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform -rotate-3">
                        <Image src="/logo.svg" alt="My Voice Board Logo" width={64} height={64} className="w-16 h-16" />
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
                        My Voice Board
                    </h1>
                    <p className="text-xl sm:text-2xl text-violet-100 max-w-2xl font-medium">
                        Giving a voice to every child.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 space-y-12">

                {/* Mission Statement */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-2xl text-violet-600 dark:text-violet-400 shrink-0">
                            <Heart size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                Why We Built This
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                My Voice Board is designed mainly for parents and teachers to create customized communication boards for non-verbal autistic children. We believe that every child deserves to be heard, and communication tools should be accessible, personal, and easy to use.
                            </p>
                        </div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How It Works</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Simple steps to start communicating</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 sm:p-10 shadow-sm border border-indigo-100 dark:border-slate-700">
                    <div className="text-center mb-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Join Our Community</h2>
                        </div>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-2">
                            My Voice Board isn't just a tool; it's a growing library of shared resources.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Box 1 */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative z-10 transition-transform duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Globe size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Public Board Library</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                Browse boards created by other parents, teachers, and therapists. Find pre-made boards for specific needs like "School Morning Routine," "Sensory Activities," or "Restaurant Visits."
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
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share & Collaborate</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                Have you created a great board? Share it with the community to help others! You can share entire boards or individual cards, making it easier for other caregivers to find exactly what they need.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Privacy & Safety - The requested section */}
                <div className="bg-slate-900 text-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 sm:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-green-400" size={32} />
                            <h2 className="text-2xl sm:text-3xl font-bold">Privacy & Safety</h2>
                        </div>

                        <div className="space-y-6 text-slate-300 leading-relaxed">
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                                    <Lock size={20} className="text-violet-400" />
                                    The Short Version
                                </h3>
                                <p className="font-medium text-white/90">
                                    I built My Voice Board to help children communicate, not to harvest data. I do not sell your data, I do not advertise to you, and the photos you upload for your boards remain yours.
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
                                    This is a tool for communication, not a platform for ads. We will never serve advertisements to you or your children within the application.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center py-8">
                    <Link
                        href="/my-boards"
                        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-violet-500/20"
                    >
                        Get Started Now
                    </Link>
                </div>

            </div>
        </main>
    );
}
