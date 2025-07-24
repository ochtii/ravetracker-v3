#!/bin/bash

# Auto-Update Script für temp_build
# Wird von GitHub Webhook oder Cron Job ausgeführt

echo "🔄 Auto-updating temp_build from GitHub..."

APP_PATH="/var/www/ravetracker-v3"
TEMP_BUILD="$APP_PATH/temp_build"
REPO_URL="https://github.com/ochtii/ravetracker-v3.git"

# Check if temp_build directory exists
if [ -d "$TEMP_BUILD" ]; then
    echo "📁 temp_build exists, pulling latest changes..."
    cd "$TEMP_BUILD"
    
    # Get current commit hash
    OLD_COMMIT=$(git rev-parse HEAD)
    
    # Pull latest changes
    git fetch origin main
    git reset --hard origin/main
    
    # Get new commit hash
    NEW_COMMIT=$(git rev-parse HEAD)
    
    if [ "$OLD_COMMIT" != "$NEW_COMMIT" ]; then
        echo "✅ temp_build updated from $OLD_COMMIT to $NEW_COMMIT"
        
        # Copy updated deployment scripts
        echo "📋 Updating deployment scripts..."
        cp deploy/*.sh "$APP_PATH/"
        chmod +x "$APP_PATH"/*.sh
        
        echo "🎉 temp_build successfully updated!"
    else
        echo "ℹ️ temp_build already up to date"
    fi
else
    echo "📁 temp_build doesn't exist, cloning fresh..."
    git clone "$REPO_URL" "$TEMP_BUILD"
    
    # Copy deployment scripts
    cp "$TEMP_BUILD/deploy/"*.sh "$APP_PATH/"
    chmod +x "$APP_PATH"/*.sh
    
    echo "✅ temp_build cloned and scripts updated"
fi

# Ensure correct ownership
chown -R deploy:deploy "$TEMP_BUILD"

echo "📊 Current temp_build status:"
cd "$TEMP_BUILD"
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD)"
echo "Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
