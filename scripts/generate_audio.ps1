Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer

$words = @("School", "Juice", "Chocolate", "Sweets", "Cake", "Apple")
foreach ($word in $words) {
    Write-Host "Generating audio for $word..."
    $path = "c:\Users\rob\projects\pic-speak\public\prebuilt\" + $word.ToLower() + ".wav"
    $speak.SetOutputToWaveFile($path)
    $speak.Speak($word)
    $speak.SetOutputToNull()
}
$speak.Dispose()
Write-Host "Done."
