#!/bin/bash

# Script to check if automatic updates are working
echo "🔍 Checking automatic update status for RaveTracker v3..."

APP_PATH="/var/www/ravetracker-v3"
TEMP_BUILD="$APP_PATH/temp_build"

echo ""
echo "📍 Current working directory: $(pwd)"
echo "📍 App path: $APP_PATH"
echo "📍 Temp build path: $TEMP_BUILD"

echo ""
echo "🔄 Git status in temp_build:"
if [ -d "$TEMP_BUILD" ]; then
    cd "$TEMP_BUILD"
    echo "📋 Current branch: $(git branch --show-current)"
    echo "📋 Latest commit: $(git log --oneline -1)"
    echo "📋 Remote status:"
    git fetch origin main
    git status
    
    echo ""
    echo "📊 Recent commits:"
    git log --oneline -5
    
    echo ""
    echo "📝 Last update timestamp:"
    ls -la | grep -E "(deploy|ecosystem|package\.json)"
    
else
    echo "❌ temp_build directory not found!"
fi

echo ""
echo "🕐 Last GitHub Actions runs (check manually):"
echo "   → https://github.com/ochtii/ravetracker-v3/actions"

echo ""
echo "📋 PM2 process status:"
pm2 list

echo ""
echo "🏥 Health check:"
if command -v curl &> /dev/null; then
    echo "Testing server response..."
    curl -I http://localhost:3000 2>/dev/null | head -1 || echo "❌ Server not responding"
else
    echo "curl not installed, skipping health check"
fi

echo ""
echo "✅ Auto-update check complete!"
