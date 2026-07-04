'use client';

import { useState } from 'react';

interface UnlockQuizDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlock: () => void;
}

const MAX_WRONG_ATTEMPTS = 3;

function generateQuestion() {
    const a = Math.floor(Math.random() * 7) + 3; // 3-9
    const b = Math.floor(Math.random() * 7) + 3; // 3-9
    const answer = a + b;

    const decoys = new Set<number>();
    while (decoys.size < 2) {
        const offset = Math.floor(Math.random() * 7) - 3; // -3..3
        const candidate = answer + offset;
        if (candidate >= 0 && candidate !== answer) {
            decoys.add(candidate);
        }
    }

    const options = [answer, ...decoys].sort(() => Math.random() - 0.5);
    return { a, b, answer, options };
}

// Remounted via `key` each time the dialog opens (see HoldToUnlockButton), so
// state can be initialized fresh here rather than reset from an effect.
export default function UnlockQuizDialog({ isOpen, onClose, onUnlock }: UnlockQuizDialogProps) {
    const [question, setQuestion] = useState(generateQuestion);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [isShaking, setIsShaking] = useState(false);

    if (!isOpen) return null;

    const handleAnswer = (value: number) => {
        if (value === question.answer) {
            onUnlock();
            return;
        }

        const nextWrong = wrongAttempts + 1;
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);

        if (nextWrong >= MAX_WRONG_ATTEMPTS) {
            onClose();
            return;
        }

        setWrongAttempts(nextWrong);
        setQuestion(generateQuestion());
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />

            <div
                className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 ${isShaking ? 'animate-shake' : ''}`}
            >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
                    Carer check
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                    Answer to unlock the board
                </p>

                <p data-testid="quiz-question" className="text-3xl font-black text-center text-gray-900 dark:text-white mb-6">
                    {question.a} + {question.b}
                </p>

                <div className="grid grid-cols-3 gap-3">
                    {question.options.map((option, i) => (
                        <button
                            key={i}
                            data-testid="quiz-option"
                            onClick={() => handleAnswer(option)}
                            className="py-4 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-gray-900 dark:text-white text-xl font-bold transition-colors touch-manipulation"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
