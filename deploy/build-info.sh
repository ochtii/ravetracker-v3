#!/bin/bash

# Build Info Script für RaveTracker v3.0
# Zeigt Informationen über den aktuell laufenden Build

echo "🔍 RaveTracker v3.0 - Build Information"
echo "======================================"

APP_PATH="/var/www/ravetracker-v3"
CURRENT_PATH="$APP_PATH/current"

# Check if current symlink exists
if [ -L "$CURRENT_PATH" ]; then
    CURRENT_RELEASE=$(readlink "$CURRENT_PATH")
    RELEASE_NAME=$(basename "$CURRENT_RELEASE")
    
    echo "📁 Current Release: $RELEASE_NAME"
    echo "📂 Release Path: $CURRENT_RELEASE"
    
    # Git Information
    if [ -d "$CURRENT_RELEASE/.git" ]; then
        cd "$CURRENT_RELEASE"
        
        echo ""
        echo "📋 Git Information:"
        echo "Branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
        echo "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'Unknown')"
        echo "Last Commit: $(git log -1 --pretty=format:'%h - %s (%cr)' 2>/dev/null || echo 'Unknown')"
        echo "Author: $(git log -1 --pretty=format:'%an' 2>/dev/null || echo 'Unknown')"
    else
        echo "⚠️ No git information available"
    fi
    
    # Build Information
    echo ""
    echo "🏗️ Build Information:"
    
    if [ -f "$CURRENT_RELEASE/package.json" ]; then
        VERSION=$(grep '"version"' "$CURRENT_RELEASE/package.json" | sed 's/.*"version": "\(.*\)".*/\1/')
        echo "App Version: $VERSION"
    fi
    
    if [ -f "$CURRENT_RELEASE/build/index.js" ]; then
        BUILD_DATE=$(stat -c %y "$CURRENT_RELEASE/build/index.js" 2>/dev/null || stat -f %Sm "$CURRENT_RELEASE/build/index.js" 2>/dev/null || echo "Unknown")
        echo "Build Date: $BUILD_DATE"
        echo "Build Status: ✅ Available"
    else
        echo "Build Status: ❌ Missing"
    fi
    
    # PM2 Process Information
    echo ""
    echo "⚙️ PM2 Process Information:"
    if command -v pm2 >/dev/null 2>&1; then
        if pm2 describe ravetracker-v3 >/dev/null 2>&1; then
            PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="ravetracker-v3") | .pm2_env.status' 2>/dev/null || echo "unknown")
            PM2_UPTIME=$(pm2 jlist | jq -r '.[] | select(.name=="ravetracker-v3") | .pm2_env.pm_uptime' 2>/dev/null || echo "unknown")
            
            echo "Process Status: $PM2_STATUS"
            if [ "$PM2_UPTIME" != "unknown" ]; then
                UPTIME_DATE=$(date -d "@$((PM2_UPTIME/1000))" 2>/dev/null || echo "Unknown")
                echo "Started: $UPTIME_DATE"
            fi
        else
            echo "Process Status: ❌ Not found"
        fi
    else
        echo "PM2: ❌ Not installed"
    fi
    
    # Server Information
    echo ""
    echo "🌐 Server Information:"
    echo "Public IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unknown')"
    echo "Local Port: 3000"
    
    # Health Check
    echo ""
    echo "🔍 Health Check:"
    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        echo "Application: ✅ Responding"
    else
        echo "Application: ❌ Not responding"
    fi
    
    # Release History
    echo ""
    echo "📚 Recent Releases:"
    ls -lt "$APP_PATH/releases/" | head -6 | tail -5 | while read line; do
        RELEASE_DIR=$(echo "$line" | awk '{print $NF}')
        if [ "$CURRENT_RELEASE" = "$APP_PATH/releases/$RELEASE_DIR" ]; then
            echo "  → $RELEASE_DIR (current)"
        else
            echo "    $RELEASE_DIR"
        fi
    done
    
else
    echo "❌ No current release found!"
    echo "🔧 Run deployment to create current symlink"
fi

echo ""
echo "💡 Useful commands:"
echo "  pm2 logs ravetracker-v3     # View logs"
echo "  pm2 restart ravetracker-v3  # Restart app"
echo "  ./deploy.sh                 # Deploy new version"
