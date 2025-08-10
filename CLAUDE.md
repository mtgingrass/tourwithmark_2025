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

## Book Cover Images

For book covers on the `/booklist` page:
- Use Open Library's free cover API for book images
- Download covers using the script: `./get-openlibrary-covers.sh`
- Store images in `/book_images/` directory
- Use relative paths in markdown: `book_images/book-name.jpg`
- Open Library API format: `https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg`

Note: Avoid using Amazon image URLs directly as they block hotlinking. Open Library provides freely available book covers without restrictions.

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