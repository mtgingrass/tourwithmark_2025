#!/usr/bin/env python3
"""
Generate initial trail names mapping file with sequential numbering
"""

import csv
import os
from datetime import datetime

def generate_trail_mapping():
    """Generate trail_names.csv from hiking_activities.csv"""
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    input_path = os.path.join(project_dir, 'data', 'hiking_activities.csv')
    output_path = os.path.join(project_dir, 'data', 'trail_names.csv')
    
    # Read existing activities
    activities = []
    with open(input_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            activities.append({
                'id': row['Activity ID'],
                'date': row['Activity Date'],
                'name': row['Activity Name'],
                'distance': row['Distance'],
                'elevation': row.get('Elevation Gain', '')
            })
    
    # Sort by date to ensure chronological numbering
    # Parse dates properly for sorting
    for activity in activities:
        try:
            # Parse the date string
            date_str = activity['date'].split(',')[0:2]  # Get "Nov 25" and " 2021"
            date_str = ','.join(date_str)
            activity['date_parsed'] = datetime.strptime(date_str.strip(), '%b %d, %Y')
        except:
            # Fallback to original string if parsing fails
            activity['date_parsed'] = activity['date']
    
    # Sort by parsed date
    activities.sort(key=lambda x: x['date_parsed'])
    
    # Known trail names (pre-populate these)
    known_trails = {
        '6617019861': 'El Tigre Waterfall',
        '7398547269': 'Rainbow Falls',  # You mentioned Rainbow Falls
        '7416650262': 'Profile Trail, Grandfather Mtn.'  # Part of Profile Trail
    }
    
    # Create mapping with sequential numbers
    mappings = []
    for i, activity in enumerate(activities, 1):
        # Check if we have a known trail name
        trail_name = known_trails.get(activity['id'], '')
        
        # Convert distance to km for reference
        try:
            distance_m = float(activity['distance'])
            distance_km = round(distance_m / 1000.0, 1)
        except:
            distance_km = 'N/A'
        
        mappings.append({
            'Hike_Number': i,
            'Activity_ID': activity['id'],
            'Date': activity['date'].split(',')[0] + ',' + activity['date'].split(',')[1],  # Shorter date
            'Original_Name': activity['name'],
            'Trail_Name': trail_name,
            'Distance_km': distance_km,
            'Location': '',
            'Notes': ''
        })
    
    # Write to CSV
    with open(output_path, 'w', newline='') as f:
        fieldnames = ['Hike_Number', 'Activity_ID', 'Date', 'Original_Name', 
                      'Trail_Name', 'Distance_km', 'Location', 'Notes', 'Blog_URL']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(mappings)
    
    print(f"Generated trail mapping file: {output_path}")
    print(f"Total hikes: {len(mappings)}")
    print(f"Pre-populated trail names: {len([m for m in mappings if m['Trail_Name']])}")
    print("\nFirst 5 entries:")
    for m in mappings[:5]:
        print(f"  #{m['Hike_Number']}: {m['Date']} - {m['Original_Name']} ({m['Distance_km']}km)")
    
    return output_path

if __name__ == "__main__":
    generate_trail_mapping()