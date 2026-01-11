/**
 * Data Migration Script
 * 
 * This script migrates data from JSON files (data/cards.json, data/boards.json)
 * to Vercel Postgres database.
 * 
 * Usage:
 * 1. Make sure you have POSTGRES_URL in your .env.local
 * 2. Run: npx tsx scripts/migrate-data.ts
 */

import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';

type OldCard = {
    id: string;
    boardId: string;
    label: string;
    imageUrl: string;
    audioUrl: string;
    color?: string;
    order?: number;
};

type OldBoard = {
    id: string;
    userId: string;
    name: string;
    description?: string;
    createdAt: string;
};

async function migrateData() {
    console.log('🚀 Starting data migration...\n');

    try {
        // Read old data files
        const cardsPath = path.join(process.cwd(), 'data', 'cards.json');
        const boardsPath = path.join(process.cwd(), 'data', 'boards.json');

        let boards: OldBoard[] = [];
        let cards: OldCard[] = [];

        // Read boards
        try {
            const boardsData = await fs.readFile(boardsPath, 'utf-8');
            boards = JSON.parse(boardsData);
            console.log(`📋 Found ${boards.length} boards to migrate`);
        } catch (error) {
            console.log('⚠️  No boards.json found or empty');
        }

        // Read cards
        try {
            const cardsData = await fs.readFile(cardsPath, 'utf-8');
            cards = JSON.parse(cardsData);
            console.log(`🎴 Found ${cards.length} cards to migrate\n`);
        } catch (error) {
            console.log('⚠️  No cards.json found or empty\n');
        }

        if (boards.length === 0 && cards.length === 0) {
            console.log('✅ No data to migrate. You\'re all set!');
            return;
        }

        // Migrate boards
        console.log('📋 Migrating boards...');
        for (const board of boards) {
            try {
                await sql`
                    INSERT INTO boards (id, user_id, name, description, created_at)
                    VALUES (
                        ${board.id}, 
                        ${board.userId}, 
                        ${board.name}, 
                        ${board.description || ''}, 
                        ${board.createdAt}
                    )
                    ON CONFLICT (id) DO NOTHING
                `;
                console.log(`  ✓ Migrated board: ${board.name}`);
            } catch (error) {
                console.error(`  ✗ Failed to migrate board ${board.name}:`, error);
            }
        }

        // Migrate cards
        console.log('\n🎴 Migrating cards...');
        for (const card of cards) {
            try {
                await sql`
                    INSERT INTO cards (id, board_id, label, image_url, audio_url, color, "order")
                    VALUES (
                        ${card.id}, 
                        ${card.boardId}, 
                        ${card.label}, 
                        ${card.imageUrl}, 
                        ${card.audioUrl}, 
                        ${card.color || '#6366f1'}, 
                        ${card.order || 0}
                    )
                    ON CONFLICT (id) DO NOTHING
                `;
                console.log(`  ✓ Migrated card: ${card.label}`);
            } catch (error) {
                console.error(`  ✗ Failed to migrate card ${card.label}:`, error);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Verify your data in the Vercel Postgres dashboard');
        console.log('  2. Test your application thoroughly');
        console.log('  3. Once confirmed, you can safely delete the data/ folder');
        console.log('  4. Deploy your changes to Vercel');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
