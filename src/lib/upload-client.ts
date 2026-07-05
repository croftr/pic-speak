// Client-side upload helpers shared by card creation and board cover flows.

// Compress an image client-side using canvas before uploading.
// This avoids sending multi-MB phone photos over the network —
// the server-side Sharp resize becomes a no-op for most images.
export async function compressImage(file: Blob, filename: string): Promise<{ blob: Blob; filename: string }> {
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
}

export async function uploadFile(file: Blob, filename: string, timeoutMs = 60000): Promise<string> {
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
}
