#!/usr/bin/env python3
"""
Add new hikes from a Strava export folder without duplicates.
Usage: python3 scripts/add_new_hikes.py <path_to_export_folder>
"""

import csv
import os
import shutil
import sys

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, 'data')
HIKING_CSV = os.path.join(DATA_DIR, 'hiking_activities.csv')
TRAIL_NAMES_CSV = os.path.join(DATA_DIR, 'trail_names.csv')
ACTIVITIES_DIR = os.path.join(DATA_DIR, 'activities')


def load_existing_ids():
    with open(HIKING_CSV, newline='') as f:
        reader = csv.DictReader(f)
        return {row['Activity ID'] for row in reader}


def load_new_hikes(export_dir):
    csv_path = os.path.join(export_dir, 'activities.csv')
    with open(csv_path, newline='') as f:
        reader = csv.DictReader(f)
        hikes = [row for row in reader if 'hike' in row['Activity Type'].lower()]
    return hikes


def next_hike_number():
    with open(TRAIL_NAMES_CSV, newline='') as f:
        rows = list(csv.DictReader(f))
    return max(int(r['Hike_Number']) for r in rows) + 1


def append_to_hiking_csv(new_hikes):
    with open(HIKING_CSV, newline='') as f:
        fieldnames = csv.DictReader(f).fieldnames
    with open(HIKING_CSV, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        for hike in new_hikes:
            writer.writerow(hike)


def append_to_trail_names(new_hikes, start_number):
    fieldnames = ['Hike_Number', 'Activity_ID', 'Date', 'Original_Name',
                  'Trail_Name', 'Distance_km', 'Location', 'Notes', 'Blog_URL']
    with open(TRAIL_NAMES_CSV, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        for i, hike in enumerate(new_hikes):
            dist_m = float(hike['Distance']) if hike['Distance'] else 0
            dist_km = round(dist_m / 1000, 1)
            # Parse date - take just the date portion
            date_raw = hike['Activity Date']
            date_short = date_raw[:12].strip().rstrip(',')
            writer.writerow({
                'Hike_Number': start_number + i,
                'Activity_ID': hike['Activity ID'],
                'Date': date_short,
                'Original_Name': hike['Activity Name'],
                'Trail_Name': '',
                'Distance_km': dist_km,
                'Location': '',
                'Notes': '',
                'Blog_URL': '',
            })


def copy_gps_files(new_hikes, export_dir):
    copied = 0
    missing = 0
    for hike in new_hikes:
        fname = os.path.basename(hike['Filename'])
        src = os.path.join(export_dir, fname)
        dst = os.path.join(ACTIVITIES_DIR, fname)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            copied += 1
        else:
            print(f'  WARNING: GPS file not found: {fname}')
            missing += 1
    return copied, missing


def main():
    if len(sys.argv) < 2:
        print('Usage: python3 scripts/add_new_hikes.py <path_to_export_folder>')
        sys.exit(1)

    export_dir = sys.argv[1]
    if not os.path.isdir(export_dir):
        print(f'ERROR: Directory not found: {export_dir}')
        sys.exit(1)

    print('=' * 60)
    print('ADDING NEW HIKES (deduplicated)')
    print('=' * 60)

    existing_ids = load_existing_ids()
    print(f'Existing hikes: {len(existing_ids)}')

    all_hikes = load_new_hikes(export_dir)
    new_hikes = [h for h in all_hikes if h['Activity ID'] not in existing_ids]
    print(f'Hikes in export: {len(all_hikes)}')
    print(f'New hikes to add: {len(new_hikes)}')

    if not new_hikes:
        print('Nothing to do — map is already up to date.')
        return

    # Sort new hikes chronologically so numbering is in order
    new_hikes.sort(key=lambda h: h['Activity Date'])

    start_num = next_hike_number()
    print(f'\nAssigning hike numbers {start_num}–{start_num + len(new_hikes) - 1}')

    print('\nNew hikes:')
    for i, h in enumerate(new_hikes):
        dist_km = round(float(h['Distance']) / 1000, 1)
        print(f'  #{start_num + i}: {h["Activity Date"][:15]} | {h["Activity Name"]} | {dist_km} km')

    print('\nAppending to hiking_activities.csv...')
    append_to_hiking_csv(new_hikes)

    print('Appending to trail_names.csv...')
    append_to_trail_names(new_hikes, start_num)

    print('Copying GPS files...')
    copied, missing = copy_gps_files(new_hikes, export_dir)
    print(f'  Copied: {copied}, Missing: {missing}')

    print('\nRegenerating map...')
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import plot_hikes
    map_path = plot_hikes.create_interactive_map(DATA_DIR)
    plot_hikes.create_summary_stats(DATA_DIR)

    print('\n' + '=' * 60)
    print(f'DONE! Added {len(new_hikes)} new hikes.')
    print(f'Map saved to: {map_path}')
    print('=' * 60)


if __name__ == '__main__':
    main()
