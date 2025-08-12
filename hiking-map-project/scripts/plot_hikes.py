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
from folium import Element


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
    trail_names_path = os.path.join(data_dir, 'trail_names.csv')
    
    # Read trail names mapping if it exists
    trail_mapping = {}
    if os.path.exists(trail_names_path):
        with open(trail_names_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                trail_mapping[row['Activity_ID']] = {
                    'number': row['Hike_Number'],
                    'trail_name': row['Trail_Name'],
                    'original_name': row['Original_Name']
                }
        print(f"Loaded trail name mappings for {len(trail_mapping)} hikes")
    
    # Parse CSV to get activity metadata
    activities = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            activity_id = row['Activity ID']
            
            # Get mapped trail info if available
            mapped_info = trail_mapping.get(activity_id, {})
            hike_number = mapped_info.get('number', '')
            trail_name = mapped_info.get('trail_name', '')
            
            # Create display name with number
            if hike_number:
                if trail_name:
                    display_name = f"#{hike_number}: {trail_name}"
                else:
                    display_name = f"#{hike_number}: {row['Activity Name']}"
            else:
                display_name = row['Activity Name']
            
            activities.append({
                'id': activity_id,
                'date': row['Activity Date'],
                'name': row['Activity Name'],
                'display_name': display_name,
                'hike_number': hike_number,
                'trail_name': trail_name,
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
        prefer_canvas=True,  # Better performance with many tracks
        zoom_control=True,
        scrollWheelZoom=True
    )
    
    # Add different tile layers (OpenStreetMap is already added as default)
    folium.TileLayer('Stamen Terrain', name='Terrain', show=False).add_to(base_map)
    folium.TileLayer('Stamen Toner', name='Toner', show=False).add_to(base_map)
    folium.TileLayer('CartoDB positron', name='Light', show=False).add_to(base_map)
    
    # Track statistics
    total_tracks = 0
    failed_tracks = 0
    all_points = []
    markers_data = []  # Store marker data for zoom functionality
    
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
            
            # Format date and distance for display
            # Parse date string and format to just show date without time
            try:
                date_obj = pd.to_datetime(activity['date'])
                formatted_date = date_obj.strftime('%B %d, %Y')  # e.g., "May 12, 2024"
            except:
                formatted_date = activity['date']  # fallback to original if parsing fails
            
            # Convert distance from meters to kilometers and round to 1 decimal place
            try:
                distance_meters = float(activity['distance'])
                distance_km = distance_meters / 1000.0
                distance_rounded = round(distance_km, 1)
            except:
                distance_rounded = activity['distance']  # fallback to original if conversion fails
            
            # Add the track to map
            folium.PolyLine(
                points,
                color=color,
                weight=3,
                opacity=0.7,
                popup=folium.Popup(
                    f"<b>{activity['display_name']}</b><br>"
                    f"Date: {formatted_date}<br>"
                    f"Distance: {distance_rounded} km",
                    max_width=300
                ),
                tooltip=f"{activity['display_name']}"
            ).add_to(base_map)
            
            # Add start marker for each hike
            if points:
                # Calculate bounds for this hike
                hike_bounds = [[min(p[0] for p in points), min(p[1] for p in points)],
                              [max(p[0] for p in points), max(p[1] for p in points)]]
                
                marker = folium.Marker(
                    points[0],
                    popup=f"{activity['display_name']}",
                    tooltip=activity['display_name'],
                    icon=folium.Icon(color=color, icon='play', prefix='fa')
                )
                marker.add_to(base_map)
                
                # Store marker data for zoom functionality
                markers_data.append({
                    'location': points[0],
                    'bounds': hike_bounds
                })
    
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
    
    # Add custom JavaScript for zoom-on-click functionality
    zoom_script = """
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for map to be fully loaded
        setTimeout(function() {
            // Get reference to the map
            var mapId = document.querySelector('.folium-map').id;
            var map = window[mapId];
            
            // Add click handler to all markers
            map.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    layer.on('click', function(e) {
                        // Get current zoom level
                        var currentZoom = map.getZoom();
                        var targetZoom = 14;  // Target zoom level for detail view
                        
                        // Only zoom in if we're not already at or beyond target zoom
                        if (currentZoom < targetZoom) {
                            map.setView(e.latlng, targetZoom, {
                                animate: true,
                                duration: 0.5
                            });
                        } else {
                            // If already zoomed in, just center on the marker
                            map.panTo(e.latlng, {
                                animate: true,
                                duration: 0.5
                            });
                        }
                        
                        // Prevent event from bubbling (which could cause zoom out)
                        L.DomEvent.stopPropagation(e);
                    });
                }
            });
        }, 1000);
    });
    </script>
    """
    
    # Add the script to the map
    base_map.get_root().html.add_child(Element(zoom_script))
    
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