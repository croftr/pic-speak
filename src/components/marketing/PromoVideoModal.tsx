'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { PROMO_VIDEO } from '@/config/promo';

interface PromoVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PromoVideoModal({ isOpen, onClose }: PromoVideoModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';

            // Attempt autoplay when modal opens
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {
                        // Browser autoplay policy might need explicit user interaction
                    });
                }
            }, 150);
        } else {
            if (videoRef.current) {
                videoRef.current.pause();
            }
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="My Voice Board Promo Video"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-4xl bg-slate-950 rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                {/* Header bar */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/80 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                        <h3 className="text-sm sm:text-base font-bold text-white">
                            My Voice Board — Product Tour (90 sec)
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close video"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Video Container */}
                <div className="relative aspect-video bg-black">
                    <video
                        ref={videoRef}
                        src={PROMO_VIDEO.videoUrl}
                        poster={PROMO_VIDEO.posterUrl}
                        controls={!hasError}
                        playsInline
                        preload="auto"
                        onError={() => setHasError(true)}
                        className="w-full h-full object-contain"
                    >
                        Your browser does not support the video tag.
                    </video>

                    {/* Error overlay */}
                    {hasError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
                            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl mb-3">
                                <AlertCircle size={32} />
                            </div>
                            <h4 className="text-lg font-bold mb-1">Video Stream Unavailable</h4>
                            <p className="text-sm text-slate-300 max-w-md mb-4">
                                The video could not be loaded from S3. Please verify that public read permissions or a bucket policy are configured on the bucket.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setHasError(false);
                                    if (videoRef.current) {
                                        videoRef.current.load();
                                        videoRef.current.play().catch(() => {});
                                    }
                                }}
                                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
