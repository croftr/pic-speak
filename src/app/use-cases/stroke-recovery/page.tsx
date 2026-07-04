import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Mic, UserPlus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Stroke & Aphasia Communication App | My Voice Board',
  description: 'An intuitive AAC app to help stroke survivors and adults with aphasia communicate easily. Create custom boards with personal photos to regain independence.',
};

export default function StrokeRecoveryPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white dark:from-blue-950 dark:via-slate-950 dark:to-slate-950">
      
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-16 md:pt-32 md:pb-24 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-20 opacity-50"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm mb-8 animate-in slide-in-from-bottom-4 duration-700">
          <MessageSquare size={16} />
          <span>Designed for adults with Aphasia and Speech Apraxia</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">
          Regain your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500">independence</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mb-12 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          A dignified, easy-to-use communication app for stroke survivors. Customize your boards with photos of your actual home, family, and needs to express yourself clearly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1">
            Create Your Board
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            Communication on your terms
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                <UserPlus size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Adult-Focused Design</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Unlike many AAC apps built primarily for children, My Voice Board offers a clean, dignified interface that respects adult users.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Customized to Your Life</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Take pictures of your actual coffee mug, your remote, or your medication. Create a communication board that actually reflects your daily routine.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
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
      <article className="px-6 py-24 max-w-4xl mx-auto prose prose-slate dark:prose-invert prose-lg">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-8">
          Support for Aphasia and Stroke Recovery
        </h2>
        <p>
          Recovering from a stroke often brings unexpected challenges, particularly when it comes to speech and language. Aphasia can make it incredibly frustrating to convey basic needs, feelings, or choices.
        </p>
        <p>
          <strong>My Voice Board</strong> is an intuitive Augmentative and Alternative Communication (AAC) tool designed to reduce that frustration. By providing a clear, visually driven interface, survivors can simply tap a personalized image to have their needs spoken aloud.
        </p>
        <h3>Bridging the Communication Gap</h3>
        <ul>
          <li><strong>Reduce Frustration:</strong> Quickly express urgent needs like &quot;water,&quot; &quot;bathroom,&quot; or &quot;pain&quot; without struggling for words.</li>
          <li><strong>Enhance Therapy:</strong> Speech-Language Pathologists (SLPs) frequently recommend visual aids and AAC devices to bridge the gap during active speech therapy.</li>
          <li><strong>Maintain Connection:</strong> Stay engaged with family and friends by easily participating in conversations using pre-recorded custom phrases.</li>
        </ul>
      </article>

    </main>
  );
}
