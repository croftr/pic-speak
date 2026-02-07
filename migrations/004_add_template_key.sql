-- Add template key to cards and make columns nullable for template cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS template_key TEXT;
ALTER TABLE cards ALTER COLUMN label DROP NOT NULL;
ALTER TABLE cards ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE cards ALTER COLUMN audio_url DROP NOT NULL;
