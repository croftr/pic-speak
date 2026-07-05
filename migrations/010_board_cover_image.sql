-- Optional cover image for a board, shown on board tiles.
-- NULL means "no explicit cover"; UI falls back to the first card's image.
ALTER TABLE boards ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
