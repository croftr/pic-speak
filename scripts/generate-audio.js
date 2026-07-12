const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prebuiltDir = path.join(__dirname, '..', 'public', 'prebuilt');

if (!fs.existsSync(prebuiltDir)) {
    fs.mkdirSync(prebuiltDir, { recursive: true });
}

const audios = [
    { name: "push_me", text: "Push me" },
    { name: "higher", text: "Higher" },
    { name: "watch_me", text: "Watch me" },
    { name: "ready_set_go", text: "Ready, set, go" },
    { name: "sandbox", text: "Sandbox" },
    { name: "seesaw", text: "Seesaw" },
    { name: "monkey_bars", text: "Monkey bars" },
    { name: "bench", text: "Bench" },
    { name: "lets_play", text: "Let's play" },
    { name: "fun", text: "Fun" },
    { name: "too_fast", text: "Too fast" },
    { name: "hot", text: "Hot" },
    { name: "thirsty", text: "Thirsty" }
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
