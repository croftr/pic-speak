/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prebuiltDir = path.join(__dirname, '..', 'public', 'prebuilt');

const audios = [
    { name: "ready_set_go", text: "Go" },
    { name: "watch_me", text: "Watch" },
    { name: "push_me", text: "Push" },
    { name: "lets_play", text: "Play" },
    { name: "too_fast", text: "Fast" }
];

console.log('Generating updated audio files using PowerShell...');

for (const audio of audios) {
    const filePath = path.join(prebuiltDir, `${audio.name}.wav`);
    console.log(`Generating ${filePath}...`);
    
    const psCommand = `
Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$synth.SetOutputToWaveFile('${filePath.replace(/\\/g, '\\\\')}');
$synth.Speak('${audio.text.replace(/'/g, "''")}');
$synth.Dispose();
`;
    
    const psFile = path.join(__dirname, 'temp2.ps1');
    fs.writeFileSync(psFile, psCommand);
    
    try {
        execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
    } catch (err) {
        console.error(`Failed to generate ${audio.name}.wav:`, err.message);
    }
    
    if (fs.existsSync(psFile)) fs.unlinkSync(psFile);
}

console.log('Audio generation complete.');
