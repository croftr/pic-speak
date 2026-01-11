'use client';

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { highContrastMode, toggleHighContrast, cardSize, setCardSize } = useSettings();

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Settings"
            >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative" style={{ margin: 'auto' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                                aria-label="Close settings"
                                type="button"
                            >
                                <X className="w-6 h-6 text-gray-900 dark:text-white stroke-2" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* High Contrast Mode */}
                            <div>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <h3 className="font-bold text-lg">High Contrast Mode</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Increases contrast for better visibility
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={highContrastMode}
                                            onChange={toggleHighContrast}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 peer-checked:bg-primary rounded-full peer transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                                    </div>
                                </label>
                            </div>

                            {/* Card Size */}
                            <div>
                                <h3 className="font-bold text-lg mb-3">Card Size</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['small', 'medium', 'large'] as const).map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setCardSize(size)}
                                            className={`py-3 px-4 rounded-xl font-bold transition-all ${
                                                cardSize === size
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Adjust the size of picture cards
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
