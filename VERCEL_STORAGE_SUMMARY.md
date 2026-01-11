# Vercel Storage Implementation Summary

## What Changed?

Your Pic Speak app has been updated to use **Vercel Blob** for image/audio storage and **Vercel Postgres** for metadata storage, replacing the previous file-based system.

## Files Modified

### Core Storage Layer
- ✅ **`src/lib/storage.ts`** - Completely rewritten to use Vercel Postgres
  - Old version backed up to `src/lib/storage-old.ts.backup`
  - Now uses SQL queries instead of JSON file operations
  - Proper type mapping for database columns (snake_case to camelCase)

### API Routes
- ✅ **`src/app/api/upload/route.ts`** - Updated to use Vercel Blob
  - Images/audio now uploaded to Vercel Blob storage
  - Returns CDN URLs instead of local file paths
  - Automatic random suffix for unique filenames

### New Files Created
- ✅ **`schema.sql`** - Database schema for Postgres
- ✅ **`scripts/migrate-data.ts`** - Optional migration script for existing data
- ✅ **`VERCEL_STORAGE_MIGRATION.md`** - Detailed setup guide
- ✅ **`VERCEL_STORAGE_SUMMARY.md`** - This file

### Dependencies Added
```json
{
  "@vercel/blob": "^2.0.0",
  "@vercel/postgres": "^0.10.0",
  "tsx": "^4.21.0" (dev dependency)
}
```

## Database Schema

### Tables Created

**boards**
- `id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT, NOT NULL)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**cards**
- `id` (TEXT, PRIMARY KEY)
- `board_id` (TEXT, FOREIGN KEY → boards.id)
- `label` (TEXT, NOT NULL)
- `image_url` (TEXT, NOT NULL)
- `audio_url` (TEXT, NOT NULL)
- `color` (TEXT, DEFAULT '#6366f1')
- `order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Setup Instructions

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Name it (e.g., `pic-speak-db`)
6. Click **Create**
7. Connect it to your project

### 2. Create Vercel Blob Storage

1. In the same **Storage** tab
2. Click **Create Database** → **Blob**
3. Name it (e.g., `pic-speak-blob`)
4. Click **Create**
5. Connect it to your project

### 3. Initialize Database Schema

1. In Vercel Dashboard, open your Postgres database
2. Go to **Query** tab
3. Copy contents of `schema.sql`
4. Paste and click **Run Query**

### 4. Pull Environment Variables Locally

```bash
vercel env pull .env.local
```

This downloads all Vercel environment variables to your local `.env.local` file.

### 5. (Optional) Migrate Existing Data

If you have data in `data/cards.json` and `data/boards.json`:

```bash
npm run migrate
```

This will transfer your existing data to Postgres.

### 6. Deploy

```bash
git add .
git commit -m "Migrate to Vercel storage"
git push
```

Vercel will automatically deploy.

## Environment Variables

These are automatically added by Vercel when you create the databases:

```env
# Postgres
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

## Benefits of This Migration

### Before (File-Based)
❌ Limited by server disk space  
❌ Not suitable for serverless  
❌ Risk of data corruption  
❌ No concurrent access support  
❌ Manual backups required  

### After (Vercel Storage)
✅ Scalable and reliable  
✅ Perfect for serverless  
✅ ACID compliance  
✅ Concurrent access support  
✅ Automatic backups  
✅ CDN distribution for images  
✅ Production-ready  

## Code Changes Explained

### Storage Layer (`src/lib/storage.ts`)

**Before:**
```typescript
export async function getCards(boardId?: string): Promise<Card[]> {
    const data = await fs.readFile(CARDS_FILE, 'utf-8');
    const cards: Card[] = JSON.parse(data);
    return boardId ? cards.filter(c => c.boardId === boardId) : cards;
}
```

**After:**
```typescript
export async function getCards(boardId?: string): Promise<Card[]> {
    const { rows } = await sql<CardRow>`
        SELECT * FROM cards 
        WHERE board_id = ${boardId}
        ORDER BY "order" ASC
    `;
    return rows.map(row => ({
        id: row.id,
        boardId: row.board_id,
        // ... map snake_case to camelCase
    }));
}
```

### Upload Route (`src/app/api/upload/route.ts`)

**Before:**
```typescript
const filepath = path.join(uploadDir, filename);
await writeFile(filepath, buffer);
const url = `/uploads/${filename}`;
```

**After:**
```typescript
const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
});
const url = blob.url; // CDN URL
```

## Testing Checklist

After deployment, verify:

- [ ] Can create new boards
- [ ] Can add cards with images
- [ ] Can add cards with audio
- [ ] Images display correctly
- [ ] Audio plays correctly
- [ ] Can edit cards
- [ ] Can delete cards
- [ ] Can reorder cards (drag & drop)
- [ ] Can edit board name/description
- [ ] Can delete boards

## Troubleshooting

### "relation does not exist" error
→ Run `schema.sql` in Vercel Postgres Query tab

### Images not uploading
→ Check `BLOB_READ_WRITE_TOKEN` is set in environment variables

### Database connection errors
→ Run `vercel env pull .env.local` to refresh environment variables

### Migration script fails
→ Ensure `POSTGRES_URL` is in `.env.local`

## Cost Considerations

### Vercel Hobby Plan (Free Tier)
- **Postgres**: 256 MB storage, 60 hours compute/month
- **Blob**: 1 GB storage, 10 GB bandwidth/month

For most personal projects, this is sufficient. Monitor usage in Vercel Dashboard.

## Rollback Plan

If needed, you can rollback:

1. Restore `src/lib/storage-old.ts.backup` → `src/lib/storage.ts`
2. Restore old upload route from git history
3. Redeploy

## Next Steps

1. ✅ Complete Vercel setup (follow migration guide)
2. ✅ Test thoroughly in production
3. ✅ Monitor usage in Vercel Dashboard
4. 🗑️ After confirming everything works, delete:
   - `data/` folder (if migrated)
   - `public/uploads/` folder (old images)
   - `src/lib/storage-old.ts.backup`

## Support Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Storage Pricing](https://vercel.com/docs/storage/pricing)

---

**Questions?** Check `VERCEL_STORAGE_MIGRATION.md` for detailed setup instructions.
