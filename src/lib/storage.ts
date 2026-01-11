import fs from 'fs/promises';
import path from 'path';
import { Card } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'cards.json');

export async function getCards(): Promise<Card[]> {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or error, return empty array
        return [];
    }
}

export async function saveCards(cards: Card[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(cards, null, 2), 'utf-8');
}

export async function addCard(card: Card): Promise<void> {
    const cards = await getCards();
    cards.push(card);
    await saveCards(cards);
}
