import { Client } from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function setTestEmail() {
    console.log('Setting test email on all public boards...');

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to database');

    // First, run migration to add columns if they don't exist
    try {
        await client.query(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS owner_email TEXT`);
        await client.query(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE`);
        console.log('Ensured columns exist');
    } catch (e) {
        console.log('Columns already exist or error:', e);
    }

    // Update all public boards
    const result = await client.query(
        `UPDATE boards SET owner_email = $1, email_notifications_enabled = true WHERE is_public = true RETURNING id, name`,
        ['angelajanecroft@gmail.com']
    );

    console.log(`\nUpdated ${result.rowCount} public boards:`);
    result.rows.forEach(row => {
        console.log(`  - ${row.name} (${row.id})`);
    });

    // Verify
    const check = await client.query(
        `SELECT id, name, owner_email, email_notifications_enabled FROM boards WHERE is_public = true`
    );

    console.log('\nVerification:');
    check.rows.forEach(row => {
        console.log(`  - ${row.name}: ${row.owner_email} (notifications: ${row.email_notifications_enabled})`);
    });

    await client.end();
    console.log('\nDone!');
}

setTestEmail().catch(console.error);
