# Quick Setup Guide - Vercel Storage

## 🚀 Quick Start (5 minutes)

### Step 1: Create Postgres Database
```
Vercel Dashboard → Your Project → Storage → Create Database → Postgres
Name: pic-speak-db → Create → Connect to Project
```

### Step 2: Create Blob Storage
```
Same Storage tab → Create Database → Blob
Name: pic-speak-blob → Create → Connect to Project
```

### Step 3: Run Database Schema
```
Vercel Dashboard → Postgres Database → Query tab
Copy/paste contents of schema.sql → Run Query
```

### Step 4: Pull Environment Variables
```bash
vercel env pull .env.local
```

### Step 5: (Optional) Migrate Existing Data
```bash
npm run migrate
```

### Step 6: Deploy
```bash
git add .
git commit -m "Migrate to Vercel storage"
git push
```

## ✅ Verification

After deployment, test:
1. Create a new board ✓
2. Add a card with image ✓
3. Add audio to card ✓
4. Verify image displays ✓
5. Verify audio plays ✓

## 📊 What You Get

| Feature | Before | After |
|---------|--------|-------|
| Image Storage | Local files | Vercel Blob (CDN) |
| Database | JSON files | Postgres |
| Scalability | Limited | Unlimited |
| Backups | Manual | Automatic |
| Serverless | ❌ | ✅ |

## 🆓 Free Tier Limits

- **Postgres**: 256 MB storage
- **Blob**: 1 GB storage, 10 GB bandwidth/month

Perfect for personal projects!

## 🆘 Common Issues

**"relation does not exist"**
→ Run schema.sql in Postgres Query tab

**Images not uploading**
→ Check BLOB_READ_WRITE_TOKEN in env variables

**Can't connect to database**
→ Run `vercel env pull .env.local` again

## 📚 Full Documentation

See `VERCEL_STORAGE_MIGRATION.md` for detailed instructions.
