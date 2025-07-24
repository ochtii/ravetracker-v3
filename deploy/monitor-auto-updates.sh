#!/bin/bash

# Real-time monitoring of GitHub webhook activity
echo "🔄 Monitoring GitHub webhook activity..."

LOG_FILE="/var/log/github-webhook.log"
TEMP_BUILD="/var/www/ravetracker-v3/temp_build"

echo "📍 Monitoring paths:"
echo "   → Temp build: $TEMP_BUILD"
echo "   → Webhook log: $LOG_FILE"

echo ""
echo "🎯 Watching for file changes..."
echo "   → Press Ctrl+C to stop monitoring"

# Watch temp_build directory for changes
if [ -d "$TEMP_BUILD" ]; then
    echo "👀 Starting file system monitoring..."
    
    # Monitor git operations in temp_build
    inotifywait -m -r -e modify,create,delete,move \
        --format '%T %w%f %e' \
        --timefmt '%Y-%m-%d %H:%M:%S' \
        "$TEMP_BUILD" 2>/dev/null &
    
    MONITOR_PID=$!
    
    # Also monitor the auto-update script executions
    echo "📝 Recent auto-update activity:"
    if [ -f "/var/log/auto-update.log" ]; then
        tail -10 /var/log/auto-update.log
    else
        echo "   → No auto-update log found yet"
    fi
    
    echo ""
    echo "🔄 Waiting for GitHub webhook activity..."
    echo "   → Any changes in temp_build will be shown below"
    echo ""
    
    # Keep monitoring until interrupted
    wait $MONITOR_PID
else
    echo "❌ temp_build directory not found at $TEMP_BUILD"
    echo "💡 Server might not be set up correctly"
fi
