#!/usr/bin/env python3
"""
Update hiking map with new Strava data
This script extracts new hiking activities and regenerates the map
"""

import os
import sys
import csv
import shutil
from datetime import datetime

# Add parent directory to path to import plot_hikes
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import plot_hikes


def update_hiking_data():
    """Extract hiking activities from latest Strava export and update project"""
    
    print("=" * 60)
    print("HIKING MAP UPDATER")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Define paths
    strava_dir = '/Users/markgingrass/Downloads/strava-data'
    project_dir = os.path.join(strava_dir, 'hiking-map-project')
    data_dir = os.path.join(project_dir, 'data')
    activities_dir = os.path.join(data_dir, 'activities')
    
    # Source files
    source_csv = os.path.join(strava_dir, 'activities.csv')
    source_activities = os.path.join(strava_dir, 'activities')
    
    if not os.path.exists(source_csv):
        print(f"ERROR: Could not find {source_csv}")
        print("Please ensure your Strava export is in the correct location")
        return False
    
    # Backup existing data
    backup_dir = os.path.join(project_dir, f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
    if os.path.exists(os.path.join(data_dir, 'hiking_activities.csv')):
        print(f"Creating backup in {backup_dir}")
        shutil.copytree(data_dir, backup_dir)
        print("Backup created successfully")
    
    # Clear existing activity files
    if os.path.exists(activities_dir):
        shutil.rmtree(activities_dir)
    os.makedirs(activities_dir, exist_ok=True)
    
    # Extract hiking activities
    print("\nExtracting hiking activities from Strava data...")
    
    hiking_count = 0
    total_count = 0
    hiking_rows = []
    
    with open(source_csv, 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            total_count += 1
            if len(row) > 3 and 'hike' in row[3].lower():
                hiking_rows.append(row)
                hiking_count += 1
    
    print(f"Found {hiking_count} hiking activities out of {total_count} total activities")
    
    # Write new hiking CSV
    hiking_csv = os.path.join(data_dir, 'hiking_activities.csv')
    with open(hiking_csv, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(hiking_rows)
    
    print(f"Wrote {hiking_count} hiking activities to CSV")
    
    # Copy activity files
    print("\nCopying activity files...")
    copied = 0
    missing = 0
    
    for row in hiking_rows:
        if len(row) > 12 and row[12]:  # Filename column
            filename = row[12]
            source_path = os.path.join(strava_dir, filename)
            
            if os.path.exists(source_path):
                dest_path = os.path.join(activities_dir, os.path.basename(filename))
                shutil.copy2(source_path, dest_path)
                copied += 1
            else:
                missing += 1
                print(f"  Warning: Could not find {filename}")
    
    print(f"Copied {copied} activity files")
    if missing > 0:
        print(f"Missing {missing} files (this is normal for very old activities)")
    
    # Regenerate the map
    print("\n" + "=" * 60)
    print("REGENERATING INTERACTIVE MAP")
    print("=" * 60)
    
    map_path = plot_hikes.create_interactive_map(data_dir)
    stats = plot_hikes.create_summary_stats(data_dir)
    
    # Compare with backup if it exists
    if os.path.exists(backup_dir):
        old_csv = os.path.join(backup_dir, 'hiking_activities.csv')
        with open(old_csv, 'r') as f:
            old_count = sum(1 for line in f) - 1  # Subtract header
        
        new_hikes = hiking_count - old_count
        if new_hikes > 0:
            print(f"\n🎉 Added {new_hikes} new hikes to your map!")
        elif new_hikes == 0:
            print("\n✅ Map is up to date (no new hikes found)")
        else:
            print(f"\n⚠️  Map has {abs(new_hikes)} fewer hikes than before")
    
    print("\n" + "=" * 60)
    print("UPDATE COMPLETE!")
    print("=" * 60)
    print(f"\n📍 Open your updated map:")
    print(f"   open {map_path}")
    
    return True


if __name__ == "__main__":
    success = update_hiking_data()
    sys.exit(0 if success else 1)