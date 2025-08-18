# Image Processing Workflow

## Raw Image Management

For every post, use this folder structure:
- `raw_image/` - Contains original high-quality images (git ignored)
- `images/` - Contains processed webp images for web use

## Converting Images

### HEIC Files (iPhone/iPad Photos)

For HEIC files, first use the auto-rotation utility to convert with proper orientation:
```bash
/Users/markgingrass/Developer/Utils/auto-rotate-heic.sh path/to/raw_image/
```

This utility:
1. Reads EXIF orientation data from HEIC files
2. Converts HEIC to JPG with proper rotation applied
3. Handles all standard orientations (90°, 180°, 270°)
4. Preserves image quality during conversion

### Standard Image Conversion

Then run the webp conversion script to process all images:
```bash
node convert-images.js
```

The script will:
1. Find all `raw_image` folders recursively  
2. Convert supported formats (jpg, jpeg, png, gif, bmp, tiff) to webp
3. Save converted images to corresponding `images` folders
4. Create `images` folders if they don't exist

## Book Cover Images

For book covers on the `/booklist` page:
- Use Open Library's free cover API for book images
- Download covers using the script: `./get-openlibrary-covers.sh`
- Store images in `/book_images/` directory
- Use relative paths in markdown: `book_images/book-name.jpg`
- Open Library API format: `https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg`

Note: Avoid using Amazon image URLs directly as they block hotlinking. Open Library provides freely available book covers without restrictions.

## Requirements

Install required tools:
```bash
# macOS
brew install webp exiftool

# Ubuntu/Debian  
sudo apt-get install webp exiftool
```

## Developer Utilities

Global utilities located in `/Users/markgingrass/Developer/Utils/` (accessible to all Claude Code projects):

### auto-rotate-heic.sh
Automatic HEIC rotation utility that reads EXIF orientation data and applies correct rotations before conversion.

**Usage:**
```bash
/Users/markgingrass/Developer/Utils/auto-rotate-heic.sh [directory]
```

**Features:**
- Auto-detects EXIF orientation from HEIC files
- Applies proper rotations (90°, 180°, 270°)
- Converts HEIC to JPG with correct orientation
- Handles batch processing of entire directories
- Color-coded output with progress indicators

## Git Configuration

The `.gitignore` file excludes all `raw_image` folders recursively with the pattern `**/raw_image/`.