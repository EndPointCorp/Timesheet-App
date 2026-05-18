#!/bin/bash

set -euo pipefail
trap 'exit 1' INT

run_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )
cd "$run_dir"/.. || exit 1

# Function to display usage information
usage() {
    echo "Usage: $0 --username <username> --number <camp_number>"
    echo "  or:  $0 -u <username> -n <camp_number>"
    exit 1
}

# Initialize variables
REMOTE_USER=""
CAMP_NUMBER=""

# Parse command-line options
while [[ "$#" -gt 0 ]]; do
    case "$1" in
        -u|--username)
            REMOTE_USER="$2"
            shift 2
            ;;
        -n|--number)
            CAMP_NUMBER="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Check if both username and camp number are provided
if [[ -z "$REMOTE_USER" || -z "$CAMP_NUMBER" ]]; then
    echo "Error: Both username and camp number are required."
    usage
fi

# Validate that CAMP_NUMBER is a positive integer
if ! [[ "$CAMP_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "Error: Camp number must be a positive integer."
    exit 1
fi

# Define variables
REMOTE_HOST="camp.timesheet.endpointdev.com"
REMOTE_PATH="/home/$REMOTE_USER/camp$CAMP_NUMBER/frontend"
LOCAL_BUILD_DIR="./build"

# Run build locally
echo "Running npm build..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed. Exiting script."
    exit 1
fi

# Sync build files to remote server
echo "Syncing files to the server..."
echo "2d66250a-6c8c-458a-8aa4-7af8840746a1" > "$LOCAL_BUILD_DIR/front.version"
rsync -avz "$LOCAL_BUILD_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

# Confirm the sync
if [ $? -eq 0 ]; then
    echo "Files successfully synced to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
else
    echo "File sync failed."
    exit 1
fi
