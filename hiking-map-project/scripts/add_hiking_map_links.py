#!/usr/bin/env python3
"""
Automatically adds hiking map backlinks to blog posts based on trail_names.csv
This script reads the trail_names.csv file and adds a hiking map link to each
blog post that has a corresponding hike entry.
"""

import os
import csv
import re
from datetime import datetime

def extract_date_from_url(blog_url):
    """Extract date from blog URL format"""
    # Pattern: /tours/YYYY-MM-DD-title/
    match = re.search(r'/tours/(\d{4}-\d{2}-\d{2})-', blog_url)
    if match:
        return match.group(1)
    return None

def get_qmd_path_from_url(blog_url, base_dir):
    """Convert blog URL to local .qmd file path"""
    # Extract the path component from URL
    match = re.search(r'/tours/([\d\-\w]+)/?', blog_url)
    if match:
        folder_name = match.group(1)
        qmd_path = os.path.join(base_dir, 'tours', folder_name, 'index.qmd')
        return qmd_path if os.path.exists(qmd_path) else None
    return None

def create_hiking_map_link(hike_number, trail_name):
    """Create the hiking map link HTML/Markdown"""
    link_text = f"View Hike #{hike_number}: {trail_name} on the Interactive Hiking Map"
    
    # Create a styled link block
    link_html = f'''
<div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
  <p style="margin: 0; font-size: 16px;">
    🥾 <a href="/hiking_map.html#{hike_number}" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">
      {link_text}
    </a> 🗺️
  </p>
</div>
'''
    return link_html

def check_existing_link(content, hike_number):
    """Check if hiking map link already exists in content"""
    # Check for various patterns that might indicate existing link
    patterns = [
        f'hiking_map.html#{hike_number}',
        f'Hike #{hike_number}',
        'Interactive Hiking Map'
    ]
    
    for pattern in patterns:
        if pattern in content:
            return True
    return False

def add_link_to_qmd(qmd_path, hike_number, trail_name):
    """Add hiking map link to a .qmd file if not already present"""
    if not os.path.exists(qmd_path):
        return False, f"File not found: {qmd_path}"
    
    with open(qmd_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if link already exists
    if check_existing_link(content, hike_number):
        return False, f"Link already exists in {qmd_path}"
    
    # Create the link
    hiking_map_link = create_hiking_map_link(hike_number, trail_name)
    
    # Find best position to insert link
    # Strategy: Add after the main content, before any closing markers
    # Look for the last image or paragraph before the end
    
    # Split content into lines
    lines = content.split('\n')
    
    # Find a good insertion point (after last image or main content)
    insert_position = len(lines)
    
    # Look for last image reference
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip().startswith('![') or lines[i].strip().startswith('<img'):
            insert_position = i + 1
            break
        # Or after the last non-empty line of content
        elif lines[i].strip() and not lines[i].startswith('#'):
            insert_position = i + 1
            break
    
    # Insert the link
    lines.insert(insert_position, hiking_map_link)
    
    # Write back to file
    new_content = '\n'.join(lines)
    with open(qmd_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True, f"Added link to {qmd_path}"

def process_trail_names(csv_path, base_dir):
    """Process trail_names.csv and add links to corresponding blog posts"""
    results = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            hike_number = row.get('Hike_Number', '')
            trail_name = row.get('Trail_Name', '')
            blog_url = row.get('Blog_URL', '')
            
            # Skip if no blog URL
            if not blog_url:
                continue
            
            # Get the local .qmd file path
            qmd_path = get_qmd_path_from_url(blog_url, base_dir)
            
            if not qmd_path:
                results.append(f"Could not find .qmd for: {blog_url}")
                continue
            
            # Use trail name if available, otherwise use original name
            display_name = trail_name if trail_name else row.get('Original_Name', 'Unknown Trail')
            
            # Add link to the .qmd file
            success, message = add_link_to_qmd(qmd_path, hike_number, display_name)
            results.append(message)
    
    return results

def main():
    """Main function to run the script"""
    # Set up paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(os.path.dirname(script_dir))  # Go up to tourwithmark_2025
    hiking_project_dir = os.path.join(project_dir, 'hiking-map-project')
    trail_names_path = os.path.join(hiking_project_dir, 'data', 'trail_names.csv')
    
    print("🥾 Adding Hiking Map Links to Blog Posts")
    print("=" * 50)
    print(f"Reading from: {trail_names_path}")
    print(f"Base directory: {project_dir}")
    print()
    
    # Process the CSV and add links
    results = process_trail_names(trail_names_path, project_dir)
    
    # Print results
    print("Results:")
    print("-" * 50)
    for result in results:
        print(f"  {result}")
    
    print()
    print("✅ Process complete!")
    print()
    print("Note: Run 'quarto render' to rebuild the site with the new links.")

if __name__ == "__main__":
    main()