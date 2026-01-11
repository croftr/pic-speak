# Vercel Storage Migration Guide

## Overview
This guide will help you migrate from file-based storage to Vercel Blob + Postgres.

## Prerequisites
- Vercel account
- Project deployed on Vercel (or ready to deploy)

## Step 1: Set Up Vercel Postgres

1. Go to your project on Vercel Dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a name for your database (e.g., `pic-speak-db`)
6. Select your region (choose closest to your users)
7. Click **Create**

## Step 2: Connect Database to Your Project

1. After creating the database, click **Connect**
2. Select your project from the dropdown
3. Click **Connect** to link the database
4. Vercel will automatically add these environment variables to your project:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

## Step 3: Set Up Vercel Blob Storage

1. In the Vercel Dashboard, go to **Storage** tab
2. Click **Create Database** again
3. Select **Blob**
4. Choose a name (e.g., `pic-speak-blob`)
5. Click **Create**
6. Connect it to your project
7. Vercel will add this environment variable:
   - `BLOB_READ_WRITE_TOKEN`

## Step 4: Initialize Database Schema

1. In the Vercel Dashboard, go to your Postgres database
2. Click on the **Query** tab
3. Copy and paste the contents of `schema.sql` from your project
4. Click **Run Query**
5. Verify the tables were created successfully

## Step 5: Pull Environment Variables Locally (for development)

Run this command in your project directory:

```bash
vercel env pull .env.local
```

This will download all environment variables from Vercel to your local `.env.local` file.

## Step 6: Deploy Your Updated Code

```bash
git add .
git commit -m "Migrate to Vercel Blob + Postgres storage"
git push
```

Vercel will automatically deploy your changes.

## Step 7: Verify Everything Works

1. Visit your deployed app
2. Try creating a new board
3. Try adding a card with an image and audio
4. Verify the image displays correctly
5. Check that audio playback works

## Environment Variables Summary

Your `.env.local` should have these variables (automatically added by Vercel):

```env
# Postgres (added automatically by Vercel)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Blob Storage (added automatically by Vercel)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Your existing variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
# ... other existing variables
```

## Migration Notes

### Data Migration (Optional)

If you have existing data in `data/cards.json` and `data/boards.json`, you'll need to migrate it. A migration script can be created if needed.

### File Storage vs Blob Storage

**Before (File Storage):**
- Images stored in `public/uploads/`
- Limited by server disk space
- Not suitable for serverless deployments

**After (Blob Storage):**
- Images stored in Vercel Blob
- Scalable and reliable
- Perfect for serverless
- Automatic CDN distribution
- No file size limits (up to 500MB per file)

### Database Comparison

**Before (JSON Files):**
- `data/cards.json` and `data/boards.json`
- Risk of data corruption
- No concurrent access support
- Not suitable for production

**After (Postgres):**
- Proper relational database
- ACID compliance
- Concurrent access support
- Automatic backups
- Production-ready

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the schema.sql in the Vercel Postgres Query tab
- Check that the tables were created successfully

### Images not uploading
- Verify `BLOB_READ_WRITE_TOKEN` is set correctly
- Check Vercel Blob dashboard for any errors

### Database connection errors
- Verify all Postgres environment variables are set
- Try pulling env variables again: `vercel env pull .env.local`

## Cost Considerations

### Free Tier Limits (Hobby Plan)
- **Postgres**: 256 MB storage, 60 hours compute time/month
- **Blob**: 1 GB storage, 10 GB bandwidth/month

For most personal projects, the free tier is sufficient. Monitor usage in the Vercel dashboard.

## Rollback Plan

If you need to rollback to file-based storage:

1. Restore `src/lib/storage-old.ts.backup` to `src/lib/storage.ts`
2. Restore old `src/app/api/upload/route.ts` from git history
3. Redeploy

## Support

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
