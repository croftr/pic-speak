'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Board, Card } from '@/types';
import { ArrowLeft, Printer } from 'lucide-react';
import { clsx } from 'clsx';

interface PrintBoardClientProps {
    board: Board;
    cards: Card[];
}

// Physical card sizes when printed. Sized so common laminating pouches and
// PECS-style books fit: small ~4cm, medium ~5cm (2in), large ~7cm.
const CARD_SIZES = {
    small: { label: 'Small (4 cm)', width: '4cm', image: '3cm', font: '9pt' },
    medium: { label: 'Medium (5 cm)', width: '5cm', image: '3.8cm', font: '11pt' },
    large: { label: 'Large (7 cm)', width: '7cm', image: '5.5cm', font: '14pt' },
} as const;

type PrintSize = keyof typeof CARD_SIZES;

export default function PrintBoardClient({ board, cards }: PrintBoardClientProps) {
    const [size, setSize] = useState<PrintSize>('medium');
    const [showLabels, setShowLabels] = useState(true);

    // "Save as PDF" defaults its file name to the document title, so use the
    // plain board name while this page is open (also covers Ctrl+P)
    useEffect(() => {
        const previousTitle = document.title;
        document.title = board.name;
        return () => {
            document.title = previousTitle;
        };
    }, [board.name]);

    const dims = CARD_SIZES[size];

    return (
        <main className="min-h-screen p-3 sm:p-6">
            {/* When printing, show only the card sheet — hides app chrome (header,
                bottom nav) without needing changes to the global layout */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        box-shadow: none;
                        border: none;
                    }
                }
                @page { margin: 1cm; }
            `}</style>

            <div className="max-w-4xl mx-auto space-y-4">
                {/* Screen-only toolbar */}
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <Link
                        href={`/board/${board.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-manipulation"
                        title="Back to board"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </Link>
                    <h1 className="text-lg sm:text-xl font-display font-bold text-gray-900 dark:text-white flex-1 min-w-0 truncate">
                        Print {board.name}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Card size
                        <select
                            value={size}
                            onChange={(e) => setSize(e.target.value as PrintSize)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            {Object.entries(CARD_SIZES).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showLabels}
                            onChange={(e) => setShowLabels(e.target.checked)}
                            className="w-4 h-4 rounded accent-primary"
                        />
                        Show card names
                    </label>

                    <button
                        onClick={() => window.print()}
                        className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors touch-manipulation"
                    >
                        <Printer className="w-5 h-5" />
                        Print / Save as PDF
                    </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 print:hidden">
                    Cut along the dashed lines. Laminating the cards makes them last much longer.
                </p>

                {/* Printable sheet — always rendered as white paper, even in dark mode */}
                <div
                    id="print-area"
                    className="bg-white rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
                >
                    <div className="mb-4">
                        <h2 className="text-black font-bold" style={{ fontSize: '14pt' }}>{board.name}</h2>
                        {board.description && (
                            <p className="text-gray-600" style={{ fontSize: '10pt' }}>{board.description}</p>
                        )}
                    </div>

                    {cards.length === 0 ? (
                        <p className="text-gray-500 py-8 text-center">This board has no cards to print yet.</p>
                    ) : (
                        <div className="flex flex-wrap" style={{ gap: '0.4cm' }}>
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className="border border-dashed border-gray-400 flex flex-col items-center"
                                    style={{
                                        width: dims.width,
                                        padding: '0.2cm',
                                        breakInside: 'avoid',
                                        backgroundColor: '#ffffff',
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={card.imageUrl}
                                        alt={card.label}
                                        loading="eager"
                                        className="object-cover rounded"
                                        style={{ width: dims.image, height: dims.image }}
                                    />
                                    {showLabels && (
                                        <span
                                            className={clsx(
                                                'block w-full text-center font-bold text-black leading-tight break-words',
                                            )}
                                            style={{ fontSize: dims.font, paddingTop: '0.1cm' }}
                                        >
                                            {card.label}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
