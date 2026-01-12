'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RefreshCw, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    className?: string;
}

export default function AudioRecorder({ onRecordingComplete, className }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                onRecordingComplete(blob);

                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast.error('Could not access microphone. Please allow microphone permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const playRecording = () => {
        if (audioURL) {
            const audio = new Audio(audioURL);
            audio.play();
        }
    };

    const resetRecording = () => {
        setAudioURL(null);
        setIsRecording(false);
    };

    useEffect(() => {
        return () => {
            // Cleanup object URL
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
        };
    }, [audioURL]);

    return (
        <div className={twMerge("flex flex-col items-center gap-4", className)}>
            {!audioURL ? (
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={clsx(
                        "p-4 rounded-full transition-all duration-300 shadow-lg",
                        isRecording
                            ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200"
                            : "bg-primary hover:bg-primary/90 text-white"
                    )}
                >
                    {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6" />}
                </button>
            ) : (
                <div className="flex items-center gap-3 bg-muted p-2 rounded-xl animate-in fade-in slide-in-from-bottom-2">
                    <button
                        type="button"
                        onClick={playRecording}
                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors shadow-md"
                    >
                        <Play className="w-5 h-5 fill-current" />
                    </button>

                    <button
                        type="button"
                        onClick={resetRecording}
                        className="p-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full transition-colors"
                        title="Retake"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            )}

            <p className="text-xs text-muted-foreground font-medium">
                {isRecording ? "Recording..." : audioURL ? "Recording captured!" : "Tap to record sound"}
            </p>
        </div>
    );
}
