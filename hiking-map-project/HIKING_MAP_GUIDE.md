# Hiking Map Project Guide

## Project Overview
This project visualizes all hiking activities from Strava data on an interactive map.

## Project Structure
```
hiking-map-project/
├── data/
│   ├── hiking_activities.csv    # Extracted hiking data
│   └── activities/              # GPX and FIT.gz files for each hike
├── scripts/
│   └── plot_hikes.py           # Main script to generate the map
├── hiking_map.html              # Interactive map output
├── hiking_stats.json            # Statistics summary
└── requirements.txt             # Python dependencies
```

## Current Statistics
- **Total Hikes**: 87
- **Total Distance**: 656.26 km
- **Average Distance**: 7.54 km
- **Longest Hike**: 22.6 km
- **Total Elevation Gain**: 25,749 m
- **Date Range**: 2021-11-25 to 2025-08-09

## How to Update the Map with New Hikes

### Step 1: Export New Strava Data
1. Go to Strava Settings > My Account > Download or Delete Your Data
2. Request your data archive
3. Extract the downloaded archive

### Step 2: Update the Project
When you have new Strava data, follow these steps:

1. **Place new data in the parent directory**: `/Users/markgingrass/Downloads/strava-data/`
2. **Run the update command**:
   ```bash
   cd /Users/markgingrass/Downloads/strava-data/
   python3 hiking-map-project/scripts/update_hikes.py
   ```

Or ask Claude to run this update process:
- "Update my hiking map with the latest Strava data"
- "I've added new hikes, please regenerate the map"

### Step 3: View Updated Map
Open the updated map:
```bash
open /Users/markgingrass/Downloads/strava-data/hiking-map-project/hiking_map.html
```

## Key Files and Their Purpose

### `plot_hikes.py`
Main script that:
- Reads hiking activities from CSV
- Parses GPX and FIT.gz files for GPS coordinates
- Creates interactive Folium map with all tracks
- Generates statistics summary

### `hiking_activities.csv`
Contains all hiking activities with:
- Activity ID, Date, Name
- Distance, Elevation gain
- File references to GPX/FIT files

### `hiking_map.html`
Interactive map featuring:
- All hiking tracks in different colors
- Clickable tracks showing activity details
- Multiple map layers (defaulting to OpenStreetMap)
- Fullscreen mode
- Measurement tools
- Minimap

## Python Dependencies
- folium==0.14.0
- gpxpy==1.5.0
- pandas==2.0.3
- fitparse==1.2.0
- plotly==5.17.0

## Troubleshooting

### Missing Activities
If some hikes are missing:
1. Check that they're classified as "Hike" in Strava
2. Verify the activity files exist in `activities/` folder
3. Check for parsing errors in the script output

### Map Not Loading
1. Ensure all dependencies are installed: `pip install -r requirements.txt`
2. Check that hiking_map.html was generated successfully
3. Try opening in a different browser

### File Format Issues
- **GPX files**: Standard GPS exchange format, well-supported
- **FIT.gz files**: Compressed Garmin format, automatically decompressed
- If a file fails to parse, it will be skipped with an error message

## Quick Commands Reference

```bash
# Regenerate map from existing data
cd /Users/markgingrass/Downloads/strava-data/
python3 hiking-map-project/scripts/plot_hikes.py

# View current statistics
cat hiking-map-project/hiking_stats.json

# Count hiking activities
grep -i hike activities.csv | wc -l

# Open the map
open hiking-map-project/hiking_map.html
```

## Map Customization Notes
- Default view: OpenStreetMap (standard street map)
- Available layers: Terrain, Toner (B&W), Light (minimal)
- Colors cycle through 19 different options for track distinction
- Start markers use matching colors with play icon

## Future Enhancement Ideas
- Filter by date range
- Show elevation profiles
- Calculate total time spent hiking
- Heat map of most hiked areas
- Export routes for GPS devices
- Photo integration from media folder

---
*Last Updated: Generated from Strava export*
*Project Location: `/Users/markgingrass/Downloads/strava-data/hiking-map-project/`*