#!/bin/bash

# RaveTracker v3.0 Rollback Script
# Quickly rollback to previous version

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
CURRENT_PATH="$APP_PATH/current"
BACKUP_PATH="$APP_PATH/backup"
PM2_APP_NAME="ravetracker-v3"

cd "$APP_PATH" || error "Cannot access app directory: $APP_PATH"

log "🔄 RaveTracker v3.0 Rollback"

# Check if backup exists
if [ ! -d "$BACKUP_PATH" ]; then
    error "No backup found at $BACKUP_PATH"
fi

log "📋 Backup found, rolling back..."

# Stop current application
if command -v pm2 >/dev/null 2>&1; then
    log "⏹️  Stopping current application..."
    pm2 stop "$PM2_APP_NAME" || warning "Could not stop PM2 process"
fi

# Move current to failed
if [ -d "$CURRENT_PATH" ]; then
    log "📦 Moving failed deployment..."
    rm -rf "$APP_PATH/failed"
    mv "$CURRENT_PATH" "$APP_PATH/failed"
fi

# Restore backup
log "🔄 Restoring backup..."
mv "$BACKUP_PATH" "$CURRENT_PATH"

# Set permissions
log "🔐 Setting permissions..."
chown -R www-data:www-data "$CURRENT_PATH"

# Restart application
if command -v pm2 >/dev/null 2>&1; then
    log "🚀 Starting application..."
    cd "$CURRENT_PATH"
    pm2 start "$PM2_APP_NAME" || pm2 restart "$PM2_APP_NAME"
    success "Application restarted"
fi

# Health check
sleep 5
if command -v curl >/dev/null 2>&1; then
    if curl -f -s http://localhost:3000 >/dev/null; then
        success "🏥 Application is responding"
    else
        warning "Health check failed"
    fi
fi

success "🎉 Rollback completed successfully!"
log "📁 Failed deployment moved to: $APP_PATH/failed"
