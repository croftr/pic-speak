'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const STORAGE_KEY = 'mvb:was-signed-in';

/**
 * Auth signal that survives being offline.
 *
 * Clerk needs its API to establish a session, so with no connection it either
 * never loads or reports signed-out — which would hide every "My Boards" link
 * and lock users out of boards that are already cached on the device. The
 * cached pages were server-rendered for the signed-in user and display fine
 * without live auth; only the navigation needs an auth signal.
 *
 * So: remember "this device had a signed-in user" in localStorage, and while
 * offline treat that memory as signed-in FOR NAVIGATION PURPOSES ONLY. The
 * memory is cleared whenever Clerk definitively reports signed-out while
 * online (real sign-out or expired session).
 */
export function useOfflineAuth(): { isSignedIn: boolean } {
    const { isLoaded, isSignedIn } = useAuth();
    const [rememberedOffline, setRememberedOffline] = useState(false);

    useEffect(() => {
        const evaluate = () => {
            if (isLoaded && isSignedIn) {
                localStorage.setItem(STORAGE_KEY, '1');
                setRememberedOffline(false);
                return;
            }
            if (isLoaded && !isSignedIn && navigator.onLine) {
                // Definitive signed-out while online — forget.
                localStorage.removeItem(STORAGE_KEY);
                setRememberedOffline(false);
                return;
            }
            // Clerk unavailable or unable to confirm the session (offline).
            setRememberedOffline(
                !navigator.onLine && localStorage.getItem(STORAGE_KEY) === '1'
            );
        };

        evaluate();
        window.addEventListener('online', evaluate);
        window.addEventListener('offline', evaluate);
        return () => {
            window.removeEventListener('online', evaluate);
            window.removeEventListener('offline', evaluate);
        };
    }, [isLoaded, isSignedIn]);

    return { isSignedIn: !!isSignedIn || rememberedOffline };
}
