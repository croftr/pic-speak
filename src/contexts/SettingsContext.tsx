'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
    highContrastMode: boolean;
    toggleHighContrast: () => void;
    cardSize: 'small' | 'medium' | 'large';
    setCardSize: (size: 'small' | 'medium' | 'large') => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [highContrastMode, setHighContrastMode] = useState(false);
    const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedHighContrast = localStorage.getItem('highContrastMode') === 'true';
        const savedCardSize = localStorage.getItem('cardSize') as 'small' | 'medium' | 'large' | null;

        setHighContrastMode(savedHighContrast);
        if (savedCardSize) {
            setCardSize(savedCardSize);
        }
    }, []);

    // Apply high contrast class to document
    useEffect(() => {
        if (highContrastMode) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }, [highContrastMode]);

    const toggleHighContrast = () => {
        const newValue = !highContrastMode;
        setHighContrastMode(newValue);
        localStorage.setItem('highContrastMode', String(newValue));
    };

    const updateCardSize = (size: 'small' | 'medium' | 'large') => {
        setCardSize(size);
        localStorage.setItem('cardSize', size);
    };

    return (
        <SettingsContext.Provider
            value={{
                highContrastMode,
                toggleHighContrast,
                cardSize,
                setCardSize: updateCardSize
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
}
