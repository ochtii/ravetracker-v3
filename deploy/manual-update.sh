#!/bin/bash

# Manual Update Script für RaveTracker v3.0
# Behebt Git-Konflikte und aktualisiert temp_build

echo "🔧 Manual update script für RaveTracker v3.0..."

APP_PATH="/var/www/ravetracker-v3"
TEMP_BUILD="$APP_PATH/temp_build"
CURRENT="$APP_PATH/current"

echo "📍 Current directory status:"
pwd
echo "Current symlink points to: $(readlink $CURRENT 2>/dev/null || echo 'No symlink')"

# Fix: Move to temp_build for updates
if [ -d "$TEMP_BUILD" ]; then
    echo "🔄 Updating temp_build (correct location)..."
    cd "$TEMP_BUILD"
    
    # Force update (ignore local changes)
    echo "📡 Fetching latest changes..."
    git fetch origin main
    
    echo "🔄 Force reset to origin/main..."
    git reset --hard origin/main
    git clean -fd
    
    echo "✅ temp_build updated successfully!"
    
    # Copy updated scripts
    echo "📋 Updating deployment scripts..."
    cp deploy/*.sh "$APP_PATH/"
    chmod +x "$APP_PATH"/*.sh
    
    echo "📊 Updated to commit:"
    git log -1 --pretty=format:'%h - %s (%cr)'
    echo ""
    
else
    echo "❌ temp_build directory not found!"
    echo "Creating fresh temp_build..."
    
    cd "$APP_PATH"
    git clone https://github.com/ochtii/ravetracker-v3.git temp_build
    
    # Copy scripts
    cp temp_build/deploy/*.sh ./
    chmod +x *.sh
    
    echo "✅ Fresh temp_build created!"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Run deployment: cd $APP_PATH && ./deploy.sh"
echo "2. Check status: pm2 status"
