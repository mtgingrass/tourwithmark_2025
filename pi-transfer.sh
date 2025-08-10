#!/bin/bash

# Pi Transfer Utility
# Usage: ./pi-transfer.sh <file/folder> [destination]

# Configuration - update these for your Pi
PI_USER="mtgingrass"
PI_HOST="192.168.1.111"  # Or use IP address like "192.168.1.100"
PI_DEFAULT_DIR="/home/mtgingrass/"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if file/folder provided
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No file or folder specified${NC}"
    echo "Usage: $0 <file/folder> [destination]"
    echo "Example: $0 myfile.txt"
    echo "Example: $0 myfolder/ /home/pi/projects/"
    exit 1
fi

SOURCE=$1
DEST=${2:-$PI_DEFAULT_DIR}

# Check if source exists
if [ ! -e "$SOURCE" ]; then
    echo -e "${RED}Error: '$SOURCE' not found${NC}"
    exit 1
fi

# Determine if it's a file or directory
if [ -d "$SOURCE" ]; then
    echo -e "${YELLOW}Copying directory '$SOURCE' to $PI_USER@$PI_HOST:$DEST${NC}"
    scp -r "$SOURCE" "$PI_USER@$PI_HOST:$DEST"
else
    echo -e "${YELLOW}Copying file '$SOURCE' to $PI_USER@$PI_HOST:$DEST${NC}"
    scp "$SOURCE" "$PI_USER@$PI_HOST:$DEST"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Transfer complete!${NC}"
else
    echo -e "${RED}✗ Transfer failed${NC}"
    exit 1
fi