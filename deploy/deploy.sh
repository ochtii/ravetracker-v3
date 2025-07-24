#!/bin/bash

# RaveTracker v3.0 Deployment Script
# Automatisches Zero-Downtime Deployment
# 
# ⚠️  WICHTIG: NIEMALS mit sudo ausführen!
# ✅  Ausführen als: ./deploy.sh (als deploy user)
# ❌  NICHT: sudo ./deploy.sh

set -e  # Exit on any error

# Check if running as root/sudo
if [ "$EUID" -eq 0 ]; then
    echo "❌ FEHLER: Deploy Script darf NICHT als root/sudo ausgeführt werden!"
    echo "✅ Bitte ausführen als: ./deploy.sh (als deploy user)"
    exit 1
fi

echo "🚀 Starting RaveTracker v3.0 Deployment..."
echo "👤 Running as user: $(whoami)"

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

echo "🔐 Setting correct ownership for deploy user..."
chown -R deploy:deploy "$RELEASE_PATH"

echo "📦 Installing dependencies..."
cd "$RELEASE_PATH"

# Always clean install to avoid npm ci optional dependencies bug
echo "🧹 Cleaning previous node_modules and lock file..."
rm -rf node_modules package-lock.json

echo "📋 Installing fresh dependencies with npm install..."
npm install

echo "🔍 Verifying adapter installation..."
if npm list @sveltejs/adapter-node > /dev/null 2>&1; then
    echo "✅ @sveltejs/adapter-node is installed"
else
    echo "❌ @sveltejs/adapter-node not found, installing manually..."
    npm install @sveltejs/adapter-node
fi

echo "🏗️ Building application..."
echo "🔍 Checking svelte.config.js adapter..."
grep -A 3 "adapter:" svelte.config.js || echo "Could not read adapter config"

npm run build

# Ensure build directory exists with correct structure
if [ ! -f "build/index.js" ]; then
    echo "⚠️ build/index.js not found, copying from .svelte-kit/output/"
    mkdir -p build
    cp .svelte-kit/output/server/index.js build/index.js
    cp -r .svelte-kit/output/client build/client
fi

echo "🧹 Removing dev dependencies to save space..."
npm prune --production

echo "🔧 Setting up deployment scripts..."
# Copy deployment scripts to main directory and make executable
cp "$RELEASE_PATH/deploy/deploy.sh" "$APP_PATH/"
chmod +x "$APP_PATH/deploy.sh"

# Copy health-check.sh if it exists
if [ -f "$RELEASE_PATH/deploy/health-check.sh" ]; then
    cp "$RELEASE_PATH/deploy/health-check.sh" "$APP_PATH/"
    chmod +x "$APP_PATH/health-check.sh"
    echo "✅ health-check.sh copied"
else
    echo "⚠️ health-check.sh not found, skipping..."
fi

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

# Simple health check with retries
check_health() {
    local retries=3
    local wait_time=3
    
    for i in $(seq 1 $retries); do
        echo "📡 Health check attempt $i/$retries..."
        
        if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Application is responding!"
            return 0
        else
            echo "⚠️ No response, waiting ${wait_time}s..."
            sleep $wait_time
        fi
    done
    
    echo "❌ Health check failed after $retries attempts"
    return 1
}

# Run health check
if check_health; then
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
