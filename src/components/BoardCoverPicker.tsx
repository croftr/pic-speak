'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, Upload, Sparkles, Loader2, Layers } from 'lucide-react';
import { Card } from '@/types';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/upload-client';

const ImageCropModal = dynamic(() => import('./ImageCropModal'), {
    loading: () => null
});

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

// Covers render as landscape tile banners, so lock the crop to 4:3
const COVER_ASPECT = 4 / 3;

interface BoardCoverPickerProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called with the final image URL (already uploaded when needed) */
    onSelected: (url: string) => void;
    /** When provided (edit mode), shows a "From this board" section of card images */
    boardCards?: Card[];
}

export default function BoardCoverPicker({ isOpen, onClose, onSelected, boardCards }: BoardCoverPickerProps) {
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Unique, non-empty card images for the "From this board" grid
    const cardImages = useMemo(() => {
        const seen = new Set<string>();
        const images: { url: string; label: string }[] = [];
        for (const card of boardCards || []) {
            if (card.imageUrl && !seen.has(card.imageUrl)) {
                seen.add(card.imageUrl);
                images.push({ url: card.imageUrl, label: card.label });
            }
        }
        return images;
    }, [boardCards]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setImageToCrop(URL.createObjectURL(file));
    };

    const handleGenerateImage = async () => {
        if (!generationPrompt.trim()) return;

        setIsGenerating(true);
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: generationPrompt })
            });

            if (!res.ok) throw new Error('Generation failed');

            const data = await res.json();
            setImageToCrop(data.image); // data:image/...;base64,...
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setImageToCrop(null);
        setIsUploading(true);
        try {
            const url = await uploadFile(croppedBlob, 'board-cover.jpg');
            onSelected(url);
        } catch (error) {
            console.error('Cover upload failed:', error);
            toast.error('Failed to upload cover image. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCropCancel = () => {
        setImageToCrop(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between rounded-t-3xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose a Cover Image</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {isUploading || isGenerating ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-gray-500 font-medium">
                                    {isGenerating ? 'Creating your image...' : 'Uploading cover...'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Upload / AI Generate */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-primary">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <span className="font-bold text-gray-700 dark:text-gray-200">Upload Photo</span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </button>

                                    {!showGenerateForm ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowGenerateForm(true)}
                                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-purple-500">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-bold text-gray-700 dark:text-gray-200">AI Generate</span>
                                                <span className="text-xs text-purple-500 font-medium">Magic</span>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-100 dark:border-purple-800">
                                            <textarea
                                                value={generationPrompt}
                                                onChange={(e) => setGenerationPrompt(e.target.value)}
                                                placeholder="Describe the cover..."
                                                className="w-full flex-1 min-h-[60px] p-2 bg-white dark:bg-slate-900 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGenerateImage}
                                                disabled={!generationPrompt.trim()}
                                                className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                Create
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* From this board's cards */}
                                {cardImages.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 pt-2">
                                            <Layers className="w-4 h-4 text-blue-500" />
                                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">From this board&apos;s cards</span>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {cardImages.map(({ url, label }) => (
                                                <button
                                                    key={url}
                                                    type="button"
                                                    onClick={() => onSelected(url)}
                                                    title={label}
                                                    className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-lg transition-all"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={url}
                                                        alt={label}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Crop modal renders at z-[60], above this picker */}
            {imageToCrop && (
                <ImageCropModal
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    initialAspect={COVER_ASPECT}
                    showAspectToggle={false}
                />
            )}
        </>
    );
}
