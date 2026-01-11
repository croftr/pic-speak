# Vercel Storage Migration Checklist

## ✅ Code Changes (Already Done)

- [x] Install `@vercel/blob` and `@vercel/postgres` packages
- [x] Install `tsx` for migration script
- [x] Create `schema.sql` with database schema
- [x] Rewrite `src/lib/storage.ts` to use Vercel Postgres
- [x] Update `src/app/api/upload/route.ts` to use Vercel Blob
- [x] Create migration script `scripts/migrate-data.ts`
- [x] Add `migrate` command to `package.json`
- [x] Update `.gitignore` to exclude old files
- [x] Create documentation files

## 📋 Vercel Setup (You Need to Do)

### 1. Create Vercel Postgres Database
- [ ] Go to Vercel Dashboard
- [ ] Navigate to your project
- [ ] Go to Storage tab
- [ ] Click "Create Database"
- [ ] Select "Postgres"
- [ ] Name it `pic-speak-db`
- [ ] Click "Create"
- [ ] Click "Connect" to link to your project
- [ ] Verify environment variables were added

### 2. Create Vercel Blob Storage
- [ ] In the same Storage tab
- [ ] Click "Create Database" again
- [ ] Select "Blob"
- [ ] Name it `pic-speak-blob`
- [ ] Click "Create"
- [ ] Click "Connect" to link to your project
- [ ] Verify `BLOB_READ_WRITE_TOKEN` was added

### 3. Initialize Database Schema
- [ ] In Vercel Dashboard, open your Postgres database
- [ ] Go to "Query" tab
- [ ] Open `schema.sql` from your project
- [ ] Copy all contents
- [ ] Paste into Query tab
- [ ] Click "Run Query"
- [ ] Verify tables were created (should see success message)
- [ ] Check "Data" tab to see `boards` and `cards` tables

### 4. Local Development Setup
- [ ] Run `vercel env pull .env.local` in terminal
- [ ] Verify `.env.local` has all Postgres variables
- [ ] Verify `.env.local` has `BLOB_READ_WRITE_TOKEN`
- [ ] Restart your dev server if it's running

### 5. Data Migration (If Needed)
- [ ] Check if you have `data/cards.json`
- [ ] Check if you have `data/boards.json`
- [ ] If yes, run `npm run migrate`
- [ ] Verify migration completed successfully
- [ ] Check Vercel Postgres "Data" tab to see migrated data

### 6. Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Try creating a new board
- [ ] Try adding a card with an image
- [ ] Try adding audio to a card
- [ ] Verify image displays correctly
- [ ] Verify audio plays correctly
- [ ] Try editing a card
- [ ] Try deleting a card
- [ ] Try reordering cards (drag & drop)
- [ ] Check browser console for errors
- [ ] Check terminal for errors

### 7. Deploy to Vercel
- [ ] Commit all changes: `git add .`
- [ ] Create commit: `git commit -m "Migrate to Vercel Blob + Postgres storage"`
- [ ] Push to GitHub: `git push`
- [ ] Wait for Vercel deployment to complete
- [ ] Check deployment logs for errors

### 8. Production Testing
- [ ] Visit your deployed app
- [ ] Sign in with your account
- [ ] Create a new board
- [ ] Add a card with an image
- [ ] Add a card with audio
- [ ] Verify image displays correctly
- [ ] Verify audio plays correctly
- [ ] Try all CRUD operations (Create, Read, Update, Delete)
- [ ] Test on mobile device
- [ ] Test on different browsers

### 9. Monitoring
- [ ] Go to Vercel Dashboard → Storage
- [ ] Check Postgres usage
- [ ] Check Blob usage
- [ ] Set up usage alerts if needed
- [ ] Monitor for any errors in deployment logs

### 10. Cleanup (After Confirming Everything Works)
- [ ] Delete `data/` folder (if migrated)
- [ ] Delete `public/uploads/` folder (old images)
- [ ] Delete `src/lib/storage-old.ts.backup`
- [ ] Commit cleanup: `git commit -m "Clean up old storage files"`
- [ ] Push: `git push`

## 🚨 Troubleshooting Checklist

### If you see "relation does not exist" error:
- [ ] Verify you ran `schema.sql` in Vercel Postgres Query tab
- [ ] Check the "Data" tab to see if tables exist
- [ ] Try running schema.sql again

### If images aren't uploading:
- [ ] Check `BLOB_READ_WRITE_TOKEN` exists in environment variables
- [ ] Run `vercel env pull .env.local` again
- [ ] Restart dev server
- [ ] Check Vercel Blob dashboard for errors

### If database connection fails:
- [ ] Verify all Postgres environment variables are set
- [ ] Run `vercel env pull .env.local` again
- [ ] Check Vercel Postgres dashboard status
- [ ] Restart dev server

### If migration script fails:
- [ ] Ensure `POSTGRES_URL` is in `.env.local`
- [ ] Check if tables already exist (migration uses ON CONFLICT)
- [ ] Check terminal output for specific error
- [ ] Verify `data/` folder exists with JSON files

## 📊 Success Criteria

You'll know the migration is successful when:

- [x] Code changes are complete
- [ ] Vercel Postgres database is created and connected
- [ ] Vercel Blob storage is created and connected
- [ ] Database schema is initialized (tables exist)
- [ ] Environment variables are pulled locally
- [ ] Local testing passes all checks
- [ ] Deployment to Vercel succeeds
- [ ] Production testing passes all checks
- [ ] No errors in Vercel deployment logs
- [ ] Storage usage is visible in Vercel Dashboard

## 📚 Reference Documents

- `QUICK_SETUP.md` - 5-minute quick start guide
- `MIGRATION_COMPLETE.md` - Main migration guide with next steps
- `VERCEL_STORAGE_MIGRATION.md` - Detailed step-by-step instructions
- `VERCEL_STORAGE_SUMMARY.md` - Complete technical overview
- `ARCHITECTURE.md` - Visual architecture diagrams
- `schema.sql` - Database schema
- `scripts/migrate-data.ts` - Data migration script

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review the documentation files
3. Check Vercel Dashboard for error messages
4. Review Vercel Postgres docs: https://vercel.com/docs/storage/vercel-postgres
5. Review Vercel Blob docs: https://vercel.com/docs/storage/vercel-blob

## 🎉 After Completion

Once all checkboxes are checked:
- Your app is running on production-ready Vercel storage
- Images are served from a global CDN
- Database has automatic backups
- You can scale without worrying about storage limits
- You're ready for production! 🚀
