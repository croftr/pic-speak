import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Heart, Sparkles, LayoutGrid } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Digital PECS Alternative | Autism AAC Communication App',
  description: 'A modern, digital alternative to PECS for autistic children. Create customized communication boards with familiar photos and voices to encourage language development.',
};

export default function AutismCommunicationPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white dark:from-indigo-950 dark:via-slate-950 dark:to-slate-950">
      
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-16 md:pt-32 md:pb-24 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-20 opacity-50"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-medium text-sm mb-8 animate-in slide-in-from-bottom-4 duration-700">
          <Sparkles size={16} />
          <span>The modern digital alternative to physical PECS books</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">
          Give your child the power of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">connection</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mb-12 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          Transition seamlessly from bulky picture binders to a beautiful, customized digital AAC app. Use familiar photos and voices to encourage speech and reduce frustration for autistic children.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1">
            Start Creating
            <ArrowRight size={20} />
          </Link>
          <Link href="/public-boards" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-700">
            View Example Boards
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            Why families are switching to My Voice Board
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Familiar Faces & Voices</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Children respond best to what they know. Upload photos of their actual toys, favorite foods, and record familiar voices to say the words aloud.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <LayoutGrid size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No More Lost Cards</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Forget printing, laminating, and losing velcro cards. Carry your child's entire vocabulary right on your phone or tablet wherever you go.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Grows With Them</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Start with a simple 4-card choice board, and easily expand to larger, categorized boards as your child's communication skills develop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section - Helps rank for long-tail keywords */}
      <article className="px-6 py-24 max-w-4xl mx-auto prose prose-slate dark:prose-invert prose-lg">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-8">
          A Modern Approach to Autism Communication
        </h2>
        <p>
          For decades, the Picture Exchange Communication System (PECS) has been a foundational tool for non-verbal children with autism. However, physical binders can be cumbersome, easily damaged, and time-consuming for parents and educators to maintain.
        </p>
        <p>
          <strong>My Voice Board</strong> serves as a powerful, digital Augmentative and Alternative Communication (AAC) app. By leveraging interactive touch screens, it not only replaces physical picture cards but enhances the experience with immediate audio feedback. This auditory component is crucial for encouraging verbal approximations and eventual speech development in autistic children.
        </p>
        <h3>How It Works</h3>
        <ul>
          <li><strong>Take Photos:</strong> Snap a quick photo of your child's favorite snack or toy.</li>
          <li><strong>Add Voice:</strong> Record yourself (or a sibling) saying the word.</li>
          <li><strong>Communicate:</strong> Your child taps the photo to hear the word and express their needs instantly.</li>
        </ul>
      </article>

    </main>
  );
}
