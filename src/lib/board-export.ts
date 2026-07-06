// Client-side helpers for exporting a board to a JSON backup file and
// importing one back. Media is embedded as data URLs so the file is a
// self-contained backup — board deletion also deletes the media blobs,
// so URL references alone would not survive as a backup.

import { Board, Card } from '@/types';

export const BOARD_EXPORT_FORMAT = 'my-voice-board';
export const BOARD_EXPORT_VERSION = 1;

export interface ExportedCard {
    label: string;
    category?: string;
    color?: string;
    order?: number;
    imageData?: string; // data URL
    audioData?: string; // data URL
}

export interface BoardExportFile {
    format: typeof BOARD_EXPORT_FORMAT;
    version: number;
    exportedAt: string;
    board: { name: string; description?: string };
    cards: ExportedCard[];
}

async function toDataUrl(url: string): Promise<string | undefined> {
    try {
        const res = await fetch(url);
        if (!res.ok) return undefined;
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    } catch {
        // Unreachable media is skipped rather than failing the whole export
        return undefined;
    }
}

export async function buildBoardExport(
    board: Board,
    cards: Card[],
    onProgress?: (done: number, total: number) => void
): Promise<BoardExportFile> {
    const exportedCards: ExportedCard[] = [];
    let done = 0;

    for (const card of cards) {
        const [imageData, audioData] = await Promise.all([
            card.imageUrl ? toDataUrl(card.imageUrl) : Promise.resolve(undefined),
            card.audioUrl ? toDataUrl(card.audioUrl) : Promise.resolve(undefined),
        ]);
        exportedCards.push({
            label: card.label,
            category: card.category || undefined,
            color: card.color || undefined,
            order: card.order,
            imageData,
            audioData,
        });
        done++;
        onProgress?.(done, cards.length);
    }

    return {
        format: BOARD_EXPORT_FORMAT,
        version: BOARD_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        board: {
            name: board.name,
            description: board.description || undefined,
        },
        cards: exportedCards,
    };
}

export function downloadBoardExport(file: BoardExportFile): void {
    const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeName = file.board.name.replace(/[<>:"/\\|?*]+/g, '').trim() || 'board';
    anchor.href = url;
    anchor.download = `${safeName}.board.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

export function parseBoardExport(text: string): BoardExportFile {
    const invalid = () => new Error('That file is not a valid board export');

    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        throw invalid();
    }

    const file = data as Partial<BoardExportFile>;
    if (file?.format !== BOARD_EXPORT_FORMAT
        || typeof file.board?.name !== 'string'
        || !file.board.name.trim()
        || !Array.isArray(file.cards)) {
        throw invalid();
    }
    if (typeof file.version !== 'number' || file.version > BOARD_EXPORT_VERSION) {
        throw new Error('This backup was made with a newer version of the app — please update and try again');
    }
    for (const card of file.cards) {
        if (typeof card?.label !== 'string') throw invalid();
        if (card.imageData !== undefined && (typeof card.imageData !== 'string' || !card.imageData.startsWith('data:'))) throw invalid();
        if (card.audioData !== undefined && (typeof card.audioData !== 'string' || !card.audioData.startsWith('data:'))) throw invalid();
    }

    return file as BoardExportFile;
}

function extensionFromDataUrl(dataUrl: string): string {
    const mime = dataUrl.slice(5, dataUrl.indexOf(';'));
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'audio/webm': 'webm',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
    };
    return map[mime] || mime.split('/')[1] || 'bin';
}

// Decode a data URL without fetch() — the app's CSP connect-src does not
// (and should not) allow data: URLs, so fetch(dataUrl) is refused
export function dataUrlToBlob(dataUrl: string): Blob {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) throw new Error('Invalid data URL');
    const header = dataUrl.slice(0, commaIndex);
    const semicolonIndex = header.indexOf(';');
    const mime = header.slice(5, semicolonIndex === -1 ? undefined : semicolonIndex);
    const data = dataUrl.slice(commaIndex + 1);

    if (header.includes(';base64')) {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(data)], { type: mime });
}

// Upload one embedded media file, pausing and retrying when the per-minute
// upload rate limit is hit (large imports trip it by design)
async function uploadDataUrl(
    dataUrl: string,
    baseName: string,
    onWait?: (seconds: number) => void
): Promise<string> {
    const blob = dataUrlToBlob(dataUrl);
    const fileName = `${baseName}.${extensionFromDataUrl(dataUrl)}`;

    for (let attempt = 0; attempt < 3; attempt++) {
        const formData = new FormData();
        formData.append('file', blob, fileName);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json();
            return data.url;
        }
        if (res.status === 429 && attempt < 2) {
            const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
            onWait?.(retryAfter + 1);
            await new Promise(resolve => setTimeout(resolve, (retryAfter + 1) * 1000));
            continue;
        }
        throw new Error('Upload failed');
    }
    throw new Error('Upload failed');
}

export interface ImportResult {
    boardId: string;
    cardCount: number;
    failedCards: number;
}

export async function importBoard(
    file: BoardExportFile,
    onProgress: (message: string) => void
): Promise<ImportResult> {
    onProgress('Creating board...');
    const boardRes = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: file.board.name.slice(0, 100),
            description: file.board.description?.slice(0, 500) || '',
        }),
    });
    if (!boardRes.ok) {
        const errorData = await boardRes.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create board');
    }
    const newBoard: Board = await boardRes.json();

    // Upload embedded media as fresh blobs. Never reuse the original URLs:
    // deleting the source board deletes its blobs, which would silently break
    // an imported board that pointed at them.
    const cardsPayload: { label: string; category?: string; color?: string; order: number; imageUrl: string; audioUrl: string }[] = [];
    let failedCards = 0;

    for (let i = 0; i < file.cards.length; i++) {
        const card = file.cards[i];
        onProgress(`Uploading card ${i + 1} of ${file.cards.length}...`);
        const onWait = (seconds: number) => onProgress(
            `Upload limit reached — waiting ${seconds} seconds, then continuing with card ${i + 1} of ${file.cards.length}...`
        );
        try {
            const [imageUrl, audioUrl] = await Promise.all([
                card.imageData ? uploadDataUrl(card.imageData, `import-image-${i}`, onWait) : Promise.resolve(''),
                card.audioData ? uploadDataUrl(card.audioData, `import-audio-${i}`, onWait) : Promise.resolve(''),
            ]);
            cardsPayload.push({
                label: card.label.slice(0, 100),
                category: card.category,
                color: card.color,
                order: card.order ?? i,
                imageUrl,
                audioUrl,
            });
        } catch (error) {
            console.error('Failed to import card media:', card.label, error);
            failedCards++;
        }
    }

    onProgress('Adding cards to the board...');
    let cardCount = 0;
    const BATCH_LIMIT = 50;
    for (let start = 0; start < cardsPayload.length; start += BATCH_LIMIT) {
        const chunk = cardsPayload.slice(start, start + BATCH_LIMIT);
        const res = await fetch('/api/cards/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId: newBoard.id, cards: chunk }),
        });
        if (res.ok) {
            const created = await res.json();
            cardCount += created.length;
        } else {
            failedCards += chunk.length;
        }
    }

    return { boardId: newBoard.id, cardCount, failedCards };
}
