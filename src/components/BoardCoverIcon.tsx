'use client';

import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';

/**
 * Large-icon-sized board cover, shown to the left of the board name.
 * Pass the resolved source (cover ?? first-card fallback); renders a
 * placeholder icon when there is no image at all.
 */
export default function BoardCoverIcon({ src, className = 'w-12 h-12' }: { src?: string; className?: string }) {
    return (
        <div className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 flex-shrink-0 ${className}`}>
            {src ? (
                src.startsWith('http') ? (
                    <Image
                        src={src}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="w-full h-full object-cover" />
                )
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                </div>
            )}
        </div>
    );
}
