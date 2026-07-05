'use client';

import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';

/**
 * Wide cover image shown across the top of a board tile. Boards are easier
 * to recognise by picture than by name — especially for non-readers — so
 * the cover gets real space. Pass the resolved source (cover ?? first-card
 * fallback); renders a soft placeholder when there is no image at all.
 */
export default function BoardCoverBanner({ src, alt = '' }: { src?: string; alt?: string }) {
    return (
        <div className="relative w-full aspect-[2/1] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-teal-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 overflow-hidden">
            {typeof src === 'string' && src ? (
                src.startsWith('http') ? (
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-violet-200 dark:text-slate-600" />
                </div>
            )}
        </div>
    );
}
