import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, MessageSquare, Mic, Play, UserPlus } from 'lucide-react';
import ExploreMoreLinks from '@/components/marketing/ExploreMoreLinks';

export const metadata: Metadata = {
  title: 'Stroke & Aphasia Communication App | My Voice Board',
  description: 'An intuitive AAC app to help stroke survivors and adults with aphasia communicate easily. Create custom boards with personal photos to regain independence.',
  alternates: {
    canonical: '/use-cases/stroke-recovery',
  },
  openGraph: {
    title: 'Stroke & Aphasia Communication App | My Voice Board',
    description: 'A dignified, free AAC app for stroke survivors and adults with aphasia. Custom boards from your own photos and familiar voices.',
    url: '/use-cases/stroke-recovery',
  },
};

export default function StrokeRecoveryPage() {
  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Stroke & Aphasia Communication App | My Voice Board",
            "description": "A free, dignified AAC app for stroke survivors and adults with aphasia. Custom boards from your own photos and familiar voices.",
            "url": "https://www.myvoiceboard.com/use-cases/stroke-recovery",
            "about": [
              {
                "@type": "MedicalCondition",
                "name": "Stroke"
              },
              {
                "@type": "MedicalCondition",
                "name": "Aphasia"
              }
            ]
          })
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-12 pb-14 sm:pt-20 sm:pb-20">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-50 dark:opacity-20"></div>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-blue-400/20 dark:bg-blue-600/15 blur-3xl"></div>
          <div className="absolute -bottom-40 right-0 w-[24rem] h-[24rem] rounded-full bg-teal-300/15 dark:bg-teal-500/10 blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-start gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm mb-6 animate-fade-up">
            <MessageSquare size={16} className="mt-0.5 shrink-0" />
            <span className="text-left">Designed for adults with Aphasia and Speech Apraxia</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
            Regain your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500">independence</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
            A dignified, easy-to-use communication app for stroke survivors. Customize your boards with photos of your actual home, family, and needs to express yourself clearly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Link href="/my-boards" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 touch-manipulation">
              Create Your Board
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
            Communication on your terms
          </h2>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                <UserPlus size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Adult-Focused Design</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Unlike many AAC apps built primarily for children, My Voice Board offers a clean, dignified interface that respects adult users.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Customized to Your Life</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Take pictures of your actual coffee mug, your remote, or your medication. Create a communication board that actually reflects your daily routine.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <Mic size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Familiar Voices</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Have a spouse or caregiver record the audio for your cards, providing a familiar and comforting voice instead of a robotic synthesizer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <article className="px-4 sm:px-6 py-14 sm:py-20 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center mb-8">
          Support for Aphasia and Stroke Recovery
        </h2>
        <div className="space-y-5 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Recovering from a stroke often brings unexpected challenges, particularly when it comes to speech and language. Aphasia can make it incredibly frustrating to convey basic needs, feelings, or choices.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-white">My Voice Board</strong> is an intuitive Augmentative and Alternative Communication (AAC) tool designed to reduce that frustration. By providing a clear, visually driven interface, survivors can simply tap a personalized image to have their needs spoken aloud.
          </p>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-10 mb-5">Bridging the Communication Gap</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="mt-1 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Reduce Frustration:</strong> Quickly express urgent needs like &quot;water,&quot; &quot;bathroom,&quot; or &quot;pain&quot; without struggling for words.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Enhance Therapy:</strong> Speech-Language Pathologists (SLPs) frequently recommend visual aids and AAC devices to bridge the gap during active speech therapy.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Maintain Connection:</strong> Stay engaged with family and friends by easily participating in conversations using pre-recorded custom phrases.
            </span>
          </li>
        </ul>
      </article>

      {/* Cross-links */}
      <div className="bg-white dark:bg-slate-900/50">
        <ExploreMoreLinks current="stroke-recovery" />
      </div>

      {/* CTA */}
      <section className="px-4 sm:px-6 py-14 sm:py-20 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-teal-600 p-8 sm:p-12 text-center text-white shadow-xl shadow-blue-600/20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Say what you need, today</h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">
            Free forever — no subscriptions, no ads. Build your first board in minutes, on any phone or tablet.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/my-boards" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-700 font-bold text-lg transition-all shadow-lg hover:-translate-y-1 touch-manipulation">
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
