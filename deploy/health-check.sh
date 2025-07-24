#!/bin/bash

# Health Check Script für RaveTracker v3.0
# Prüft ob die Anwendung ordnungsgemäß läuft

echo "🔍 RaveTracker v3.0 Health Check..."

# Configuration
HEALTH_URL="http://localhost:3000"
APP_PATH="/var/www/ravetracker-v3"

echo "📊 System Status:"
echo "- Datum: $(date)"
echo "- Server: $(hostname)"
echo "- User: $(whoami)"

echo ""
echo "🔗 Application Status:"

# Check if application directory exists
if [ -d "$APP_PATH/current" ]; then
    echo "✅ Application directory exists"
    
    # Check current release
    CURRENT_RELEASE=$(readlink "$APP_PATH/current" | xargs basename)
    echo "📦 Current release: $CURRENT_RELEASE"
else
    echo "❌ Application directory not found"
    exit 1
fi

echo ""
echo "⚙️ PM2 Status:"
pm2 status

echo ""
echo "🌐 HTTP Health Check:"

# HTTP health check
if curl -f -s -o /dev/null "$HEALTH_URL"; then
    echo "✅ HTTP endpoint is responding"
    
    # Get response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$HEALTH_URL")
    echo "⏱️ Response time: ${RESPONSE_TIME}s"
else
    echo "❌ HTTP endpoint is not responding"
    echo "🔍 Checking PM2 logs..."
    pm2 logs ravetracker-v3 --lines 10
    exit 1
fi

echo ""
echo "💾 Disk Usage:"
df -h "$APP_PATH"

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "📈 PM2 Process Info:"
pm2 show ravetracker-v3

echo ""
echo "✅ Health check completed successfully!"
echo "🌐 Application is running at: $HEALTH_URL"
