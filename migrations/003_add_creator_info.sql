-- Add creator info columns to boards
ALTER TABLE boards ADD COLUMN IF NOT EXISTS creator_name TEXT;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS creator_image_url TEXT;
