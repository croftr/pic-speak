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

// --- Boards ---

export async function getBoards(): Promise<Board[]> {
    try {
        const data = await fs.readFile(BOARDS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

export async function saveBoards(boards: Board[]): Promise<void> {
    await fs.writeFile(BOARDS_FILE, JSON.stringify(boards, null, 2), 'utf-8');
}

export async function addBoard(board: Board): Promise<void> {
    const boards = await getBoards();
    boards.push(board);
    await saveBoards(boards);
}

export async function getBoard(id: string): Promise<Board | undefined> {
    const boards = await getBoards();
    return boards.find(b => b.id === id);
}
