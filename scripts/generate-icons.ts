/**
 * One-off script: rasterize public/logo.svg into the PNG icon set needed
 * for the PWA manifest and iOS home screen.
 *
 * Run from the project root: npx tsx <path>/generate-icons.ts
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const svg = readFileSync(join(root, 'public', 'logo.svg'));
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// The logo is a rounded square on a violet gradient; #8B5CF6 matches its top-left.
const BRAND = '#7C63F4'; // midpoint of the violet->indigo gradient

async function plain(size: number, file: string) {
    await sharp(svg, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(join(outDir, file));
    console.log('wrote', file);
}

// Maskable / apple icons need full-bleed background (no transparent corners):
// solid brand square with the logo scaled into the safe zone.
async function fullBleed(size: number, logoScale: number, file: string) {
    const logoSize = Math.round(size * logoScale);
    const logo = await sharp(svg, { density: 300 }).resize(logoSize, logoSize).png().toBuffer();
    const offset = Math.round((size - logoSize) / 2);
    await sharp({
        create: { width: size, height: size, channels: 4, background: BRAND },
    })
        .composite([{ input: logo, top: offset, left: offset }])
        .png()
        .toFile(join(outDir, file));
    console.log('wrote', file);
}

async function main() {
    await plain(192, 'icon-192.png');
    await plain(512, 'icon-512.png');
    await fullBleed(512, 0.8, 'icon-512-maskable.png');
    await fullBleed(180, 0.85, 'apple-touch-icon.png');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
