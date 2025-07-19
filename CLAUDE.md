# Image Processing Workflow

## Raw Image Management

For every post, use this folder structure:
- `raw_image/` - Contains original high-quality images (git ignored)
- `images/` - Contains processed webp images for web use

## Converting Images

Run the conversion script to process all raw images:
```bash
node convert-images.js
```

The script will:
1. Find all `raw_image` folders recursively
2. Convert supported formats (jpg, jpeg, png, gif, bmp, tiff) to webp
3. Save converted images to corresponding `images` folders
4. Create `images` folders if they don't exist

## Requirements

Install cwebp (part of webp tools):
```bash
# macOS
brew install webp

# Ubuntu/Debian
sudo apt-get install webp
```

## Git Configuration

The `.gitignore` file excludes all `raw_image` folders recursively with the pattern `**/raw_image/`.