#!/bin/bash

# Script to update trail data and automatically add hiking map links to blog posts
# Run this after editing trail_names.csv

echo "🥾 Updating Trail Data and Blog Links"
echo "======================================"
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PARENT_DIR="$(dirname "$PROJECT_DIR")"

# Step 1: Regenerate the hiking map
echo "Step 1: Regenerating hiking map..."
python3 "$SCRIPT_DIR/plot_hikes.py"
echo ""

# Step 2: Add hiking map links to blog posts
echo "Step 2: Adding hiking map links to blog posts..."
python3 "$SCRIPT_DIR/add_hiking_map_links.py"
echo ""

# Step 3: Show git status
echo "Step 3: Checking git status..."
cd "$PARENT_DIR"
git status --short
echo ""

echo "✅ Trail data update complete!"
echo ""
echo "Next steps:"
echo "  1. Review the changes with: git diff"
echo "  2. Run: quarto render (to rebuild the site)"
echo "  3. Commit changes: git add . && git commit -m 'Update trail data and add hiking map links'"
echo "  4. Push to remote: git push"