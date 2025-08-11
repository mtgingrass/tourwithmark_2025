#!/usr/bin/env python3
"""
Interactive map plotting for Strava hiking activities
Creates an interactive map with all hiking routes
"""

import os
import gzip
import gpxpy
import folium
from folium import plugins
import pandas as pd
import csv
from datetime import datetime
from fitparse import FitFile
import json


def parse_gpx_file(filepath):
    """Parse GPX file and extract coordinates"""
    try:
        with open(filepath, 'r') as gpx_file:
            gpx = gpxpy.parse(gpx_file)
            points = []
            for track in gpx.tracks:
                for segment in track.segments:
                    for point in segment.points:
                        points.append([point.latitude, point.longitude])
            return points
    except Exception as e:
        print(f"Error parsing GPX {filepath}: {e}")
        return []


def parse_fit_file(filepath):
    """Parse FIT file and extract coordinates"""
    try:
        # Handle .gz compressed files
        if filepath.endswith('.gz'):
            with gzip.open(filepath, 'rb') as f:
                fitfile = FitFile(f.read())
        else:
            fitfile = FitFile(filepath)
        
        points = []
        for record in fitfile.get_messages('record'):
            lat = None
            lon = None
            for data in record:
                if data.name == 'position_lat' and data.value:
                    lat = data.value * (180.0 / 2**31)
                elif data.name == 'position_long' and data.value:
                    lon = data.value * (180.0 / 2**31)
            
            if lat and lon:
                points.append([lat, lon])
        
        return points
    except Exception as e:
        print(f"Error parsing FIT {filepath}: {e}")
        return []


def create_interactive_map(data_dir):
    """Create interactive map with all hiking routes"""
    
    # Read hiking activities CSV
    csv_path = os.path.join(data_dir, 'hiking_activities.csv')
    activities_dir = os.path.join(data_dir, 'activities')
    
    # Parse CSV to get activity metadata
    activities = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            activities.append({
                'id': row['Activity ID'],
                'date': row['Activity Date'],
                'name': row['Activity Name'],
                'distance': row['Distance'],
                'filename': os.path.basename(row['Filename']) if row['Filename'] else None
            })
    
    print(f"Found {len(activities)} hiking activities")
    
    # Create base map (centered on approximate average location)
    # We'll adjust center after loading first track
    base_map = folium.Map(
        location=[40.0, -105.0],  # Default to Colorado area
        zoom_start=10,
        tiles='OpenStreetMap',
        prefer_canvas=True  # Better performance with many tracks
    )
    
    # Add different tile layers (OpenStreetMap is already added as default)
    folium.TileLayer('Stamen Terrain', name='Terrain', show=False).add_to(base_map)
    folium.TileLayer('Stamen Toner', name='Toner', show=False).add_to(base_map)
    folium.TileLayer('CartoDB positron', name='Light', show=False).add_to(base_map)
    
    # Track statistics
    total_tracks = 0
    failed_tracks = 0
    all_points = []
    
    # Color palette for different hikes
    colors = ['red', 'blue', 'green', 'purple', 'orange', 'darkred', 
              'lightred', 'beige', 'darkblue', 'darkgreen', 'cadetblue', 
              'darkpurple', 'white', 'pink', 'lightblue', 'lightgreen', 
              'gray', 'black', 'lightgray']
    
    # Process each activity
    for idx, activity in enumerate(activities):
        if not activity['filename']:
            continue
            
        filepath = os.path.join(activities_dir, activity['filename'])
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            failed_tracks += 1
            continue
        
        # Parse file based on extension
        points = []
        if filepath.endswith('.gpx'):
            points = parse_gpx_file(filepath)
        elif filepath.endswith('.fit.gz') or filepath.endswith('.fit'):
            points = parse_fit_file(filepath)
        
        if points:
            total_tracks += 1
            all_points.extend(points)
            
            # Create polyline for this hike
            color = colors[idx % len(colors)]
            
            # Add the track to map
            folium.PolyLine(
                points,
                color=color,
                weight=3,
                opacity=0.7,
                popup=folium.Popup(
                    f"<b>{activity['name']}</b><br>"
                    f"Date: {activity['date']}<br>"
                    f"Distance: {activity['distance']} km",
                    max_width=300
                ),
                tooltip=f"{activity['name']} ({activity['date']})"
            ).add_to(base_map)
            
            # Add start marker for each hike
            if points:
                folium.Marker(
                    points[0],
                    popup=f"Start: {activity['name']}",
                    tooltip=activity['name'],
                    icon=folium.Icon(color=color, icon='play', prefix='fa')
                ).add_to(base_map)
    
    # Adjust map bounds to show all tracks
    if all_points:
        bounds = [[min(p[0] for p in all_points), min(p[1] for p in all_points)],
                  [max(p[0] for p in all_points), max(p[1] for p in all_points)]]
        base_map.fit_bounds(bounds)
    
    # Add layer control
    folium.LayerControl().add_to(base_map)
    
    # Add fullscreen button
    plugins.Fullscreen().add_to(base_map)
    
    # Add measurement tool
    plugins.MeasureControl().add_to(base_map)
    
    # Add minimap
    minimap = plugins.MiniMap(toggle_display=True)
    base_map.add_child(minimap)
    
    # Save map
    output_path = os.path.join(os.path.dirname(data_dir), 'hiking_map.html')
    base_map.save(output_path)
    
    print(f"\nMap Statistics:")
    print(f"Total activities in CSV: {len(activities)}")
    print(f"Successfully plotted: {total_tracks}")
    print(f"Failed to process: {failed_tracks}")
    print(f"\nInteractive map saved to: {output_path}")
    print(f"Open the file in your web browser to view the interactive map!")
    
    return output_path


def create_summary_stats(data_dir):
    """Create summary statistics of hiking activities"""
    csv_path = os.path.join(data_dir, 'hiking_activities.csv')
    
    # Read CSV into pandas
    df = pd.read_csv(csv_path)
    
    # Convert date column to datetime
    df['Activity Date'] = pd.to_datetime(df['Activity Date'])
    
    # Calculate statistics
    stats = {
        'Total Hikes': len(df),
        'Total Distance (km)': df['Distance'].sum(),
        'Average Distance (km)': df['Distance'].mean(),
        'Longest Hike (km)': df['Distance'].max(),
        'Total Elevation Gain (m)': df['Elevation Gain'].sum() if 'Elevation Gain' in df.columns else 'N/A',
        'Date Range': f"{df['Activity Date'].min().strftime('%Y-%m-%d')} to {df['Activity Date'].max().strftime('%Y-%m-%d')}"
    }
    
    # Save stats to JSON
    stats_path = os.path.join(os.path.dirname(data_dir), 'hiking_stats.json')
    with open(stats_path, 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    
    print("\nHiking Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print(f"\nStatistics saved to: {stats_path}")
    
    return stats


if __name__ == "__main__":
    # Set data directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    data_dir = os.path.join(project_dir, 'data')
    
    print("Creating interactive hiking map...")
    print(f"Data directory: {data_dir}")
    
    # Create the interactive map
    map_path = create_interactive_map(data_dir)
    
    # Generate statistics
    stats = create_summary_stats(data_dir)
    
    print("\n✅ Project complete!")
    print(f"Open '{map_path}' in your browser to explore all your hikes on an interactive map!")