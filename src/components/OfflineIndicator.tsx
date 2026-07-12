'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

function subscribe(callback: () => void) {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    };
}

/**
 * Small passive pill shown while the device is offline, so users know the
 * boards they're seeing come from the offline cache — plus a brief "Back
 * online" confirmation when the connection returns.
 *
 * Deliberately non-interactive (pointer-events-none) so it never steals a
 * tap from a card underneath, including in locked kiosk mode.
 */
export default function OfflineIndicator() {
    // Server snapshot says online so nothing flashes during hydration
    const isOnline = useSyncExternalStore(
        subscribe,
        () => navigator.onLine,
        () => true
    );
    const wasOffline = useRef(false);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            wasOffline.current = true;
            return;
        }
        if (wasOffline.current) {
            wasOffline.current = false;
            setShowReconnected(true);
            const timer = setTimeout(() => setShowReconnected(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    if (isOnline && !showReconnected) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed left-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
            {!isOnline ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 dark:bg-slate-700/90 text-white text-xs font-bold shadow-lg backdrop-blur-sm">
                    <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                    Offline — using saved boards
                </span>
            ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-bold shadow-lg backdrop-blur-sm">
                    <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                    Back online
                </span>
            )}
        </div>
    );
}
