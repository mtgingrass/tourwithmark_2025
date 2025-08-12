#!/usr/bin/env python3
"""
Remove hiking map links from blog posts
Useful for cleanup or when you want to regenerate links
"""

import os
import re
import csv

def get_qmd_path_from_url(blog_url, base_dir):
    """Convert blog URL to local .qmd file path"""
    match = re.search(r'/tours/([\d\-\w]+)/?', blog_url)
    if match:
        folder_name = match.group(1)
        qmd_path = os.path.join(base_dir, 'tours', folder_name, 'index.qmd')
        return qmd_path if os.path.exists(qmd_path) else None
    return None

def remove_hiking_map_link(qmd_path):
    """Remove hiking map link div from a .qmd file"""
    if not os.path.exists(qmd_path):
        return False, f"File not found: {qmd_path}"
    
    with open(qmd_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match the hiking map link div
    pattern = r'<div style="background-color: #f0f8ff;[^>]*>.*?</div>\s*'
    
    # Check if pattern exists
    if not re.search(pattern, content, re.DOTALL):
        return False, f"No hiking map link found in {qmd_path}"
    
    # Remove the link
    new_content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Write back to file
    with open(qmd_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return True, f"Removed link from {qmd_path}"

def process_trail_names(csv_path, base_dir):
    """Process trail_names.csv and remove links from corresponding blog posts"""
    results = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            blog_url = row.get('Blog_URL', '')
            
            # Skip if no blog URL
            if not blog_url:
                continue
            
            # Get the local .qmd file path
            qmd_path = get_qmd_path_from_url(blog_url, base_dir)
            
            if not qmd_path:
                results.append(f"Could not find .qmd for: {blog_url}")
                continue
            
            # Remove link from the .qmd file
            success, message = remove_hiking_map_link(qmd_path)
            results.append(message)
    
    return results

def main():
    """Main function to run the script"""
    # Set up paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(os.path.dirname(script_dir))
    hiking_project_dir = os.path.join(project_dir, 'hiking-map-project')
    trail_names_path = os.path.join(hiking_project_dir, 'data', 'trail_names.csv')
    
    print("🗑️  Removing Hiking Map Links from Blog Posts")
    print("=" * 50)
    print(f"Reading from: {trail_names_path}")
    print(f"Base directory: {project_dir}")
    print()
    
    # Process the CSV and remove links
    results = process_trail_names(trail_names_path, project_dir)
    
    # Print results
    print("Results:")
    print("-" * 50)
    for result in results:
        print(f"  {result}")
    
    print()
    print("✅ Process complete!")

if __name__ == "__main__":
    main()