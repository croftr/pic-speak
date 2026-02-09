'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useSyncExternalStore } from 'react';

const clerkAppearance = {
    layout: {
        logoImageUrl: '/logo.svg',
        socialButtonsVariant: 'iconButton' as const,
    },
    variables: {
        colorPrimary: '#7c3aed',
        colorTextOnPrimaryBackground: '#ffffff',
        borderRadius: '0.75rem',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    },
    elements: {
        card: 'shadow-xl',
        formButtonPrimary: 'font-semibold rounded-xl shadow-md',
        footerActionLink: 'font-medium',
        socialButtonsBlockButton: 'rounded-xl',
        formFieldInput: 'rounded-xl',
    },
};

function subscribeToDarkMode(callback: () => void) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
}

function getIsDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerIsDark() {
    return false;
}

export default function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
    const isDark = useSyncExternalStore(subscribeToDarkMode, getIsDark, getServerIsDark);

    return (
        <ClerkProvider
            appearance={{
                ...clerkAppearance,
                baseTheme: isDark ? dark : undefined,
                variables: {
                    ...clerkAppearance.variables,
                    colorBackground: isDark ? '#1e293b' : '#ffffff',
                    colorInputBackground: isDark ? '#0f172a' : '#f8fafc',
                    colorInputText: isDark ? '#f8fafc' : '#1e293b',
                },
            }}
        >
            {children}
        </ClerkProvider>
    );
}
