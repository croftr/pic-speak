# Image File Conversion Guide

To maintain consistency and performance in the Pic-Speak application, all prebuilt images should be converted to **WebP** format and resized to a maximum width of **400px**.

## Prerequisites
Ensure you have **FFmpeg** installed on your system. You can check this by running:
```powershell
ffmpeg -version
```

## Single Image Conversion
Use the following command to convert a single image (PNG, JPG, etc.) to the optimized WebP format:

```powershell
ffmpeg -i input_image.png -vf "scale=400:-1:force_original_aspect_ratio=decrease" -lossless 0 -q:v 80 output_image.webp
```

### Command Breakdown:
- `-i input_image.png`: The source image file.
- `-vf "scale=400:-1..."`: Resizes the image to a maximum width of 400px while maintaining the aspect ratio (`-1`).
- `-lossless 0`: Enables lossy compression (better for smaller file sizes).
- `-q:v 80`: Sets the quality to 80% (great balance between quality and size).
- `output_image.webp`: The resulting filename.

---

## Bulk Conversion (PowerShell)
If you have a folder full of images you want to convert at once, run this command within that directory:

```powershell
Get-ChildItem -Filter *.png | ForEach-Object {
    $out = $_.BaseName + ".webp"
    ffmpeg -i $_.Name -vf "scale=400:-1:force_original_aspect_ratio=decrease" -lossless 0 -q:v 80 $out
}
```

## Recommended Standards
- **Format**: All prebuilt assets should be `.webp`.
- **Size**: Maximum width or height of **400px**.
- **Location**: Store images in `public/prebuilt/`.
- **Database**: Ensure you update `src/lib/storage.ts` or the `cards` table in the database if the file extension changes.
