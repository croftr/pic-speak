import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Heart, LayoutGrid, Play, Sparkles } from 'lucide-react';
import ExploreMoreLinks from '@/components/marketing/ExploreMoreLinks';

export const metadata: Metadata = {
  title: 'Digital PECS Alternative | Autism AAC Communication App',
  description: 'A modern, digital alternative to PECS for autistic children. Create customized communication boards with familiar photos and voices to encourage language development.',
  alternates: {
    canonical: '/use-cases/autism-communication',
  },
  openGraph: {
    title: 'Digital PECS Alternative for Autism | My Voice Board',
    description: 'Swap bulky picture binders for a free digital AAC app. Familiar photos, familiar voices, made for autistic children.',
    url: '/use-cases/autism-communication',
  },
};

export default function AutismCommunicationPage() {
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Digital PECS Alternative | Autism AAC Communication App",
            "description": "A modern, digital alternative to PECS for autistic children. Create customized communication boards with familiar photos and voices to encourage language development.",
            "url": "https://www.myvoiceboard.com/use-cases/autism-communication",
            "about": [
              {
                "@type": "MedicalCondition",
                "name": "Autism"
              },
              {
                "@type": "MedicalCondition",
                "name": "Autism Spectrum Disorder"
              }
            ]
          })
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-12 pb-14 sm:pt-20 sm:pb-20">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-50 dark:opacity-20"></div>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-indigo-400/20 dark:bg-indigo-600/15 blur-3xl"></div>
          <div className="absolute -bottom-40 right-0 w-[24rem] h-[24rem] rounded-full bg-purple-300/15 dark:bg-purple-500/10 blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-start gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium text-sm mb-6 animate-fade-up">
            <Sparkles size={16} className="mt-0.5 shrink-0" />
            <span className="text-left">The modern digital alternative to physical PECS books</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
            Give your child the power of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">connection</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
            Transition seamlessly from bulky picture binders to a beautiful, customized digital AAC app. Use familiar photos and voices to encourage speech and reduce frustration for autistic children.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Link href="/my-boards" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 touch-manipulation">
              Start Creating
              <ArrowRight size={20} />
            </Link>
            <Link href="/board/starter-template" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-700 touch-manipulation">
              <Play size={20} className="text-orange-500" />
              Try a Board
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-6 py-14 sm:py-20 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-10 sm:mb-16">
            Why families are switching to My Voice Board
          </h2>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Familiar Faces &amp; Voices</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Children respond best to what they know. Upload photos of their actual toys, favorite foods, and record familiar voices to say the words aloud.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5">
                <LayoutGrid size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No More Lost Cards</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Forget printing, laminating, and losing velcro cards. Carry your child&apos;s entire vocabulary right on your phone or tablet wherever you go.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Grows With Them</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Start with a simple 4-card choice board, and easily expand to larger, categorized boards as your child&apos;s communication skills develop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section - Helps rank for long-tail keywords */}
      <article className="px-4 sm:px-6 py-14 sm:py-20 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-8">
          A Modern Approach to Autism Communication
        </h2>
        <div className="space-y-5 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            For decades, the Picture Exchange Communication System (PECS) has been a foundational tool for non-verbal children with autism. However, physical binders can be cumbersome, easily damaged, and time-consuming for parents and educators to maintain.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">My Voice Board</strong> serves as a powerful, digital Augmentative and Alternative Communication (AAC) app. By leveraging interactive touch screens, it not only replaces physical picture cards but enhances the experience with immediate audio feedback. This auditory component is crucial for encouraging verbal approximations and eventual speech development in autistic children.
          </p>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-5">How It Works</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="mt-1 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Take Photos:</strong> Snap a quick photo of your child&apos;s favorite snack or toy.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Add Voice:</strong> Record yourself (or a sibling) saying the word.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Communicate:</strong> Your child taps the photo to hear the word and express their needs instantly.
            </span>
          </li>
        </ul>
      </article>

      {/* Cross-links */}
      <div className="bg-white dark:bg-slate-900/50">
        <ExploreMoreLinks current="autism-communication" />
      </div>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-14 sm:py-20 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 p-8 sm:p-12 text-center text-white shadow-xl shadow-indigo-600/20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to hear their voice?</h2>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto mb-8">
            Free forever — no subscriptions, no ads. Build your child&apos;s first board in minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/my-boards" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-lg transition-all shadow-lg hover:-translate-y-1 touch-manipulation">
              Get Started
              <ArrowRight size={20} />
            </Link>
            <Link href="/public-boards" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg border border-white/30 transition-all hover:-translate-y-1 touch-manipulation">
              View Example Boards
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
