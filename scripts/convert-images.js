const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const artifactDir = 'C:\\Users\\rob\\.gemini\\antigravity\\brain\\7fdbd10f-276a-44b3-b9d3-803dfe60dc5f';
const prebuiltDir = path.join(__dirname, '..', 'public', 'prebuilt');

if (!fs.existsSync(prebuiltDir)) {
    fs.mkdirSync(prebuiltDir, { recursive: true });
}

const imagePrefixes = [
    'push_me', 'higher', 'watch_me', 'ready_set_go', 'sandbox', 'seesaw',
    'monkey_bars', 'bench', 'lets_play', 'fun', 'too_fast', 'hot', 'thirsty'
];

const files = fs.readdirSync(artifactDir);

async function convertImages() {
    for (const prefix of imagePrefixes) {
        // Find the latest image matching prefix
        const matchingFiles = files.filter(f => f.startsWith(prefix + '_') && f.endsWith('.png'));
        if (matchingFiles.length === 0) {
            console.error(`No generated image found for ${prefix}`);
            continue;
        }
        
        // Sort by timestamp desc (assumes prefix_timestamp.png)
        matchingFiles.sort((a, b) => b.localeCompare(a));
        const latestFile = matchingFiles[0];
        
        const sourcePath = path.join(artifactDir, latestFile);
        const destPath = path.join(prebuiltDir, `${prefix}.webp`);
        
        console.log(`Converting ${latestFile} to ${prefix}.webp...`);
        try {
            await sharp(sourcePath)
                .resize({ width: 512, height: 512, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
                .webp({ quality: 80 })
                .toFile(destPath);
            console.log(`Successfully converted ${prefix}`);
        } catch (err) {
            console.error(`Failed to convert ${prefix}:`, err);
        }
    }
}

convertImages().then(() => console.log('Image conversion complete.'));
