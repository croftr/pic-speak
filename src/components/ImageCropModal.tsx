'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCw, ZoomIn, ZoomOut, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { Area, Point } from 'react-easy-crop';
import { clsx } from 'clsx';

interface ImageCropModalProps {
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
}

type AspectRatioOption = {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
};

const aspectRatios: AspectRatioOption[] = [
    { label: 'Portrait', value: 3 / 4, icon: RectangleVertical },
    { label: 'Square', value: 1, icon: Square },
    { label: 'Landscape', value: 4 / 3, icon: RectangleHorizontal },
];

export default function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number>(3 / 4); // Default to portrait
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (location: Point) => {
        setCrop(location);
    };

    const onCropCompleteInternal = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async (): Promise<Blob> => {
        if (!croppedAreaPixels) throw new Error('No crop area');

        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = (e) => reject(e);
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2d context');

        const maxSize = Math.max(image.width, image.height);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        // set each dimension to double largest dimension to allow for a safe area for the
        // image to rotate in without being clipped by canvas context
        canvas.width = safeArea;
        canvas.height = safeArea;

        // translate canvas context to a central location on image to allow rotating around the center.
        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        // draw rotated image and store data.
        ctx.drawImage(
            image,
            safeArea / 2 - image.width * 0.5,
            safeArea / 2 - image.height * 0.5
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        // set canvas width to final desired crop size - this will clear existing context
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // paste generated rotate image with correct offsets for x,y crop values.
        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.width * 0.5 - croppedAreaPixels.x),
            Math.round(0 - safeArea / 2 + image.height * 0.5 - croppedAreaPixels.y)
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas is empty'));
                }
            }, 'image/jpeg', 0.95);
        });
    };

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedBlob = await createCroppedImage();
            onCropComplete(croppedBlob);
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black">
            {/* Header */}
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Crop & Resize Image</h3>
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Cropper */}
            <div className="flex-1 relative">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspectRatio}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteInternal}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                />
            </div>

            {/* Controls */}
            <div className="bg-gray-900 px-4 py-4 space-y-4">
                {/* Aspect Ratio Selector */}
                <div className="space-y-2">
                    <label className="text-white text-sm font-medium">Aspect Ratio</label>
                    <div className="flex gap-2">
                        {aspectRatios.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => setAspectRatio(option.value)}
                                    className={clsx(
                                        "flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                        aspectRatio === option.value
                                            ? "bg-primary text-white shadow-lg"
                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Zoom Control */}
                <div className="flex items-center gap-3">
                    <ZoomOut className="w-5 h-5 text-white" />
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <ZoomIn className="w-5 h-5 text-white" />
                </div>

                {/* Rotation Control */}
                <div className="flex items-center gap-3">
                    <RotateCw className="w-5 h-5 text-white" />
                    <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-white text-sm font-bold w-12 text-right">{rotation}°</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Apply
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
