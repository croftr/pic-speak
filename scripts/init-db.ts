/**
 * Database Initialization Script
 *
 * This script initializes your Prisma Postgres database with the schema.
 *
 * Usage:
 * 1. Make sure you have POSTGRES_URL in your .env.local
 * 2. Run: npm run init-db
 */

import { Client } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function initDatabase() {
    console.log('🚀 Initializing database...\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();
    console.log('✅ Connected to database\n');

    try {
        // Read schema file
        const schemaPath = path.join(process.cwd(), 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf-8');

        console.log('📄 Reading schema.sql...');

        // Remove comments and split by semicolons
        const cleanedSchema = schema
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        const statements = cleanedSchema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);

            try {
                await client.query(statement);
                console.log(`   ✅ Success\n`);
            } catch (error: any) {
                // Ignore "already exists" errors
                if (error.message.includes('already exists')) {
                    console.log(`   ⚠️  Already exists (skipping)\n`);
                } else {
                    throw error;
                }
            }
        }

        console.log('✅ Database initialized successfully!\n');
        console.log('📋 Tables created:');
        console.log('   - boards');
        console.log('   - cards');
        console.log('\n🎉 You can now run your application!');

    } catch (error) {
        console.error('\n❌ Database initialization failed:', error);
        await client.end();
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run initialization
initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
