/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prebuiltDir = path.join(__dirname, '..', 'public', 'prebuilt');

if (!fs.existsSync(prebuiltDir)) {
    fs.mkdirSync(prebuiltDir, { recursive: true });
}

const audios = [
    { name: "i_dont_understand", text: "I don't understand" },
    { name: "i_need_a_break", text: "I need a break" },
    { name: "repeat_that", text: "Can you repeat that?" },
    { name: "im_done", text: "I'm done" },
    { name: "tablet", text: "Tablet" },
    { name: "backpack", text: "Backpack" },
    { name: "desk", text: "Desk" },
    { name: "library", text: "Library" },
    { name: "cafeteria", text: "Cafeteria" },
    { name: "gym", text: "Gym" },
    { name: "listen", text: "Listen" },
    { name: "math", text: "Math" },
    { name: "art", text: "Art" }
];

console.log('Generating audio files using PowerShell...');

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
    
    const psFile = path.join(__dirname, 'temp.ps1');
    fs.writeFileSync(psFile, psCommand);
    
    try {
        execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`);
    } catch (err) {
        console.error(`Failed to generate ${audio.name}.wav:`, err.message);
    }
    
    if (fs.existsSync(psFile)) fs.unlinkSync(psFile);
}

console.log('Audio generation complete.');
