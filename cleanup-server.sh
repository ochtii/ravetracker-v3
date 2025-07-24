#!/bin/bash

# RaveTracker v3.0 Cleanup Script
# Removes old deployment artifacts and prepares for new smart deploy system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
PM2_APP_NAME="ravetracker-v3"

log "🧹 RaveTracker v3.0 Cleanup - Preparing for Smart Deploy"

# Check if we're in the right directory
if [ ! -d "$APP_PATH" ]; then
    error "App directory not found: $APP_PATH"
fi

cd "$APP_PATH"

# Stop PM2 process if running
if command -v pm2 >/dev/null 2>&1; then
    if pm2 show "$PM2_APP_NAME" >/dev/null 2>&1; then
        log "⏹️  Stopping PM2 process..."
        pm2 stop "$PM2_APP_NAME" || warning "Could not stop PM2 process"
        pm2 delete "$PM2_APP_NAME" || warning "Could not delete PM2 process"
        success "PM2 process stopped"
    fi
fi

# Create backup of current state if it exists
if [ -d "current" ]; then
    log "💾 Creating backup of current installation..."
    cp -r current "backup-$(date +%Y%m%d_%H%M%S)" || warning "Could not create backup"
    success "Backup created"
fi

# Remove old deployment artifacts
log "🗑️  Removing old deployment artifacts..."

OLD_DIRS=(
    "temp_build"
    "releases"
    "shared" 
    "temp"
    "failed"
)

for dir in "${OLD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log "   - Removing: $dir"
        rm -rf "$dir"
    fi
done

# Remove old scripts
OLD_SCRIPTS=(
    "deploy.sh"
    "auto-update-temp-build.sh"
    "check-auto-updates.sh"
    "health-check.sh"
    "monitor-auto-updates.sh"
    "start-pm2.sh"
    "webhook-server.sh"
)

for script in "${OLD_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        log "   - Removing old script: $script"
        rm -f "$script"
    fi
done

success "Old artifacts removed"

# Prepare directory structure for smart deploy
log "📁 Preparing directory structure for smart deploy..."

# Ensure correct ownership
if [ -d "current" ]; then
    chown -R deploy:deploy current/ || warning "Could not set ownership"
fi

# Create necessary directories
mkdir -p logs

success "Directory structure prepared"

log "✨ Cleanup completed! Ready for smart deploy system."
log ""
log "📋 Next steps:"
log "1. Upload the new smart-deploy.sh script"
log "2. Make it executable: chmod +x smart-deploy.sh"
log "3. Run first deployment: ./smart-deploy.sh"
log ""
log "🚀 The new smart deploy system will handle everything automatically!"
