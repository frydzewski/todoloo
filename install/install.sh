#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.todoloo.server.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HOME/.todoloo/logs"

echo "Installing Todoloo..."

# Create log directory
mkdir -p "$LOG_DIR"

# Create LaunchAgent directory if needed
mkdir -p "$LAUNCH_AGENTS_DIR"

# Copy and configure plist
sed -e "s|TODOLOO_PATH|$PROJECT_DIR|g" \
    -e "s|HOME|$HOME|g" \
    "$SCRIPT_DIR/$PLIST_NAME" > "$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "LaunchAgent installed at $LAUNCH_AGENTS_DIR/$PLIST_NAME"

# Load the agent
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_NAME" 2>/dev/null || true
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_NAME"

echo "Todoloo service started!"
echo "Web UI: http://localhost:3456"
echo "Logs: $LOG_DIR"
