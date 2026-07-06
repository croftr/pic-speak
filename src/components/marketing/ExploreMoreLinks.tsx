import Link from 'next/link';
import { ArrowRight, Heart, MessageSquare, Sparkles } from 'lucide-react';

type MarketingPage = 'about' | 'autism-communication' | 'stroke-recovery';

// One entry per marketing page so About and both use-case pages can
// cross-link to each other without repeating the copy.
const PAGES: Record<MarketingPage, {
    href: string;
    icon: React.ElementType;
    iconClass: string;
    hoverClass: string;
    eyebrow: string;
    title: string;
    description: string;
}> = {
    'about': {
        href: '/about',
        icon: Heart,
        iconClass: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
        hoverClass: 'hover:border-violet-300 dark:hover:border-violet-700',
        eyebrow: 'Our story',
        title: 'About My Voice Board',
        description: 'Why this app is free forever, how it works, and our promise on privacy — no ads, no fees, no selling data.',
    },
    'autism-communication': {
        href: '/use-cases/autism-communication',
        icon: Sparkles,
        iconClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
        hoverClass: 'hover:border-indigo-300 dark:hover:border-indigo-700',
        eyebrow: 'For families & teachers',
        title: 'Autism & PECS',
        description: 'A modern digital alternative to physical PECS books for autistic children — real photos and familiar voices.',
    },
    'stroke-recovery': {
        href: '/use-cases/stroke-recovery',
        icon: MessageSquare,
        iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
        hoverClass: 'hover:border-blue-300 dark:hover:border-blue-700',
        eyebrow: 'For adults & carers',
        title: 'Stroke & Aphasia',
        description: 'A dignified communication aid for adults regaining speech after a stroke or living with aphasia.',
    },
};

export default function ExploreMoreLinks({ current }: { current: MarketingPage }) {
    const others = (Object.keys(PAGES) as MarketingPage[]).filter((key) => key !== current);

    return (
        <section aria-labelledby="explore-more-heading" className="px-4 sm:px-6 py-14 sm:py-20 max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
                <h2 id="explore-more-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    Keep exploring
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    One app, many voices — see how others use it.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {others.map((key) => {
                    const page = PAGES[key];
                    const Icon = page.icon;
                    return (
                        <Link
                            key={key}
                            href={page.href}
                            className={`group flex flex-col bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-lg hover:-translate-y-1 touch-manipulation ${page.hoverClass}`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`p-3 rounded-2xl shrink-0 ${page.iconClass}`}>
                                    <Icon size={22} />
                                </span>
                                <div>
                                    <span className="block text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                        {page.eyebrow}
                                    </span>
                                    <span className="block text-lg font-bold text-slate-900 dark:text-white">
                                        {page.title}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                {page.description}
                            </p>
                            <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                                Read more
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
