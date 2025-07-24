#!/bin/bash

# RaveTracker v3.0 Local Deploy Script
# For manual deployments from local machine

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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
SERVER_HOST="${SERVER_HOST:-your-server.com}"
SERVER_USER="${SERVER_USER:-deploy}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

log "🚀 RaveTracker v3.0 Local Deploy"
echo

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository!"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    warning "You have uncommitted changes!"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push to main branch
log "📤 Pushing changes to main branch..."
git push origin main
success "Changes pushed to GitHub"

# Trigger deployment via SSH
log "🔗 Connecting to server and triggering deployment..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_HOST" << 'EOF'
export FORCE_DEPLOY="false"
export DEPS_CHANGED="auto"
export BUILD_NEEDED="auto"
export COMMIT_SHA="$(git ls-remote origin main | cut -f1)"

cd /var/www/ravetracker-v3
./smart-deploy.sh
EOF

success "🎉 Local deployment completed!"
log "🌐 Your application should be available at: http://$SERVER_HOST"
