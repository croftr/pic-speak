'use client';

import React, { useRef, useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { PROMO_VIDEO } from '@/config/promo';
import { clsx } from 'clsx';

interface PromoVideoPlayerProps {
    className?: string;
    autoPlay?: boolean;
    showCaption?: boolean;
}

export default function PromoVideoPlayer({
    className,
    autoPlay = false,
    showCaption = true,
}: PromoVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [hasError, setHasError] = useState(false);

    const handlePlay = () => {
        if (!videoRef.current) return;
        setHasError(false);
        videoRef.current.play().then(() => {
            setIsPlaying(true);
        }).catch((err) => {
            console.error('Failed to play promo video:', err);
            // Some browsers require explicit interaction before playing
            setIsPlaying(true);
        });
    };

    const handleVideoError = () => {
        setHasError(true);
    };

    return (
        <div className={clsx('w-full max-w-4xl mx-auto', className)}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-200/80 dark:border-slate-800 aspect-video group">
                {/* Video Element */}
                <video
                    ref={videoRef}
                    src={PROMO_VIDEO.videoUrl}
                    poster={PROMO_VIDEO.posterUrl}
                    controls={isPlaying && !hasError}
                    playsInline
                    preload="metadata"
                    autoPlay={autoPlay}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => {
                        // Keep controls visible once started
                    }}
                    onError={handleVideoError}
                    className="w-full h-full object-cover"
                >
                    Your browser does not support the video tag.
                </video>

                {/* Initial Play Overlay (before play is clicked) */}
                {!isPlaying && !hasError && (
                    <button
                        type="button"
                        onClick={handlePlay}
                        aria-label="Play promo video"
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/25 hover:bg-black/35 transition-all group cursor-pointer text-left"
                    >
                        {/* Play Button Icon */}
                        <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-xl shadow-violet-900/50 transform group-hover:scale-110 group-hover:bg-violet-600 transition-all duration-300">
                            <Play size={36} className="fill-white translate-x-0.5" />
                        </div>

                        {/* Badge / Duration */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white drop-shadow-md px-2">
                            <span className="text-sm sm:text-base font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                Tap. Speak. Be heard.
                            </span>
                            <span className="text-xs sm:text-sm font-semibold bg-violet-600/90 px-3 py-1.5 rounded-full shadow-md">
                                90-sec Tour
                            </span>
                        </div>
                    </button>
                )}

                {/* Error Fallback (e.g. S3 403 Access Denied) */}
                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 text-white">
                        <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl mb-3">
                            <AlertCircle size={32} />
                        </div>
                        <h4 className="text-lg font-bold mb-1">Video Stream Unavailable</h4>
                        <p className="text-sm text-slate-300 max-w-md mb-4">
                            The video could not be loaded from storage. If this bucket was recently created, please verify that public read permissions or a bucket policy are configured.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setHasError(false);
                                if (videoRef.current) {
                                    videoRef.current.load();
                                    handlePlay();
                                }
                            }}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>

            {showCaption && (
                <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3">
                    Watch how My Voice Board transforms personalized photos and familiar voices into easy communication boards.
                </p>
            )}
        </div>
    );
}
