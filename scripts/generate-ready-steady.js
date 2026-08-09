/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const artifactDir = 'C:\\Users\\rob\\.gemini\\antigravity\\brain\\7fdbd10f-276a-44b3-b9d3-803dfe60dc5f';
const prebuiltDir = path.join(__dirname, '..', 'public', 'prebuilt');

const items = [
    { name: "ready", text: "Ready" },
    { name: "steady", text: "Steady" }
];

async function processAssets() {
    console.log('Generating audio and converting images...');
    const files = fs.readdirSync(artifactDir);

    for (const item of items) {
        // Audio
        const audioPath = path.join(prebuiltDir, `${item.name}.wav`);
        const psCommand = `
Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$synth.SetOutputToWaveFile('${audioPath.replace(/\\/g, '\\\\')}');
$synth.Speak('${item.text}');
$synth.Dispose();
`;
        const psFile = path.join(__dirname, `temp_${item.name}.ps1`);
        fs.writeFileSync(psFile, psCommand);
        execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
        if (fs.existsSync(psFile)) fs.unlinkSync(psFile);

        // Image
        const matchingFiles = files.filter(f => f.startsWith(item.name + '_') && f.endsWith('.png'));
        if (matchingFiles.length > 0) {
            matchingFiles.sort((a, b) => b.localeCompare(a));
            const latestFile = matchingFiles[0];
            const sourcePath = path.join(artifactDir, latestFile);
            const destPath = path.join(prebuiltDir, `${item.name}.webp`);
            
            await sharp(sourcePath)
                .resize({ width: 512, height: 512, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
                .webp({ quality: 80 })
                .toFile(destPath);
            console.log(`Converted ${item.name} image.`);
        }
    }
    console.log('Done processing assets for ready/steady.');
}

processAssets().catch(console.error);
