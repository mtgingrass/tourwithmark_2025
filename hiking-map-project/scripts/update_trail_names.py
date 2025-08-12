#!/usr/bin/env python3
"""
Helper script to update trail names in the mapping file
"""

import csv
import os
import sys

def list_unmapped_trails():
    """List all trails that don't have proper names yet"""
    
    # Path to trail names file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    trail_names_path = os.path.join(project_dir, 'data', 'trail_names.csv')
    
    # Read current mappings
    trails = []
    with open(trail_names_path, 'r') as f:
        reader = csv.DictReader(f)
        trails = list(reader)
    
    # Count statistics
    total = len(trails)
    mapped = len([t for t in trails if t['Trail_Name']])
    unmapped = total - mapped
    
    print(f"\n=== Trail Naming Progress ===")
    print(f"Total hikes: {total}")
    print(f"Named: {mapped} ({mapped*100//total}%)")
    print(f"Unnamed: {unmapped} ({unmapped*100//total}%)")
    print(f"{'=' * 30}\n")
    
    # Show unmapped trails
    print("Hikes needing trail names:")
    print("-" * 60)
    for trail in trails:
        if not trail['Trail_Name']:
            print(f"#{trail['Hike_Number']:3} | {trail['Date']:12} | {trail['Distance_km']:5}km | {trail['Original_Name'][:40]}")
    
    return trails

def update_trail_name(hike_number, trail_name, location='', notes=''):
    """Update the trail name for a specific hike number"""
    
    # Path to trail names file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    trail_names_path = os.path.join(project_dir, 'data', 'trail_names.csv')
    
    # Read current mappings
    trails = []
    with open(trail_names_path, 'r') as f:
        reader = csv.DictReader(f)
        trails = list(reader)
    
    # Find and update the trail
    updated = False
    for trail in trails:
        if trail['Hike_Number'] == str(hike_number):
            trail['Trail_Name'] = trail_name
            if location:
                trail['Location'] = location
            if notes:
                trail['Notes'] = notes
            updated = True
            print(f"Updated #{hike_number}: {trail_name}")
            break
    
    if not updated:
        print(f"Error: Hike #{hike_number} not found")
        return False
    
    # Write back to file
    with open(trail_names_path, 'w', newline='') as f:
        fieldnames = ['Hike_Number', 'Activity_ID', 'Date', 'Original_Name', 
                      'Trail_Name', 'Distance_km', 'Location', 'Notes']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(trails)
    
    return True

def interactive_mode():
    """Interactive mode for updating trail names"""
    
    while True:
        trails = list_unmapped_trails()
        
        print("\n" + "=" * 60)
        print("Options:")
        print("  1. Update a trail name (enter hike number)")
        print("  2. Regenerate map with current names")
        print("  3. Exit")
        print("=" * 60)
        
        choice = input("\nEnter choice (1-3) or hike number: ").strip()
        
        if choice == '3':
            print("Exiting...")
            break
        elif choice == '2':
            print("Regenerating map...")
            os.system('cd .. && python3 scripts/plot_hikes.py')
            print("Map regenerated!")
        else:
            try:
                hike_num = int(choice)
                
                # Find the trail
                trail_info = None
                for t in trails:
                    if t['Hike_Number'] == str(hike_num):
                        trail_info = t
                        break
                
                if not trail_info:
                    print(f"Hike #{hike_num} not found")
                    continue
                
                print(f"\nHike #{hike_num}:")
                print(f"  Date: {trail_info['Date']}")
                print(f"  Distance: {trail_info['Distance_km']}km")
                print(f"  Original Name: {trail_info['Original_Name']}")
                print(f"  Current Trail Name: {trail_info['Trail_Name'] or '(unnamed)'}")
                
                new_name = input("\nEnter new trail name (or press Enter to skip): ").strip()
                if new_name:
                    location = input("Enter location (optional): ").strip()
                    notes = input("Enter notes (optional): ").strip()
                    update_trail_name(hike_num, new_name, location, notes)
                    print(f"Updated #{hike_num} to: {new_name}")
                
            except ValueError:
                print("Invalid input. Please enter a number or menu choice.")
            except Exception as e:
                print(f"Error: {e}")

def main():
    """Main entry point"""
    
    if len(sys.argv) == 1:
        # No arguments - interactive mode
        interactive_mode()
    elif len(sys.argv) == 2 and sys.argv[1] == '--list':
        # Just list unmapped trails
        list_unmapped_trails()
    elif len(sys.argv) >= 3:
        # Command line update: update_trail_names.py <number> "<trail name>" [location] [notes]
        try:
            hike_num = int(sys.argv[1])
            trail_name = sys.argv[2]
            location = sys.argv[3] if len(sys.argv) > 3 else ''
            notes = sys.argv[4] if len(sys.argv) > 4 else ''
            
            if update_trail_name(hike_num, trail_name, location, notes):
                print(f"Successfully updated hike #{hike_num}")
                # Show progress
                list_unmapped_trails()
        except ValueError:
            print("Error: First argument must be a hike number")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("Usage:")
        print("  python update_trail_names.py                    # Interactive mode")
        print("  python update_trail_names.py --list             # List unmapped trails")
        print("  python update_trail_names.py <number> '<name>'  # Update specific trail")
        print("\nExamples:")
        print('  python update_trail_names.py 46 "Jones Gap Trail"')
        print('  python update_trail_names.py 12 "Paris Mountain" "Greenville, SC" "Great views!"')

if __name__ == "__main__":
    main()