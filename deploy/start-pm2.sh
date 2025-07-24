#!/bin/bash

# Quick PM2 Start Script für RaveTracker v3.0
# Startet die Anwendung ohne komplexe Konfiguration

echo "🚀 Starting RaveTracker v3.0 with PM2..."

APP_PATH="/var/www/ravetracker-v3/current"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ $APP_PATH nicht gefunden!"
    exit 1
fi

cd "$APP_PATH"

# Ensure build exists
if [ ! -f "build/index.js" ]; then
    echo "❌ build/index.js nicht gefunden!"
    exit 1
fi

# Stop existing process
pm2 delete ravetracker-v3 2>/dev/null || true

# Create logs directory
mkdir -p logs

# Start with environment variables directly
echo "📋 Starting PM2 process..."
NODE_ENV=production \
PORT=3000 \
HOST=0.0.0.0 \
pm2 start build/index.js \
    --name ravetracker-v3 \
    --log-date-format="YYYY-MM-DD HH:mm:ss Z" \
    --merge-logs \
    --output ./logs/out.log \
    --error ./logs/error.log

# Save configuration
pm2 save

echo "✅ PM2 gestartet!"
echo "📊 Status:"
pm2 status

echo "📝 Logs (letzte 10 Zeilen):"
pm2 logs ravetracker-v3 --lines 10
