#!/bin/bash

# RaveTracker v3.0 Deployment Script
# Automatisches Zero-Downtime Deployment

set -e  # Exit on any error

echo "🚀 Starting RaveTracker v3.0 Deployment..."

# Configuration
APP_PATH="/var/www/ravetracker-v3"
REPO_URL="https://github.com/ochtii/ravetracker-v3.git"
RELEASES_PATH="$APP_PATH/releases"
SHARED_PATH="$APP_PATH/shared"
CURRENT_PATH="$APP_PATH/current"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_PATH="$RELEASES_PATH/$TIMESTAMP"

echo "📁 Creating release directory: $RELEASE_PATH"
mkdir -p "$RELEASE_PATH"

echo "📥 Cloning latest code from GitHub..."
git clone --depth 1 --branch main "$REPO_URL" "$RELEASE_PATH"

echo "📦 Installing dependencies..."
cd "$RELEASE_PATH"
npm ci --production

echo "🏗️ Building application..."
npm run build

echo "🔗 Creating symlinks to shared resources..."
# Link shared directories
ln -nfs "$SHARED_PATH/logs" "$RELEASE_PATH/logs"
ln -nfs "$SHARED_PATH/uploads" "$RELEASE_PATH/uploads"

# Link environment file
ln -nfs "$SHARED_PATH/.env.production" "$RELEASE_PATH/.env"

echo "⚙️ Updating current symlink..."
ln -nfs "$RELEASE_PATH" "$CURRENT_PATH"

echo "🔄 Restarting application with PM2..."
cd "$CURRENT_PATH"

# Check if PM2 process exists
if pm2 describe ravetracker-v3 > /dev/null 2>&1; then
    echo "♻️ Reloading existing PM2 process..."
    pm2 reload ravetracker-v3 --env production
else
    echo "🆕 Starting new PM2 process..."
    pm2 start ecosystem.config.js --env production
fi

# Save PM2 configuration
pm2 save

echo "🧹 Cleaning up old releases (keeping last 5)..."
cd "$RELEASES_PATH"
ls -t | tail -n +6 | xargs -r rm -rf

echo "🔍 Running health check..."
sleep 5

# Health check
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is running."
    
    # Show PM2 status
    echo "📊 PM2 Status:"
    pm2 status
    
    echo "🎉 RaveTracker v3.0 deployment completed successfully!"
    echo "🌐 Application URL: http://$(curl -s ifconfig.me)"
else
    echo "❌ Health check failed! Rolling back..."
    
    # Rollback to previous release
    PREVIOUS_RELEASE=$(ls -t "$RELEASES_PATH" | head -n 2 | tail -n 1)
    if [ -n "$PREVIOUS_RELEASE" ]; then
        echo "🔄 Rolling back to: $PREVIOUS_RELEASE"
        ln -nfs "$RELEASES_PATH/$PREVIOUS_RELEASE" "$CURRENT_PATH"
        pm2 reload ravetracker-v3 --env production
        echo "↩️ Rollback completed"
    fi
    
    exit 1
fi
