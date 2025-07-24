#!/bin/bash

# RaveTracker v3.0 - Auto Update temp_build Script
# This script automatically updates the temp_build directory with latest changes

set -e  # Exit on any error

echo "🚀 RaveTracker v3.0 - Auto Update temp_build"
echo "============================================="

# Configuration
PROJECT_DIR="/var/www/ravetracker-v3"
TEMP_BUILD_DIR="$PROJECT_DIR/temp_build"
REPO_URL="https://github.com/ochtii/ravetracker-v3.git"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to create backup
create_backup() {
    if [ -d "$TEMP_BUILD_DIR" ]; then
        log "📦 Creating backup of current temp_build..."
        tar -czf "$BACKUP_DIR/temp_build_backup_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" temp_build
        log "✅ Backup created: temp_build_backup_$TIMESTAMP.tar.gz"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/temp_build_backup_*.tar.gz | tail -n +6 | xargs -r rm
        log "🧹 Cleaned old backups (keeping last 5)"
    fi
}

# Function to initialize temp_build
initialize_temp_build() {
    log "🔧 Initializing temp_build directory..."
    cd "$PROJECT_DIR"
    git clone "$REPO_URL" temp_build
    log "✅ temp_build initialized successfully"
}

# Function to update temp_build
update_temp_build() {
    log "📥 Updating temp_build with latest changes..."
    cd "$TEMP_BUILD_DIR"
    
    # Fetch latest changes
    git fetch origin main
    
    # Check if there are new commits
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/main)
    
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        log "ℹ️ temp_build is already up to date"
        return 0
    fi
    
    log "🔄 New commits found, updating..."
    log "📍 Current commit: ${LOCAL_COMMIT:0:7}"
    log "📍 Latest commit: ${REMOTE_COMMIT:0:7}"
    
    # Reset to latest
    git reset --hard origin/main
    git clean -fd
    
    log "✅ temp_build updated to latest main branch"
}

# Function to copy deployment scripts
copy_scripts() {
    log "📋 Updating deployment scripts..."
    cd "$PROJECT_DIR"
    
    if [ -d "$TEMP_BUILD_DIR/scripts" ]; then
        cp "$TEMP_BUILD_DIR/scripts"/*.sh ./ 2>/dev/null || log "⚠️ No .sh scripts found to copy"
        chmod +x *.sh 2>/dev/null || log "⚠️ No shell scripts to make executable"
        log "✅ Deployment scripts updated"
    else
        log "⚠️ No scripts directory found in temp_build"
    fi
}

# Function to validate update
validate_update() {
    log "🔍 Validating update..."
    
    if [ ! -d "$TEMP_BUILD_DIR" ]; then
        log "❌ temp_build directory not found after update"
        return 1
    fi
    
    if [ ! -f "$TEMP_BUILD_DIR/package.json" ]; then
        log "❌ package.json not found in temp_build"
        return 1
    fi
    
    cd "$TEMP_BUILD_DIR"
    CURRENT_COMMIT=$(git rev-parse HEAD)
    BRANCH=$(git branch --show-current)
    
    log "✅ Validation successful"
    log "📍 Current commit: ${CURRENT_COMMIT:0:7}"
    log "🌿 Current branch: $BRANCH"
}

# Main execution
main() {
    log "🎬 Starting auto-update process..."
    
    # Pre-flight checks
    log "🔍 Running pre-flight checks..."
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log "❌ Git is not installed on this system"
        exit 1
    fi
    
    # Check internet connectivity
    if ! ping -c 1 github.com &> /dev/null; then
        log "⚠️ Warning: Cannot reach github.com - check internet connectivity"
    fi
    
    # Change to project directory
    cd "$PROJECT_DIR" || {
        log "❌ Failed to access project directory: $PROJECT_DIR"
        log "💡 Tip: Create directory with: sudo mkdir -p $PROJECT_DIR && sudo chown \$USER:\$USER $PROJECT_DIR"
        exit 1
    }
    
    log "✅ Pre-flight checks passed"
    
    # Create backup of existing temp_build
    create_backup
    
    # Check if temp_build exists
    if [ ! -d "$TEMP_BUILD_DIR" ]; then
        log "📁 temp_build directory not found, initializing..."
        initialize_temp_build
    else
        log "📁 temp_build directory found, updating..."
        update_temp_build
    fi
    
    # Copy deployment scripts
    copy_scripts
    
    # Validate the update
    validate_update
    
    log "🎉 Auto-update process completed successfully!"
    log "📊 Summary:"
    log "   - Project: RaveTracker v3.0"
    log "   - Directory: $TEMP_BUILD_DIR"
    log "   - Timestamp: $TIMESTAMP"
    log "   - Status: Success ✅"
}

# Execute main function
main "$@"
