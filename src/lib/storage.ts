import fs from 'fs/promises';
import path from 'path';
import { Card, Board } from '@/types';

const CARDS_FILE = path.join(process.cwd(), 'data', 'cards.json');
const BOARDS_FILE = path.join(process.cwd(), 'data', 'boards.json');

// --- Cards ---

export async function getCards(boardId?: string): Promise<Card[]> {
    try {
        const data = await fs.readFile(CARDS_FILE, 'utf-8');
        const cards: Card[] = JSON.parse(data);
        if (boardId) {
            return cards.filter(card => card.boardId === boardId);
        }
        return cards;
    } catch (error) {
        return [];
    }
}

export async function saveCards(cards: Card[]): Promise<void> {
    await fs.writeFile(CARDS_FILE, JSON.stringify(cards, null, 2), 'utf-8');
}

export async function addCard(card: Card): Promise<void> {
    // Read all cards first (not just filtered ones) to append correctly
    let cards: Card[] = [];
    try {
        const data = await fs.readFile(CARDS_FILE, 'utf-8');
        cards = JSON.parse(data);
    } catch (e) {
        cards = [];
    }

    cards.push(card);
    await saveCards(cards);
}

export async function updateCard(updatedCard: Card): Promise<void> {
    let cards: Card[] = [];
    try {
        const data = await fs.readFile(CARDS_FILE, 'utf-8');
        cards = JSON.parse(data);
    } catch (e) {
        return;
    }

    const index = cards.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
        cards[index] = updatedCard;
        await saveCards(cards);
    }
}

export async function deleteCard(id: string): Promise<void> {
    let cards: Card[] = [];
    try {
        const data = await fs.readFile(CARDS_FILE, 'utf-8');
        cards = JSON.parse(data);
    } catch (e) {
        return;
    }

    const newCards = cards.filter(c => c.id !== id);
    await saveCards(newCards);
}

// --- Boards ---

export async function getBoards(userId: string): Promise<Board[]> {
    try {
        const data = await fs.readFile(BOARDS_FILE, 'utf-8');
        const boards: Board[] = JSON.parse(data);
        return boards.filter(b => b.userId === userId);
    } catch (error) {
        return [];
    }
}

export async function saveBoards(boards: Board[]): Promise<void> {
    await fs.writeFile(BOARDS_FILE, JSON.stringify(boards, null, 2), 'utf-8');
}

export async function addBoard(board: Board): Promise<void> {
    // Read all boards to append correctly (we don't want to overwrite other users' data)
    let boards: Board[] = [];
    try {
        const data = await fs.readFile(BOARDS_FILE, 'utf-8');
        boards = JSON.parse(data);
    } catch (e) {
        boards = [];
    }

    boards.push(board);
    await saveBoards(boards);
}

export async function getBoard(id: string): Promise<Board | undefined> {
    // Helper to get board, caller must verify ownership if needed
    let boards: Board[] = [];
    try {
        const data = await fs.readFile(BOARDS_FILE, 'utf-8');
        boards = JSON.parse(data);
    } catch (e) {
        return undefined;
    }
    return boards.find(b => b.id === id);
}

export async function updateBoard(updatedBoard: Board): Promise<void> {
    let boards: Board[] = [];
    try {
        const data = await fs.readFile(BOARDS_FILE, 'utf-8');
        boards = JSON.parse(data);
    } catch (e) {
        return;
    }

    const index = boards.findIndex(b => b.id === updatedBoard.id);
    if (index !== -1) {
        boards[index] = updatedBoard;
        await saveBoards(boards);
    }
}

export async function deleteBoard(id: string): Promise<void> {
    let boards: Board[] = [];
    try {
        const data = await fs.readFile(BOARDS_FILE, 'utf-8');
        boards = JSON.parse(data);
    } catch (e) {
        return;
    }

    const newBoards = boards.filter(b => b.id !== id);
    await saveBoards(newBoards);
}
