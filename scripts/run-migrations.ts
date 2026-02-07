/**
 * Database Migration Runner
 *
 * Runs versioned SQL migrations from the migrations/ directory.
 * Tracks applied migrations in a schema_migrations table to ensure
 * each migration runs exactly once.
 *
 * Usage:
 *   npm run db:migrate              # Run all pending migrations
 *   npm run db:migrate -- --status  # Show migration status
 *   npm run db:migrate -- --baseline # Mark all migrations as applied without running them
 *
 * Migration files must be named: NNN_description.sql (e.g. 001_initial_schema.sql)
 * They are applied in numeric order.
 */

import { Client } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

interface MigrationFile {
    version: number;
    name: string;
    filename: string;
    filepath: string;
}

async function ensureMigrationsTable(client: Client): Promise<void> {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function getAppliedVersions(client: Client): Promise<Set<number>> {
    const result = await client.query('SELECT version FROM schema_migrations ORDER BY version');
    return new Set(result.rows.map(row => row.version));
}

async function getMigrationFiles(): Promise<MigrationFile[]> {
    const files = await fs.readdir(MIGRATIONS_DIR);
    const migrations: MigrationFile[] = [];

    for (const filename of files) {
        if (!filename.endsWith('.sql')) continue;

        const match = filename.match(/^(\d+)_(.+)\.sql$/);
        if (!match) {
            console.warn(`  Skipping ${filename} (doesn't match NNN_name.sql pattern)`);
            continue;
        }

        migrations.push({
            version: parseInt(match[1], 10),
            name: match[2],
            filename,
            filepath: path.join(MIGRATIONS_DIR, filename),
        });
    }

    return migrations.sort((a, b) => a.version - b.version);
}

async function runMigrations(client: Client): Promise<void> {
    const applied = await getAppliedVersions(client);
    const migrations = await getMigrationFiles();
    const pending = migrations.filter(m => !applied.has(m.version));

    if (pending.length === 0) {
        console.log('  No pending migrations.\n');
        return;
    }

    console.log(`  ${pending.length} pending migration(s) to apply:\n`);

    for (const migration of pending) {
        console.log(`  Applying ${migration.filename}...`);
        const sql = await fs.readFile(migration.filepath, 'utf-8');

        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query(
                'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
                [migration.version, migration.name]
            );
            await client.query('COMMIT');
            console.log(`    Applied.\n`);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`    FAILED:\n`, error);
            throw new Error(`Migration ${migration.filename} failed. Aborting.`);
        }
    }

    console.log(`  All migrations applied successfully.\n`);
}

async function showStatus(client: Client): Promise<void> {
    const applied = await getAppliedVersions(client);
    const migrations = await getMigrationFiles();

    // Get applied_at timestamps
    const appliedDetails = new Map<number, string>();
    const result = await client.query('SELECT version, applied_at FROM schema_migrations ORDER BY version');
    for (const row of result.rows) {
        appliedDetails.set(row.version, new Date(row.applied_at).toISOString());
    }

    console.log('  Migration Status:\n');
    console.log('  Version  Status    Applied At                   Name');
    console.log('  -------  --------  ---------------------------  ----');

    for (const m of migrations) {
        const status = applied.has(m.version) ? 'applied' : 'PENDING';
        const appliedAt = appliedDetails.get(m.version) || '';
        const paddedVersion = String(m.version).padStart(3, '0').padEnd(7);
        const paddedStatus = status.padEnd(8);
        const paddedDate = appliedAt.padEnd(27);
        console.log(`  ${paddedVersion}  ${paddedStatus}  ${paddedDate}  ${m.name}`);
    }
    console.log('');
}

async function baselineMigrations(client: Client): Promise<void> {
    const applied = await getAppliedVersions(client);
    const migrations = await getMigrationFiles();
    const unapplied = migrations.filter(m => !applied.has(m.version));

    if (unapplied.length === 0) {
        console.log('  All migrations already recorded.\n');
        return;
    }

    console.log(`  Baselining ${unapplied.length} migration(s) (marking as applied without running SQL)...\n`);

    for (const m of unapplied) {
        await client.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [m.version, m.name]
        );
        console.log(`    Recorded ${m.filename}`);
    }

    console.log(`\n  Baseline complete.\n`);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const statusOnly = args.includes('--status');
    const baseline = args.includes('--baseline');

    if (!process.env.POSTGRES_URL) {
        console.error('POSTGRES_URL is not set. Add it to .env.local');
        process.exit(1);
    }

    console.log('\nDatabase Migration Runner\n');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log('  Connected to database.\n');

    try {
        await ensureMigrationsTable(client);

        if (statusOnly) {
            await showStatus(client);
        } else if (baseline) {
            await baselineMigrations(client);
        } else {
            await runMigrations(client);
        }
    } catch (error) {
        console.error('Migration runner failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
