'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { X, Image as ImageIcon, Check, Loader2, Mic, Upload, Music, Sparkles, Play, Pause, Camera, ChevronRight, ChevronLeft, Globe } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
const ImageCropModal = dynamic(() => import('./ImageCropModal'), {
    loading: () => null
});
const PublicCardPickerModal = dynamic(() => import('./PublicCardPickerModal'), {
    loading: () => null
});
import { clsx } from 'clsx';
import { Card } from '@/types';
import { toast } from 'sonner';
import { PREDEFINED_CATEGORIES } from '@/lib/categories';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCardAdded: (card: Card) => void;
    onCardUpdated?: (card: Card) => void;
    boardId: string;
    editCard?: Card | null;
    batchMode?: boolean;
}

export default function AddCardModal({ isOpen, onClose, onCardAdded, onCardUpdated, boardId, editCard, batchMode = false, existingCategories = [], existingCardLabels = [] }: AddCardModalProps & { existingCategories?: string[]; existingCardLabels?: string[] }) {
    const [label, setLabel] = useState('');
    const [category, setCategory] = useState('');

    // Duplicate label detection
    const existingLabelsSet = useMemo(
        () => new Set(existingCardLabels.map(l => l.trim().toLowerCase())),
        [existingCardLabels]
    );
    const isLabelDuplicate = label.trim().toLowerCase() !== '' &&
        existingLabelsSet.has(label.trim().toLowerCase()) &&
        // Allow if editing and label hasn't changed
        !(editCard && editCard.label.trim().toLowerCase() === label.trim().toLowerCase());

    // Image State
    const [imageType, setImageType] = useState<'upload' | 'camera' | 'generate'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Public card picker state
    const [showPublicCardPicker, setShowPublicCardPicker] = useState(false);

    // Audio State
    const [audioType, setAudioType] = useState<'record' | 'upload' | 'generate'>('record');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null); // URL from TTS API (already uploaded)
    const [wantsNewAudio, setWantsNewAudio] = useState(false); // User wants to replace existing audio

    // Audio preview state
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    // Stepper State
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track recent step transitions to prevent accidental form submission
    const justTransitionedRef = useRef(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

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

    // Camera control functions
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    const startCamera = useCallback(async () => {
        // Prevent multiple simultaneous starts
        if (streamRef.current) {
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                // Set active state
                setIsCameraActive(true);

                // Try to play the video explicitly (in case autoplay fails)
                try {
                    await videoRef.current.play();
                } catch {
                    // Autoplay might be blocked, but video will play when user interacts
                }
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('Could not access camera. Please check permissions.');
            setImageType('upload'); // Fall back to upload mode
        }
    }, []);

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

    // Reset form function
    const resetForm = useCallback(() => {
        setLabel('');
        setImageFile(null);
        setImagePreview(null);
        setGenerationPrompt('');
        setImageType('upload');
        setAudioBlob(null);
        setAudioFile(null);
        setAudioType('record');
        setGeneratedAudioUrl(null);
        setWantsNewAudio(false);
        setCategory('');
        setBatchImages([]);
        setStep(1);
        justTransitionedRef.current = false;
        setIsTransitioning(false);
        stopAudioPreview();
        stopCamera();
    }, [stopCamera]);


    // Populate form when editing
    useEffect(() => {
        if (editCard && isOpen) {
            setLabel(editCard.label);
            setCategory(editCard.category || '');
            setImagePreview(editCard.imageUrl);
            // Mark that we already have image/audio (existing URLs)
        } else if (!isOpen) {
            // Reset form when modal closes
            resetForm();
        }
    }, [editCard, isOpen, resetForm]);

    // Handle camera lifecycle - start when entering camera mode, stop when leaving
    useEffect(() => {
        if (imageType === 'camera' && isOpen && !isCameraActive) {
            // Wait a tick for the video element to be mounted before starting camera
            const timeoutId = setTimeout(() => {
                if (videoRef.current) {
                    startCamera();
                }
            }, 50);
            return () => clearTimeout(timeoutId);
        } else if (imageType !== 'camera' || !isOpen) {
            // Stop camera when switching away or closing modal
            stopCamera();
        }
    }, [imageType, isOpen, isCameraActive, startCamera, stopCamera]);

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

            // Switch back to upload mode so camera view is hidden
            setImageType('upload');

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

            // Filter out large files
            const validFiles: File[] = [];
            let skippedCount = 0;

            files.forEach(file => {
                if (file.size > MAX_FILE_SIZE) {
                    skippedCount++;
                } else {
                    validFiles.push(file);
                }
            });

            if (skippedCount > 0) {
                toast.warning(`Skipped ${skippedCount} file(s) larger than ${MAX_FILE_SIZE_MB}MB`);
            }

            if (validFiles.length > 0) {
                setBatchImages(validFiles);
            }
        } else {
            // Single upload mode
            const file = e.target.files?.[0];
            if (file) {
                if (file.size > MAX_FILE_SIZE) {
                    toast.error(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

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
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`Audio file must be smaller than ${MAX_FILE_SIZE_MB}MB`);
                if (audioInputRef.current) audioInputRef.current.value = '';
                return;
            }
            setAudioFile(file);
            // Stop any playing preview
            stopAudioPreview();
        }
    };

    const toggleAudioPreview = () => {
        if (isPlayingPreview && audioPreviewRef.current) {
            stopAudioPreview();
            return;
        }

        // Determine audio source: local blob/file, generated URL, or existing card URL
        let audioUrl: string | null = null;
        if (audioBlob) {
            audioUrl = URL.createObjectURL(audioBlob);
        } else if (audioFile) {
            audioUrl = URL.createObjectURL(audioFile);
        } else if (generatedAudioUrl) {
            audioUrl = generatedAudioUrl;
        } else if (editCard?.audioUrl) {
            audioUrl = editCard.audioUrl;
        }

        if (!audioUrl) return;

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

    const handleGenerateAudio = async () => {
        if (!label.trim()) {
            toast.error('Please enter a label first');
            return;
        }

        setIsGeneratingAudio(true);
        stopAudioPreview();

        try {
            const res = await fetch('/api/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: label.trim(),
                    languageCode: 'en-US'
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Generation failed');
            }

            const data = await res.json();

            // Store the URL (already uploaded to Vercel Blob by the API)
            setGeneratedAudioUrl(data.url);

            // Fetch the audio URL and convert to blob for preview consistency
            const audioResponse = await fetch(data.url);
            const blob = await audioResponse.blob();

            setAudioBlob(blob);
            setAudioType('generate');
            toast.success('Audio generated!');

            // Auto-play the generated audio so user hears it immediately
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsPlayingPreview(false);
                audioPreviewRef.current = null;
            };

            audio.onerror = () => {
                // Silent fail for auto-play - user can still manually play
                setIsPlayingPreview(false);
                audioPreviewRef.current = null;
            };

            audioPreviewRef.current = audio;
            setIsPlayingPreview(true);
            audio.play().catch(() => {
                // Auto-play may be blocked by browser, that's OK
                setIsPlayingPreview(false);
            });
        } catch (error) {
            console.error('TTS Error:', error);
            const message = error instanceof Error ? error.message : 'Failed to generate audio';
            toast.error(message === 'TTS service not configured'
                ? 'Text-to-speech is not available. Please record audio instead.'
                : 'Failed to generate audio. Please try recording instead.');
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    // Compress an image client-side using canvas before uploading.
    // This avoids sending multi-MB phone photos over the network —
    // the server-side Sharp resize becomes a no-op for most images.
    const compressImage = async (file: Blob, filename: string): Promise<{ blob: Blob; filename: string }> => {
        // Skip non-image files
        if (!file.type.startsWith('image/')) {
            return { blob: file, filename };
        }

        const MAX_DIM = 800;
        const QUALITY = 0.85;

        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                try {
                    let { width, height } = img;

                    // Only resize if larger than target
                    if (width > MAX_DIM || height > MAX_DIM) {
                        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve({ blob: file, filename }); // fallback to original
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve({ blob: file, filename }); // fallback to original
                                return;
                            }
                            const jpgFilename = filename.replace(/\.[^/.]+$/, '.jpg');
                            resolve({ blob, filename: jpgFilename });
                        },
                        'image/jpeg',
                        QUALITY
                    );
                } catch (err) {
                    console.error('[Frontend-Compress] Failed, using original:', err);
                    resolve({ blob: file, filename });
                }
            };
            img.onerror = () => {
                console.error('[Frontend-Compress] Image load failed, using original');
                URL.revokeObjectURL(img.src);
                resolve({ blob: file, filename });
            };
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
        });
    };

    const uploadFile = async (file: Blob, filename: string, timeoutMs = 60000): Promise<string> => {
        // Compress images client-side before uploading
        const { blob: fileToUpload, filename: finalFilename } = await compressImage(file, filename);

        const formData = new FormData();
        formData.append('file', fileToUpload, finalFilename);

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
            return data.url;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                console.error('[Frontend-Upload] TIMEOUT');
                throw new Error('Upload timeout - please try again with a smaller file');
            }

            console.error('[Frontend-Upload] ERROR:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent submission if we just transitioned steps (prevents accidental double-submit)
        if (justTransitionedRef.current || isTransitioning) {
            return;
        }

        // Only allow submission from step 3 (or batch mode)
        if (!batchMode && step !== totalSteps) {
            return;
        }

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
                                    color: '#6366f1'
                                    // No category for batch uploads - user will edit later
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
        const hasAudio = (audioType === 'record' || audioType === 'generate') ? !!audioBlob : !!audioFile;
        const hasImage = !!imageFile || (editCard && !!imagePreview);
        const hasAudioOrExisting = hasAudio || (editCard && !audioBlob && !audioFile);

        if (!label || !hasImage || !hasAudioOrExisting) return;

        setIsSubmitting(true);
        try {
            // Upload Image and Audio in PARALLEL (not sequential)
            const [imageUrl, audioUrl] = await Promise.all([
                // Image upload
                imageFile
                    ? uploadFile(imageFile, imageFile.name)
                    : Promise.resolve(editCard?.imageUrl || ''),

                // Audio upload
                (audioType === 'record' && audioBlob)
                    ? uploadFile(audioBlob, `audio-${Date.now()}.${audioBlob.type.includes('webm') ? 'webm' : 'wav'}`)
                    : (audioType === 'generate' && generatedAudioUrl)
                        ? Promise.resolve(generatedAudioUrl)
                        : (audioType === 'upload' && audioFile)
                            ? uploadFile(audioFile, audioFile.name)
                            : Promise.resolve(editCard?.audioUrl || '')
            ]);

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
                        category: category || undefined
                    })
                });

                if (!res.ok) {
                    console.error(`[Frontend-CardOp-${operationId}] Update failed: HTTP ${res.status}`);
                    if (res.status === 409) {
                        toast.error(`A card named "${label}" already exists on this board`);
                        return;
                    }
                    throw new Error('Failed to update card');
                }

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
                        category: category || undefined
                    })
                });

                if (!res.ok) {
                    console.error(`[Frontend-CardOp-${operationId}] Create failed: HTTP ${res.status}`);
                    if (res.status === 409) {
                        toast.error(`A card named "${label}" already exists on this board`);
                        return;
                    }
                    const errorText = await res.text();
                    console.error(`[Frontend-CardOp-${operationId}] Error response:`, errorText);
                    throw new Error('Failed to create card');
                }

                const newCard = await res.json();
                onCardAdded(newCard);
                toast.success('Card created successfully!');
            }

            onClose();
            resetForm();
        } catch (error) {
            console.error('Card operation failed:', error);
            toast.error(editCard ? 'Error updating card' : 'Error creating card');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (step < totalSteps) {
            // Set flag to prevent accidental form submission right after step transition
            justTransitionedRef.current = true;
            setIsTransitioning(true);
            setStep(step + 1);
            // Clear the flag after a short delay
            setTimeout(() => {
                justTransitionedRef.current = false;
                setIsTransitioning(false);
            }, 200);
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const canProceed = () => {
        if (batchMode) return batchImages.length > 0;

        if (step === 1) return !!label && !isLabelDuplicate;
        if (step === 2) return !!imageFile || (editCard && !!imagePreview);
        // For step 3, we allow saving if we have audio OR if we are editing and have existing audio (and not replacing it)
        // Check local state first, then editCard fallback
        const hasAudioState = ((audioType === 'record' || audioType === 'generate') && !!audioBlob) || (audioType === 'upload' && !!audioFile);
        // If user clicked "Remove & Record New", they need to provide new audio
        const canUseExistingAudio = !!editCard?.audioUrl && !wantsNewAudio;
        if (step === 3) return hasAudioState || canUseExistingAudio;

        return false;
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

            {showPublicCardPicker ? (
                <PublicCardPickerModal
                    isOpen={showPublicCardPicker}
                    onClose={() => {
                        setShowPublicCardPicker(false);
                        onClose();
                    }}
                    onBack={() => setShowPublicCardPicker(false)}
                    onCardSelected={(card) => {
                        onCardAdded(card);
                        onClose();
                    }}
                    boardId={boardId}
                    existingCardLabels={existingCardLabels}
                />
            ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {batchMode ? 'Batch Upload' : editCard ? 'Edit Card' : 'New Card'}
                            </h2>
                            {!batchMode && (
                                <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3].map((s) => (
                                        <div
                                            key={s}
                                            className={clsx(
                                                "h-1.5 rounded-full transition-all duration-300",
                                                s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/40" : "w-2 bg-gray-200 dark:bg-gray-700"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        <form
                            id="add-card-form"
                            onSubmit={handleSubmit}
                            className="space-y-6 h-full flex flex-col"
                            onKeyDown={(e) => {
                                // Prevent Enter key from submitting form unless on final step
                                if (e.key === 'Enter' && !batchMode && step !== totalSteps) {
                                    e.preventDefault();
                                }
                            }}
                        >

                            {/* BATCH MODE UI */}
                            {batchMode ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                        <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Batch Mode</h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Select multiple images to create cards quickly.
                                        </p>
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
                                                        <p className="text-sm font-medium text-primary">{batchImages.length} images selected</p>
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
                                                    <p className="text-sm text-gray-500">Tap to select images</p>
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
                                                <span className="font-medium text-gray-700 dark:text-gray-200">Uploading...</span>
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
                                </div>
                            ) : (
                                /* STEPPER UI */
                                <>
                                    {/* STEP 1: DETAILS */}
                                    {step === 1 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                            <div className="text-center space-y-2 mb-8">
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">What is it?</h3>
                                                <p className="text-gray-500 dark:text-gray-400">Give your card a name and category</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                        Card Label
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={label}
                                                        onChange={(e) => setLabel(e.target.value)}
                                                        placeholder="e.g., Apple, Hungry, Yes"
                                                        className={`w-full px-5 py-4 rounded-2xl border-2 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-4 transition-all font-bold text-xl text-center ${
                                                            isLabelDuplicate
                                                                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/10'
                                                                : 'border-gray-100 dark:border-gray-700 focus:border-primary focus:ring-primary/10'
                                                        }`}
                                                        required
                                                        autoFocus
                                                    />
                                                    {isLabelDuplicate && (
                                                        <p className="text-sm text-red-500 mt-2 text-center">
                                                            A card named &ldquo;{label}&rdquo; already exists on this board
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Category (Optional)
                                                    </label>

                                                    {/* Predefined category chips */}
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {PREDEFINED_CATEGORIES.map((cat) => (
                                                            <button
                                                                key={cat.name}
                                                                type="button"
                                                                onClick={() => setCategory(category === cat.name ? '' : cat.name)}
                                                                className={clsx(
                                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95",
                                                                    category === cat.name
                                                                        ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                                                                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                                                )}
                                                            >
                                                                <span>{cat.emoji}</span>
                                                                <span>{cat.name}</span>
                                                            </button>
                                                        ))}

                                                        {/* Show chips for user-created categories that aren't predefined */}
                                                        {existingCategories
                                                            .filter(cat => !PREDEFINED_CATEGORIES.some(p => p.name === cat))
                                                            .map((cat) => (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => setCategory(category === cat ? '' : cat)}
                                                                    className={clsx(
                                                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95",
                                                                        category === cat
                                                                            ? "bg-primary text-white shadow-md ring-2 ring-primary/30"
                                                                            : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                                                                    )}
                                                                >
                                                                    <span>🏷️</span>
                                                                    <span>{cat}</span>
                                                                </button>
                                                            ))
                                                        }
                                                    </div>

                                                    {/* Custom category input */}
                                                    <input
                                                        type="text"
                                                        value={category}
                                                        onChange={(e) => setCategory(e.target.value)}
                                                        placeholder="Or type a custom category..."
                                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="relative py-2">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-white dark:bg-slate-900 px-3 text-gray-400 font-medium">Or</span>
                                                </div>
                                            </div>

                                            {/* Browse Public Cards Option */}
                                            <button
                                                type="button"
                                                onClick={() => setShowPublicCardPicker(true)}
                                                className="w-full flex items-center justify-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Globe className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <span className="block font-bold text-lg text-gray-900 dark:text-white">Browse Public Cards</span>
                                                    <span className="text-sm text-blue-600 dark:text-blue-400">Pick from community boards</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    )}

                                    {/* STEP 2: IMAGE */}
                                    {step === 2 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full">
                                            <div className="text-center space-y-1 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">What does it look like?</h3>
                                            </div>

                                            {/* Preview Area */}
                                            {(imagePreview || imageType === 'camera' || isGenerating) && (
                                                <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 flex-1 min-h-[300px] flex flex-col">

                                                    {imageType === 'camera' ? (
                                                        /* Camera View */
                                                        <div className="relative w-full h-full flex flex-col">
                                                            <video
                                                                ref={videoRef}
                                                                autoPlay
                                                                playsInline
                                                                muted
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {!isCameraActive && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                                                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={capturePhoto}
                                                                disabled={!isCameraActive}
                                                                className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-4 border-gray-300 z-10 disabled:opacity-50"
                                                            >
                                                                <div className="w-12 h-12 bg-white rounded-full border-2 border-gray-400"></div>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={stopCamera}
                                                                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ) : isGenerating ? (
                                                        /* Generation View */
                                                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                                            <p className="text-gray-500 font-medium">Creating your image...</p>
                                                        </div>
                                                    ) : (
                                                        /* Image Preview */
                                                        <div className="relative w-full h-full group">
                                                            <img
                                                                src={imagePreview || ''}
                                                                alt="Card Preview"
                                                                className="w-full h-full object-contain"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setImagePreview(null);
                                                                        setImageType('upload');
                                                                        setHasCamera(true); // Re-check?
                                                                    }}
                                                                    className="px-6 py-2 bg-white text-black rounded-full font-bold transform scale-95 group-hover:scale-100 transition-transform"
                                                                >
                                                                    Change Image
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Source Selection (Only if no image selected yet) */}
                                            {(!imagePreview && !isCameraActive && !isGenerating) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                                                    {/* Upload Option */}
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
                                                            onChange={handleImageChange}
                                                        />
                                                    </button>

                                                    {/* Camera Option */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImageType('camera');
                                                            // Don't call startCamera() here - the useEffect will handle it
                                                            // once the video element is mounted
                                                        }}
                                                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-blue-500">
                                                            <Camera className="w-6 h-6" />
                                                        </div>
                                                        <span className="font-bold text-gray-700 dark:text-gray-200">Take Photo</span>
                                                    </button>

                                                    {/* Generate Option */}
                                                    <div className="col-span-1 sm:col-span-1">
                                                        {!imageType.startsWith('gen') ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setImageType('generate');
                                                                    setGenerationPrompt(label);
                                                                }}
                                                                className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
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
                                                            /* Mini Generation Form */
                                                            <div className="w-full h-full flex flex-col gap-2 p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-100 dark:border-purple-800">
                                                                <textarea
                                                                    value={generationPrompt}
                                                                    onChange={(e) => setGenerationPrompt(e.target.value)}
                                                                    placeholder="Describe it..."
                                                                    className="w-full flex-1 p-2 bg-white dark:bg-slate-900 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 3: AUDIO */}
                                    {step === 3 && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                            <div className="text-center space-y-2 mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">What does it sound like?</h3>
                                                <p className="text-gray-500 dark:text-gray-400">Add sound to make your card speak</p>
                                            </div>

                                            {/* If we have audio (and user hasn't clicked to replace it), show player */}
                                            {(audioBlob || audioFile || (editCard?.audioUrl && !wantsNewAudio)) ? (
                                                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 text-center space-y-6">
                                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                                                        <Music className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg mb-1">{audioFile?.name || 'Voice Recording'}</h4>
                                                        <p className="text-sm text-gray-500">Audio ready to use</p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={toggleAudioPreview}
                                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:scale-[1.02] transition-transform"
                                                    >
                                                        {isPlayingPreview ? (
                                                            <>
                                                                <Pause className="w-5 h-5 fill-current" />
                                                                <span>Pause</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="w-5 h-5 fill-current" />
                                                                <span>Play Sound</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAudioBlob(null);
                                                            setAudioFile(null);
                                                            setGeneratedAudioUrl(null);
                                                            setWantsNewAudio(true);
                                                            stopAudioPreview();
                                                        }}
                                                        className="text-sm text-red-500 font-medium hover:underline"
                                                    >
                                                        Remove & Record New
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Audio Selection Sources */
                                                <div className="grid grid-cols-1 gap-4">

                                                    {/* Recorder */}
                                                    <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
                                                        <div className="bg-gray-50 dark:bg-slate-800/50 p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2">
                                                            <Mic className="w-4 h-4 text-red-500" />
                                                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Voice Recorder</span>
                                                        </div>
                                                        <div className="p-6">
                                                            <AudioRecorder onRecordingComplete={(blob) => {
                                                                setAudioBlob(blob);
                                                                setAudioType('record');
                                                            }} />
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                                                        </div>
                                                        <div className="relative flex justify-center text-xs uppercase">
                                                            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500">Or</span>
                                                        </div>
                                                    </div>

                                                    {/* Text-to-Speech Generation */}
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateAudio}
                                                        disabled={!label.trim() || isGeneratingAudio}
                                                        className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-dashed border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isGeneratingAudio ? (
                                                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="w-5 h-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                                                        )}
                                                        <div className="text-left">
                                                            <span className="font-semibold text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200">
                                                                {isGeneratingAudio ? 'Generating...' : 'Generate from Text'}
                                                            </span>
                                                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                                                                {label.trim() ? `Speak "${label.trim().length > 20 ? label.trim().slice(0, 20) + '...' : label.trim()}"` : 'Enter a label first'}
                                                            </p>
                                                        </div>
                                                    </button>

                                                    <div className="relative">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                                                        </div>
                                                        <div className="relative flex justify-center text-xs uppercase">
                                                            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500">Or</span>
                                                        </div>
                                                    </div>

                                                    {/* File Upload */}
                                                    <button
                                                        type="button"
                                                        onClick={() => audioInputRef.current?.click()}
                                                        className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
                                                    >
                                                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                                        <span className="font-semibold text-gray-600 dark:text-gray-300 group-hover:text-primary">Upload Audio File</span>
                                                        <input
                                                            ref={audioInputRef}
                                                            type="file"
                                                            accept="audio/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                handleAudioFileChange(e);
                                                                setAudioType('upload');
                                                            }}
                                                        />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className={clsx("pt-6 flex gap-3", step !== 1 && "mt-auto")}>
                                {!batchMode && step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-none px-4 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                )}

                                {(!batchMode && step < totalSteps) ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            nextStep();
                                        }}
                                        disabled={!canProceed()}
                                        className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        Next Step
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !canProceed() || isTransitioning}
                                        className={clsx(
                                            "flex-1 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2",
                                            (isSubmitting || !canProceed() || isTransitioning)
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-gradient-to-r from-primary to-accent hover:shadow-primary/25"
                                        )}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                                        {isSubmitting
                                            ? (batchMode
                                                ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                                                : 'Uploading...')
                                            : (batchMode ? `Create ${batchImages.length} Cards` : editCard ? 'Update Card' : 'Finish & Save')}
                                    </button>
                                )}
                            </div>

                        </form>
                    </div>
                </div>
            </div>
            )}
        </>
    );
}
