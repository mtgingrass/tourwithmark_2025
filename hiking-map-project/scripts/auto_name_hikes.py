#!/usr/bin/env python3
"""
Auto-name unnamed hikes using GPS midpoint + Overpass API (trail names)
with Nominatim fallback (park/nature area names).

Usage:
    python3 scripts/auto_name_hikes.py          # preview only
    python3 scripts/auto_name_hikes.py --apply  # write to trail_names.csv
"""

import csv
import gzip
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, 'data')
TRAIL_NAMES_CSV = os.path.join(DATA_DIR, 'trail_names.csv')
HIKING_CSV = os.path.join(DATA_DIR, 'hiking_activities.csv')
ACTIVITIES_DIR = os.path.join(DATA_DIR, 'activities')

OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'
USER_AGENT = 'tourwithmark-hiking-map/1.0 (contact via tourwithmark.com)'


# ---------------------------------------------------------------------------
# GPS parsing
# ---------------------------------------------------------------------------

def get_midpoint_coords(activity_id, filename):
    """Return (lat, lon) at the midpoint of the track."""
    fname = os.path.basename(filename)
    path = os.path.join(ACTIVITIES_DIR, fname)
    if not os.path.exists(path):
        return None
    try:
        points = []
        if path.endswith('.gpx'):
            import gpxpy
            with open(path) as f:
                gpx = gpxpy.parse(f)
            for track in gpx.tracks:
                for seg in track.segments:
                    for p in seg.points:
                        points.append((p.latitude, p.longitude))
        elif path.endswith('.fit.gz'):
            from fitparse import FitFile
            with gzip.open(path, 'rb') as gz:
                fit = FitFile(gz.read())
            for record in fit.get_messages('record'):
                vals = {d.name: d.value for d in record}
                if vals.get('position_lat') and vals.get('position_long'):
                    lat = vals['position_lat'] * (180 / 2**31)
                    lon = vals['position_long'] * (180 / 2**31)
                    points.append((lat, lon))
        if points:
            mid = points[len(points) // 2]
            return mid
    except Exception as e:
        pass
    return None


# ---------------------------------------------------------------------------
# Overpass API — find named trails within radius
# ---------------------------------------------------------------------------

def query_overpass_trails(lat, lon, radius=500):
    """Return list of nearby named hiking/foot paths, best match first."""
    query = f"""
[out:json][timeout:10];
(
  way["highway"~"path|footway|track"]["name"](around:{radius},{lat},{lon});
  relation["route"="hiking"]["name"](around:{radius},{lat},{lon});
);
out tags;
"""
    data = urllib.parse.urlencode({'data': query}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data,
                                  headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            result = json.loads(r.read())
        names = []
        for el in result.get('elements', []):
            name = el.get('tags', {}).get('name', '').strip()
            if name and name not in names:
                names.append(name)
        return names
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Nominatim — park / nature area fallback
# ---------------------------------------------------------------------------

def query_nominatim(lat, lon):
    """Return a park/nature area name near the coordinates."""
    params = f'lat={lat}&lon={lon}&format=json&zoom=14&namedetails=1'
    url = f'{NOMINATIM_URL}?{params}'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        addr = data.get('address', {})
        # Prefer leisure/nature/tourism over generic place names
        for key in ['leisure', 'natural', 'tourism', 'park',
                    'suburb', 'village', 'town']:
            if addr.get(key):
                return addr[key]
        # Fall back to the top-level name of the feature
        name = data.get('name', '')
        if name:
            return name
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------

def suggest_name(lat, lon, trail_only=False):
    """Return (suggested_name, source) for a coordinate."""
    # 1. Try Overpass for trail names (500m radius first, then 1km)
    for radius in (500, 1000):
        trails = query_overpass_trails(lat, lon, radius)
        if trails:
            return trails[0], f'trail (Overpass, {radius}m)'
        time.sleep(0.5)

    if trail_only:
        return None, 'no trail found'

    # 2. Fall back to Nominatim park/area name
    time.sleep(0.5)
    nom = query_nominatim(lat, lon)
    if nom:
        return nom, 'area (Nominatim)'

    return None, 'no result'


def load_activity_filenames():
    with open(HIKING_CSV, newline='') as f:
        return {r['Activity ID']: r['Filename'] for r in csv.DictReader(f)}


def load_trail_names():
    with open(TRAIL_NAMES_CSV, newline='') as f:
        return list(csv.DictReader(f))


def save_trail_names(rows):
    fieldnames = ['Hike_Number', 'Activity_ID', 'Date', 'Original_Name',
                  'Trail_Name', 'Distance_km', 'Location', 'Notes', 'Blog_URL']
    with open(TRAIL_NAMES_CSV, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)


def main():
    apply = '--apply' in sys.argv

    print('=' * 60)
    print('AUTO-NAMING HIKES')
    print(f'Mode: {"APPLY (will write changes)" if apply else "PREVIEW (dry run)"}')
    print('=' * 60)

    trails = load_trail_names()
    activities = load_activity_filenames()

    unnamed = [t for t in trails if not t['Trail_Name'].strip()]
    print(f'Unnamed hikes: {len(unnamed)} / {len(trails)}')
    print()

    suggestions = []

    for i, trail in enumerate(unnamed):
        aid = trail['Activity_ID']
        fname = activities.get(aid, '')
        num = trail['Hike_Number']
        date = trail['Date']
        orig = trail['Original_Name']

        print(f'[{i+1}/{len(unnamed)}] #{num} {date} — {orig}', end='  ', flush=True)

        if not fname:
            print('no filename, skipping')
            continue

        coords = get_midpoint_coords(aid, fname)
        if not coords:
            print('no GPS data, skipping')
            continue

        lat, lon = coords
        trail_only = '--trail-only' in sys.argv or apply  # apply mode always uses trail-only
        name, source = suggest_name(lat, lon, trail_only=trail_only)
        time.sleep(1.1)  # Nominatim rate limit

        if name:
            print(f'→ "{name}"  [{source}]')
            suggestions.append((trail, name))
        else:
            print('→ no suggestion')

    print()
    print(f'Suggestions found: {len(suggestions)} / {len(unnamed)}')

    if not suggestions:
        print('Nothing to update.')
        return

    print()
    print('Summary of suggestions:')
    for trail, name in suggestions:
        print(f'  #{trail["Hike_Number"]:>3} {trail["Date"]:<15} {trail["Original_Name"]:<35} → {name}')

    if apply:
        # Build a lookup of suggestions
        suggestion_map = {t['Hike_Number']: name for t, name in suggestions}
        updated = 0
        for row in trails:
            if row['Hike_Number'] in suggestion_map and not row['Trail_Name'].strip():
                row['Trail_Name'] = suggestion_map[row['Hike_Number']]
                updated += 1
        save_trail_names(trails)
        print(f'\n✅ Updated {updated} hike names in trail_names.csv')
    else:
        print()
        print('Run with --apply to write these names to trail_names.csv')


if __name__ == '__main__':
    main()
