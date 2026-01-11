'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Check, Loader2, Mic, Upload, Music, Sparkles, Play, Pause, Volume2, Crop } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import ImageCropModal from './ImageCropModal';
import { clsx } from 'clsx';
import { Card } from '@/types';
import { toast } from 'sonner';

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCardAdded: (card: Card) => void;
    onCardUpdated?: (card: Card) => void;
    boardId: string;
    editCard?: Card | null;
}

export default function AddCardModal({ isOpen, onClose, onCardAdded, onCardUpdated, boardId, editCard }: AddCardModalProps) {
    const [label, setLabel] = useState('');
    const [cardType, setCardType] = useState<'Thing' | 'Word'>('Thing');

    // Image State
    const [imageType, setImageType] = useState<'upload' | 'generate'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Crop state
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    // Audio State
    const [audioType, setAudioType] = useState<'record' | 'upload'>('record');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);

    // Audio preview state
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    const stopAudioPreview = () => {
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current.currentTime = 0;
            audioPreviewRef.current = null;
        }
        setIsPlayingPreview(false);
    };

    // Populate form when editing
    useEffect(() => {
        if (editCard && isOpen) {
            setLabel(editCard.label);
            setCardType(editCard.type || 'Thing');
            setImagePreview(editCard.imageUrl);
            // Mark that we already have image/audio (existing URLs)
        } else if (!isOpen) {
            // Reset form when modal closes
            resetForm();
        }
    }, [editCard, isOpen]);

    const resetForm = () => {
        setLabel('');
        setImageFile(null);
        setImagePreview(null);
        setGenerationPrompt('');
        setImageType('upload');
        setAudioBlob(null);
        setAudioFile(null);
        setAudioType('record');
        setCardType('Thing');
        stopAudioPreview();
    };

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageToCrop(url);
            setShowCropModal(true);
        }
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
        setImageFile(croppedFile);
        const url = URL.createObjectURL(croppedBlob);
        setImagePreview(url);
        setShowCropModal(false);
        setImageToCrop(null);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setImageToCrop(null);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            // Stop any playing preview
            stopAudioPreview();
        }
    };

    const toggleAudioPreview = () => {
        const audioSource = audioBlob || audioFile;
        if (!audioSource) return;

        if (isPlayingPreview && audioPreviewRef.current) {
            stopAudioPreview();
            return;
        }

        const audioUrl = URL.createObjectURL(audioSource);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
            setIsPlayingPreview(false);
            audioPreviewRef.current = null;
        };

        audio.onerror = () => {
            toast.error('Failed to play audio');
            setIsPlayingPreview(false);
            audioPreviewRef.current = null;
        };

        audioPreviewRef.current = audio;
        setIsPlayingPreview(true);
        audio.play().catch(err => {
            console.error('Audio playback failed:', err);
            toast.error('Failed to play audio');
            setIsPlayingPreview(false);
        });
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
            const imageUrl = data.image; // data:image/png;base64,...

            // Open crop modal for generated image
            setImageToCrop(imageUrl);
            setShowCropModal(true);
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const uploadFile = async (file: Blob, filename: string): Promise<string> => {
        const formData = new FormData();
        const fileToUpload = new File([file], filename, { type: file.type });
        formData.append('file', fileToUpload);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check validation - for edit mode, we can keep existing image/audio
        const hasAudio = audioType === 'record' ? !!audioBlob : !!audioFile;
        const hasImage = !!imageFile || (editCard && !!imagePreview);
        const hasAudioOrExisting = hasAudio || (editCard && !audioBlob && !audioFile);

        if (!label || !hasImage || !hasAudioOrExisting) return;

        setIsSubmitting(true);
        try {
            // 1. Upload Image (only if new file selected)
            let imageUrl = editCard?.imageUrl || '';
            if (imageFile) {
                imageUrl = await uploadFile(imageFile, imageFile.name);
            }

            // 2. Upload Audio (only if new audio provided)
            let audioUrl = editCard?.audioUrl || '';
            if (audioType === 'record' && audioBlob) {
                const audioExtension = audioBlob.type.includes('webm') ? 'webm' : 'wav';
                audioUrl = await uploadFile(audioBlob, `audio-${Date.now()}.${audioExtension}`);
            } else if (audioType === 'upload' && audioFile) {
                audioUrl = await uploadFile(audioFile, audioFile.name);
            }

            if (editCard) {
                // 3a. Update existing card
                const res = await fetch(`/api/cards/${editCard.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        label,
                        imageUrl,
                        audioUrl,
                        color: editCard.color || '#6366f1',
                        type: cardType
                    })
                });

                if (!res.ok) throw new Error('Failed to update card');

                const updatedCard = await res.json();
                onCardUpdated?.(updatedCard);
                toast.success('Card updated successfully!');
            } else {
                // 3b. Create new card
                const res = await fetch('/api/cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        label,
                        imageUrl,
                        audioUrl,
                        boardId,
                        color: '#6366f1',
                        type: cardType
                    })
                });

                if (!res.ok) throw new Error('Failed to create card');

                const newCard = await res.json();
                onCardAdded(newCard);
                toast.success('Card created successfully!');
            }

            onClose();
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error(editCard ? 'Error updating card' : 'Error creating card');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {showCropModal && imageToCrop && (
                <ImageCropModal
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden glass-card max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {editCard ? 'Edit Pic Speak' : 'New Pic Speak'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Label Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                What does it say?
                            </label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g., Apple, Hungry, Yes"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-lg"
                                required
                            />
                        </div>

                        {/* Card Type Selector */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Card Type
                            </label>
                            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCardType('Thing')}
                                    className={clsx(
                                        "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all transform active:scale-95",
                                        cardType === 'Thing'
                                            ? "bg-white dark:bg-slate-700 shadow-md text-primary"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    Thing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCardType('Word')}
                                    className={clsx(
                                        "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all transform active:scale-95",
                                        cardType === 'Word'
                                            ? "bg-white dark:bg-slate-700 shadow-md text-primary"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    Word
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 px-1">
                                {cardType === 'Thing'
                                    ? "Represent objects, people, or actions with pictures."
                                    : "Represent abstract concepts or conjunctions."}
                            </p>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Picture
                                </label>

                                {/* Image Toggle Switch */}
                                <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => setImageType('upload')}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-sm font-medium transition-all",
                                            imageType === 'upload'
                                                ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        Upload
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageType('generate')}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-sm font-medium transition-all",
                                            imageType === 'generate'
                                                ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        Generate AI
                                    </button>
                                </div>
                            </div>

                            {imageType === 'upload' ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={clsx(
                                        "relative w-full h-48 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-gray-50 dark:bg-slate-800",
                                        imagePreview ? "border-solid border-primary" : ""
                                    )}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Tap to upload image</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={generationPrompt}
                                            onChange={(e) => setGenerationPrompt(e.target.value)}
                                            placeholder="Describe image (e.g. 'cartoon red apple')"
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGenerateImage}
                                            disabled={isGenerating || !generationPrompt.trim()}
                                            className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                        >
                                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="relative w-full h-48 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-slate-800">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Generated Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center p-4 text-gray-400">
                                                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">Preview will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audio Input Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Sound
                                </label>

                                {/* Toggle Switch */}
                                <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => setAudioType('record')}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-sm font-medium transition-all",
                                            audioType === 'record'
                                                ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        Record
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAudioType('upload')}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-sm font-medium transition-all",
                                            audioType === 'upload'
                                                ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        Upload
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 transition-all">
                                {audioType === 'record' ? (
                                    <AudioRecorder onRecordingComplete={setAudioBlob} />
                                ) : (
                                    <div
                                        onClick={() => audioInputRef.current?.click()}
                                        className={clsx(
                                            "w-full h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-white dark:bg-slate-900",
                                            audioFile ? "border-solid border-primary/50 bg-primary/5" : ""
                                        )}
                                    >
                                        {audioFile ? (
                                            <div className="text-center p-4 animate-in fade-in zoom-in">
                                                <Music className="w-8 h-8 text-primary mx-auto mb-2" />
                                                <p className="text-sm font-medium text-primary">{audioFile.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">Tap to change</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4">
                                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Tap to upload audio file</p>
                                                <p className="text-xs text-gray-400 mt-1">MP3, WAV, etc</p>
                                            </div>
                                        )}
                                        <input
                                            ref={audioInputRef}
                                            type="file"
                                            accept="audio/*"
                                            className="hidden"
                                            onChange={handleAudioFileChange}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Audio Preview Button */}
                            {(audioBlob || audioFile) && (
                                <button
                                    type="button"
                                    onClick={toggleAudioPreview}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl font-bold hover:opacity-90 transition-all transform hover:scale-[1.02]"
                                >
                                    {isPlayingPreview ? (
                                        <>
                                            <Pause className="w-5 h-5" />
                                            Pause Preview
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5" />
                                            Preview Audio
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !label || (!imageFile && !editCard) || (!editCard && (audioType === 'record' ? !audioBlob : !audioFile))}
                                className={clsx(
                                    "px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2",
                                    (isSubmitting || !label || (!imageFile && !editCard) || (!editCard && (audioType === 'record' ? !audioBlob : !audioFile)))
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-primary to-accent hover:shadow-primary/25"
                                )}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                                {editCard ? 'Update Card' : 'Save Card'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
