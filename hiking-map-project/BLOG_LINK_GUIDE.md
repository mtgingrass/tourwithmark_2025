# Hiking Map Blog Link Integration Guide

This guide explains how to automatically add hiking map backlinks to your blog posts.

## Overview

When you add a blog URL to `trail_names.csv`, you can automatically insert a styled link in the blog post that points back to the specific hike on the interactive hiking map.

## How It Works

1. Edit `data/trail_names.csv` and add blog URLs for hikes
2. Run the update script to regenerate the map and add blog links
3. The script will insert a styled link box in each blog post

## Usage

### Adding Blog Links

After updating `trail_names.csv` with blog URLs:

```bash
# Run the all-in-one update script
./scripts/update_trail_data.sh
```

This script will:
1. Regenerate the hiking map with the latest data
2. Add hiking map links to all blog posts specified in trail_names.csv
3. Show you the git status so you can review changes

### Manual Operations

You can also run individual scripts:

```bash
# Just add blog links (without regenerating map)
python3 scripts/add_hiking_map_links.py

# Remove all hiking map links (for cleanup)
python3 scripts/remove_hiking_map_links.py
```

## Link Format

The script adds a styled link box that looks like this:

```html
<div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
  <p style="margin: 0; font-size: 16px;">
    🥾 <a href="/hiking_map.html#87" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">
      View Hike #87: Silver Steps Trail on the Interactive Hiking Map
    </a> 🗺️
  </p>
</div>
```

This creates a blue-bordered box with:
- Hiking boot and map emojis
- A link to the specific hike on the map (using anchor #87 for hike 87)
- The hike number and trail name

## Trail Names CSV Format

Ensure your `trail_names.csv` has these columns:
- `Hike_Number`: The hike ID number
- `Trail_Name`: The friendly name for the trail
- `Blog_URL`: Full URL to the blog post (e.g., https://tourwithmark.com/tours/2025-08-10-caesar-head-state-park/)

## Features

- **Idempotent**: Running the script multiple times won't create duplicate links
- **Smart Placement**: Links are added after the main content (after the last image)
- **Styled**: Links appear in an attractive blue box that matches your site design
- **Bidirectional**: Creates links from map → blog (via popups) and blog → map (via this script)

## Workflow Example

1. Complete a hike and write a blog post
2. Edit `data/trail_names.csv`:
   ```csv
   87,15401583920,"Aug 9, 2025",Saturday Morning Hike,Silver Steps Trail,8.6,,,https://tourwithmark.com/tours/2025-08-10-caesar-head-state-park/
   ```
3. Run the update script:
   ```bash
   ./scripts/update_trail_data.sh
   ```
4. Rebuild your site:
   ```bash
   quarto render
   ```
5. Commit and push:
   ```bash
   git add .
   git commit -m "Add hiking map links to blog posts"
   git push
   ```

## Troubleshooting

- **Link not appearing?** Check that the blog URL in trail_names.csv matches the actual URL structure
- **Wrong position?** The script adds links after the last image. You can manually move them if needed
- **Need to remove links?** Run `python3 scripts/remove_hiking_map_links.py`

## Notes

- The main site navigation already includes a "Hiking Map" link, so these inline links provide quick access to specific hikes
- Links open in a new tab to keep readers on the blog post
- The anchor (#87) will zoom to the specific hike when the map loads (future enhancement)