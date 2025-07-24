#!/bin/bash

# GitHub Webhook Handler für temp_build Auto-Update
# Startet einfaches HTTP Server das auf GitHub Push Events hört

WEBHOOK_PORT=9000
APP_PATH="/var/www/ravetracker-v3"

echo "🌐 Starting GitHub Webhook Server on port $WEBHOOK_PORT..."

# Simple webhook server mit netcat
while true; do
    echo "📡 Waiting for GitHub webhook..."
    
    # Listen for incoming HTTP requests
    RESPONSE=$(echo -e "HTTP/1.1 200 OK\r\n\r\nWebhook received" | nc -l -p $WEBHOOK_PORT -q 1)
    
    # Check if it's a push event (simplified)
    if echo "$RESPONSE" | grep -q "push"; then
        echo "🔄 GitHub push detected, updating temp_build..."
        
        # Run the auto-update script
        "$APP_PATH/auto-update-temp-build.sh"
        
        echo "✅ Update completed"
    fi
    
    sleep 1
done
