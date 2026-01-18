'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Image as ImageIcon, Check, Loader2, Mic, Upload, Music, Sparkles, Play, Pause, Volume2, Crop, Camera } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
const ImageCropModal = dynamic(() => import('./ImageCropModal'), {
    loading: () => null
});
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
    batchMode?: boolean;
}

export default function AddCardModal({ isOpen, onClose, onCardAdded, onCardUpdated, boardId, editCard, batchMode = false }: AddCardModalProps) {
    const [label, setLabel] = useState('');
    const [cardType, setCardType] = useState<'Thing' | 'Word'>('Thing');

    // Image State
    const [imageType, setImageType] = useState<'upload' | 'camera' | 'generate'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasCamera, setHasCamera] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Batch upload state
    const [batchImages, setBatchImages] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

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

    // Check for camera availability on mount
    useEffect(() => {
        const checkCamera = async () => {
            try {
                // Check if mediaDevices API is supported
                if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
                    // Try to enumerate devices to check for camera
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const hasVideoInput = devices.some(device => device.kind === 'videoinput');
                    setHasCamera(hasVideoInput);
                }
            } catch (error) {
                console.error('Error checking camera availability:', error);
                setHasCamera(false);
            }
        };

        checkCamera();
    }, []);

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

    // Stop camera when switching away from camera mode or closing modal
    useEffect(() => {
        if (imageType !== 'camera' || !isOpen) {
            stopCamera();
        }
    }, [imageType, isOpen]);

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
        setBatchImages([]);
        stopAudioPreview();
        stopCamera();
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer back camera on mobile
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsCameraActive(true);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('Could not access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;

            // Stop camera after capture
            stopCamera();

            // Convert blob to data URL for cropping
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setImageToCrop(dataUrl);
                setShowCropModal(true);
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.95);
    };

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (batchMode) {
            // Batch upload mode - handle multiple files
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                setBatchImages(files);
            }
        } else {
            // Single upload mode
            const file = e.target.files?.[0];
            if (file) {
                const url = URL.createObjectURL(file);
                setImageToCrop(url);
                setShowCropModal(true);
            }
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

    const uploadFile = async (file: Blob, filename: string, timeoutMs = 30000): Promise<string> => {
        const startTime = Date.now();
        const fileSize = (file.size / 1024).toFixed(2);
        console.log(`[Frontend-Upload] Starting upload: ${filename} (${fileSize}KB, type: ${file.type})`);

        const formData = new FormData();
        formData.append('file', file, filename);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const fetchStart = Date.now();
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const fetchTime = Date.now() - fetchStart;

            if (!res.ok) {
                console.error(`[Frontend-Upload] FAILED after ${fetchTime}ms: HTTP ${res.status}`);
                throw new Error('Upload failed');
            }

            const data = await res.json();
            const totalTime = Date.now() - startTime;
            console.log(`[Frontend-Upload] SUCCESS in ${totalTime}ms (fetch: ${fetchTime}ms)`);
            console.log(`[Frontend-Upload] URL: ${data.url}`);
            return data.url;
        } catch (error) {
            clearTimeout(timeoutId);
            const totalTime = Date.now() - startTime;

            if (error instanceof Error && error.name === 'AbortError') {
                console.error(`[Frontend-Upload] TIMEOUT after ${totalTime}ms`);
                throw new Error('Upload timeout - please try again with a smaller file');
            }

            console.error(`[Frontend-Upload] ERROR after ${totalTime}ms:`, error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Batch mode validation
        if (batchMode) {
            if (batchImages.length === 0) {
                toast.error('Please select at least one image');
                return;
            }

            setIsSubmitting(true);
            setUploadProgress({ current: 0, total: batchImages.length });

            try {
                const CONCURRENT_UPLOADS = 2; // Reduced from 8 for better reliability on free tier

                // Create chunks of uploads
                const chunks = [];
                for (let i = 0; i < batchImages.length; i += CONCURRENT_UPLOADS) {
                    chunks.push(batchImages.slice(i, i + CONCURRENT_UPLOADS));
                }

                let successCount = 0;
                let failCount = 0;
                let processedCount = 0;

                // Process each chunk sequentially, but uploads within chunk are parallel
                for (const chunk of chunks) {
                    const results = await Promise.allSettled(
                        chunk.map(async (imageFile) => {
                            try {
                                const imageUrl = await uploadFile(imageFile, imageFile.name);
                                return { imageUrl, fileName: imageFile.name };
                            } catch (error) {
                                console.error('Upload failed:', error);
                                return null;
                            }
                        })
                    );

                    // Update progress
                    processedCount += chunk.length;
                    setUploadProgress({ current: processedCount, total: batchImages.length });

                    // Create cards for successful uploads
                    const cardsToCreate = results
                        .filter(r => r.status === 'fulfilled' && r.value !== null)
                        .map(r => (r as PromiseFulfilledResult<{ imageUrl: string; fileName: string } | null>).value!)
                        .filter(v => v !== null);

                    // Batch insert the cards
                    if (cardsToCreate.length > 0) {
                        const res = await fetch('/api/cards/batch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                boardId,
                                cards: cardsToCreate.map(c => ({
                                    label: '', // Empty label - user will edit later
                                    imageUrl: c.imageUrl,
                                    audioUrl: '', // Empty audio - user will edit later
                                    color: '#6366f1',
                                    type: 'Thing'
                                }))
                            })
                        });

                        if (res.ok) {
                            const newCards = await res.json();
                            newCards.forEach((card: Card) => onCardAdded(card));
                            successCount += cardsToCreate.length;
                        } else {
                            failCount += cardsToCreate.length;
                        }
                    }

                    failCount += results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === null)).length;
                }

                if (successCount > 0) {
                    toast.success(`${successCount} card${successCount > 1 ? 's' : ''} created! Edit them to add labels and audio.`);
                }
                if (failCount > 0) {
                    toast.error(`${failCount} upload${failCount > 1 ? 's' : ''} failed`);
                }

                onClose();
                resetForm();
                setUploadProgress({ current: 0, total: 0 });
            } catch (error) {
                console.error(error);
                toast.error('Error creating cards');
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Regular mode validation
        const hasAudio = audioType === 'record' ? !!audioBlob : !!audioFile;
        const hasImage = !!imageFile || (editCard && !!imagePreview);
        const hasAudioOrExisting = hasAudio || (editCard && !audioBlob && !audioFile);

        if (!label || !hasImage || !hasAudioOrExisting) return;

        const operationStart = Date.now();
        const operationId = crypto.randomUUID().slice(0, 8);
        console.log(`[Frontend-CardOp-${operationId}] Starting ${editCard ? 'update' : 'create'} operation`);

        setIsSubmitting(true);
        try {
            // Upload Image and Audio in PARALLEL (not sequential)
            const uploadsStart = Date.now();
            console.log(`[Frontend-CardOp-${operationId}] Starting parallel uploads...`);

            const [imageUrl, audioUrl] = await Promise.all([
                // Image upload
                imageFile
                    ? uploadFile(imageFile, imageFile.name).then(url => {
                        console.log(`[Frontend-CardOp-${operationId}] Image upload completed`);
                        return url;
                    })
                    : Promise.resolve(editCard?.imageUrl || ''),

                // Audio upload
                (audioType === 'record' && audioBlob)
                    ? uploadFile(audioBlob, `audio-${Date.now()}.${audioBlob.type.includes('webm') ? 'webm' : 'wav'}`).then(url => {
                        console.log(`[Frontend-CardOp-${operationId}] Audio upload completed`);
                        return url;
                    })
                    : (audioType === 'upload' && audioFile)
                        ? uploadFile(audioFile, audioFile.name).then(url => {
                            console.log(`[Frontend-CardOp-${operationId}] Audio upload completed`);
                            return url;
                        })
                        : Promise.resolve(editCard?.audioUrl || '')
            ]);

            console.log(`[Frontend-CardOp-${operationId}] All uploads completed in ${Date.now() - uploadsStart}ms`);

            if (editCard) {
                // 3a. Update existing card
                console.log(`[Frontend-CardOp-${operationId}] Sending update request for card ${editCard.id}...`);
                const apiCallStart = Date.now();
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

                if (!res.ok) {
                    console.error(`[Frontend-CardOp-${operationId}] Update failed: HTTP ${res.status}`);
                    throw new Error('Failed to update card');
                }

                const updatedCard = await res.json();
                console.log(`[Frontend-CardOp-${operationId}] Card updated successfully in ${Date.now() - apiCallStart}ms`);
                onCardUpdated?.(updatedCard);
                toast.success('Card updated successfully!');
            } else {
                // 3b. Create new card
                console.log(`[Frontend-CardOp-${operationId}] Sending create request...`);
                const apiCallStart = Date.now();
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

                if (!res.ok) {
                    console.error(`[Frontend-CardOp-${operationId}] Create failed: HTTP ${res.status}`);
                    const errorText = await res.text();
                    console.error(`[Frontend-CardOp-${operationId}] Error response:`, errorText);
                    throw new Error('Failed to create card');
                }

                const newCard = await res.json();
                const apiCallTime = Date.now() - apiCallStart;
                const totalTime = Date.now() - operationStart;
                console.log(`[Frontend-CardOp-${operationId}] Card created successfully! API: ${apiCallTime}ms, Total: ${totalTime}ms`);
                onCardAdded(newCard);
                toast.success('Card created successfully!');
            }

            onClose();
            resetForm();
        } catch (error) {
            const totalTime = Date.now() - operationStart;
            console.error(`[Frontend-CardOp-${operationId}] FAILED after ${totalTime}ms:`, error);
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
                            {batchMode ? 'Batch Upload Cards' : editCard ? 'Edit Pic Speak' : 'New Pic Speak'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {batchMode ? (
                            <>
                                {/* Batch Upload Info */}
                                <div className="space-y-3">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                        <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Batch Upload Mode</h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Select multiple images to create cards quickly. All cards will be created with the title "New Card" and no audio. You can edit each card later to add custom titles and audio.
                                        </p>
                                    </div>
                                </div>

                                {/* Batch Image Upload */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Images
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-full min-h-48 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-gray-50 dark:bg-slate-800"
                                    >
                                        {batchImages.length > 0 ? (
                                            <div className="w-full p-4">
                                                <div className="text-center mb-4">
                                                    <ImageIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-primary">{batchImages.length} image{batchImages.length > 1 ? 's' : ''} selected</p>
                                                    <p className="text-xs text-gray-500 mt-1">Tap to change</p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                                    {batchImages.map((file, idx) => (
                                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={`Preview ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4">
                                                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Tap to select multiple images</p>
                                                <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple files</p>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>

                                {/* Progress Tracking */}
                                {uploadProgress.total > 0 && (
                                    <div className="space-y-2 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl p-4 border border-primary/20">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-200">Uploading images...</span>
                                            <span className="font-bold text-primary">{uploadProgress.current} / {uploadProgress.total}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                                            <div
                                                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300 ease-out shadow-lg"
                                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
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
                            </>
                        )}

                        {/* Image Upload - Only show in non-batch mode */}
                        {!batchMode && (
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
                                    {hasCamera && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageType('camera');
                                                startCamera();
                                            }}
                                            className={clsx(
                                                "px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1",
                                                imageType === 'camera'
                                                    ? "bg-white dark:bg-slate-700 shadow-sm text-primary"
                                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                            )}
                                        >
                                            <Camera className="w-4 h-4" />
                                            Camera
                                        </button>
                                    )}
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
                            ) : imageType === 'camera' ? (
                                <div className="space-y-3">
                                    <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-black">
                                        {isCameraActive ? (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={capturePhoto}
                                                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-4 border-gray-300"
                                                >
                                                    <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-400"></div>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-white">
                                                <Camera className="w-16 h-16 mb-4 opacity-50" />
                                                <p className="text-sm opacity-75">Camera initializing...</p>
                                            </div>
                                        )}
                                    </div>
                                    {imagePreview && (
                                        <div className="w-full h-48 rounded-2xl overflow-hidden border-2 border-primary">
                                            <img src={imagePreview} alt="Captured" className="w-full h-full object-contain bg-gray-50 dark:bg-slate-800" />
                                        </div>
                                    )}
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
                        )}

                        {/* Audio Input Section - Only show in non-batch mode */}
                        {!batchMode && (
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
                        )}

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
                                disabled={batchMode ? (isSubmitting || batchImages.length === 0) : (isSubmitting || !label || (!imageFile && !editCard) || (!editCard && (audioType === 'record' ? !audioBlob : !audioFile)))}
                                className={clsx(
                                    "px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2",
                                    (batchMode ? (isSubmitting || batchImages.length === 0) : (isSubmitting || !label || (!imageFile && !editCard) || (!editCard && (audioType === 'record' ? !audioBlob : !audioFile))))
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-primary to-accent hover:shadow-primary/25"
                                )}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                                {batchMode ? `Create ${batchImages.length} Card${batchImages.length !== 1 ? 's' : ''}` : editCard ? 'Update Card' : 'Save Card'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
