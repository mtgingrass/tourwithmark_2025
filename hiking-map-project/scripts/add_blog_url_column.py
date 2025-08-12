#!/usr/bin/env python3
"""
Add Blog_URL column to trail_names.csv
"""

import csv
import os

def add_blog_url_column():
    """Add Blog_URL column to existing trail_names.csv"""
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    csv_path = os.path.join(project_dir, 'data', 'trail_names.csv')
    
    # Read existing data
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        existing_fieldnames = reader.fieldnames
    
    # Check if Blog_URL already exists
    if 'Blog_URL' in existing_fieldnames:
        print("Blog_URL column already exists!")
        return
    
    # Add Blog_URL field
    fieldnames = list(existing_fieldnames) + ['Blog_URL']
    
    # Add empty Blog_URL to each row
    for row in rows:
        row['Blog_URL'] = ''
    
    # Write back with new column
    with open(csv_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"Added Blog_URL column to {csv_path}")
    print(f"Total rows: {len(rows)}")

if __name__ == "__main__":
    add_blog_url_column()