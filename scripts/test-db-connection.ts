/**
 * Test Database Connection
 *
 * This script tests the database connection and displays available env vars
 */

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

console.log('Environment Variables Check:\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set ✓' : 'Not set ✗');
console.log('POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? 'Set ✓' : 'Not set ✗');
console.log('PRISMA_DATABASE_URL:', process.env.PRISMA_DATABASE_URL ? 'Set ✓' : 'Not set ✗');

console.log('\nConnection String Details:\n');

if (process.env.POSTGRES_URL) {
    const url = new URL(process.env.POSTGRES_URL);
    console.log('POSTGRES_URL host:', url.hostname);
}

if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.log('DATABASE_URL host:', url.hostname);
}

console.log('\nNOTE: For Vercel Postgres, the hostname should look like:');
console.log('  ep-xxx-xxx.us-east-1.postgres.vercel-storage.com');
console.log('\nYour connection is currently pointing to:', process.env.POSTGRES_URL ? new URL(process.env.POSTGRES_URL).hostname : 'Unknown');
console.log('\nThis looks like a Prisma Accelerate connection, not Vercel Postgres.');
console.log('Please check your Vercel dashboard for the correct Postgres connection strings.');
