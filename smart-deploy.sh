#!/bin/bash

# RaveTracker v3.0 Smart Deploy Script
# Efficient deployment with incremental updates
# Only updates what has changed to minimize downtime

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Configuration
APP_PATH="/var/www/ravetracker-v3"
REPO_URL="https://github.com/ochtii/ravetracker-v3.git"
CURRENT_PATH="$APP_PATH/current"
TEMP_PATH="$APP_PATH/temp"
BACKUP_PATH="$APP_PATH/backup"
PM2_APP_NAME="ravetracker-v3"

# Ensure we're in the right directory
cd "$APP_PATH" || error "Cannot access app directory: $APP_PATH"

log "🚀 Starting Smart Deploy for RaveTracker v3.0"
log "👤 Running as: $(whoami)"
log "📁 Working directory: $(pwd)"

# Environment variables from GitHub Actions
FORCE_DEPLOY="${FORCE_DEPLOY:-false}"
DEPS_CHANGED="${DEPS_CHANGED:-false}"
BUILD_NEEDED="${BUILD_NEEDED:-false}"
COMMIT_SHA="${COMMIT_SHA:-unknown}"

log "📊 Deploy Configuration:"
log "   - Force Deploy: $FORCE_DEPLOY"
log "   - Dependencies Changed: $DEPS_CHANGED"
log "   - Build Needed: $BUILD_NEEDED"
log "   - Commit: $COMMIT_SHA"

# Function to backup current version
backup_current() {
    if [ -d "$CURRENT_PATH" ]; then
        log "💾 Creating backup of current version..."
        rm -rf "$BACKUP_PATH"
        cp -r "$CURRENT_PATH" "$BACKUP_PATH"
        success "Backup created"
    fi
}

# Function to rollback on failure
rollback() {
    if [ -d "$BACKUP_PATH" ]; then
        warning "🔄 Rolling back to previous version..."
        rm -rf "$CURRENT_PATH"
        mv "$BACKUP_PATH" "$CURRENT_PATH"
        
        # Restart PM2 with backup
        if command -v pm2 >/dev/null 2>&1; then
            pm2 restart "$PM2_APP_NAME" || warning "PM2 restart failed"
        fi
        
        error "Deployment failed, rolled back to previous version"
    else
        error "Deployment failed and no backup available"
    fi
}

# Set trap for cleanup on failure
trap rollback ERR

# Step 1: Update repository
log "📥 Fetching latest changes from repository..."
if [ ! -d "$TEMP_PATH" ]; then
    log "🆕 Cloning repository for the first time..."
    git clone "$REPO_URL" "$TEMP_PATH"
else
    log "🔄 Updating existing repository..."
    cd "$TEMP_PATH"
    git fetch origin main
    
    # Check if there are actually new changes
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/main)
    
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ] && [ "$FORCE_DEPLOY" != "true" ]; then
        success "🎯 No new changes detected, deployment skipped"
        exit 0
    fi
    
    git reset --hard origin/main
fi

cd "$TEMP_PATH"
success "Repository updated to commit: $(git rev-parse --short HEAD)"

# Step 2: Handle dependencies
if [ "$DEPS_CHANGED" = "true" ] || [ "$FORCE_DEPLOY" = "true" ] || [ ! -d "node_modules" ]; then
    log "📦 Installing/updating dependencies..."
    npm ci --only=production
    success "Dependencies updated"
else
    log "⏭️  Skipping dependency installation (no changes detected)"
fi

# Step 3: Copy environment and shared files
log "🔗 Setting up environment and shared files..."

# Copy .env file from current deployment if exists
if [ -f "$CURRENT_PATH/.env" ]; then
    cp "$CURRENT_PATH/.env" "$TEMP_PATH/.env"
    log "   - Environment file copied"
fi

# Copy any persistent data directories
if [ -d "$CURRENT_PATH/uploads" ]; then
    cp -r "$CURRENT_PATH/uploads" "$TEMP_PATH/"
    log "   - Uploads directory preserved"
fi

# Step 4: Build application if needed
if [ "$BUILD_NEEDED" = "true" ] || [ "$FORCE_DEPLOY" = "true" ] || [ ! -d "build" ]; then
    log "🏗️  Building application..."
    npm run build
    success "Application built"
else
    # Copy existing build if no rebuild needed
    if [ -d "$CURRENT_PATH/build" ]; then
        log "📋 Copying existing build (no rebuild needed)..."
        cp -r "$CURRENT_PATH/build" "$TEMP_PATH/"
        success "Build copied"
    else
        warning "No existing build found, forcing rebuild..."
        npm run build
        success "Application built"
    fi
fi

# Step 5: Backup current version
backup_current

# Step 6: Atomic deployment switch
log "🔄 Switching to new version..."
if [ -d "$CURRENT_PATH" ]; then
    rm -rf "$CURRENT_PATH"
fi
mv "$TEMP_PATH" "$CURRENT_PATH"
success "New version activated"

# Step 7: Set correct permissions
log "🔐 Setting correct permissions..."
chown -R www-data:www-data "$CURRENT_PATH"
find "$CURRENT_PATH" -type f -exec chmod 644 {} \;
find "$CURRENT_PATH" -type d -exec chmod 755 {} \;
success "Permissions set"

# Step 8: Restart application
log "🔄 Restarting application..."
cd "$CURRENT_PATH"

if command -v pm2 >/dev/null 2>&1; then
    # Check if PM2 process exists
    if pm2 show "$PM2_APP_NAME" >/dev/null 2>&1; then
        log "   - Restarting existing PM2 process..."
        pm2 restart "$PM2_APP_NAME"
    else
        log "   - Starting new PM2 process..."
        pm2 start npm --name "$PM2_APP_NAME" -- start
    fi
    
    # Save PM2 configuration
    pm2 save
    success "PM2 process restarted"
else
    warning "PM2 not found, please start the application manually"
fi

# Step 9: Health check
log "🏥 Performing health check..."
sleep 5

# Check if application is responding
if command -v curl >/dev/null 2>&1; then
    if curl -f -s http://localhost:3000 >/dev/null; then
        success "Application is responding"
    else
        warning "Application health check failed, but deployment completed"
    fi
else
    warning "curl not available, skipping health check"
fi

# Step 10: Cleanup
log "🧹 Cleaning up..."
if [ -d "$BACKUP_PATH" ]; then
    # Keep backup for potential rollback
    log "   - Backup kept at: $BACKUP_PATH"
fi

# Remove trap as deployment succeeded
trap - ERR

success "🎉 Smart deployment completed successfully!"
log "📝 Deployment Summary:"
log "   - Commit: $COMMIT_SHA"
log "   - Dependencies Updated: $DEPS_CHANGED"
log "   - Application Built: $BUILD_NEEDED"
log "   - Deployment Time: $(date)"
log "   - Application URL: http://$(hostname):3000"

# Optional: Send notification (uncomment if you want Slack/Discord notifications)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"🚀 RaveTracker v3.0 deployed successfully!\nCommit: '$COMMIT_SHA'\nTime: '$(date)'"}' \
#     $SLACK_WEBHOOK_URL
