#!/bin/bash

# RaveTracker v3.0 - Quick 502 Fix
# ===============================
# Run this script to fix 502 Bad Gateway errors

echo "🚨 RaveTracker v3.0 - Quick 502 Bad Gateway Fix"
echo "=============================================="
echo "📅 $(date)"
echo "🖥️ Server: $(hostname)"
echo "📍 IP: $(hostname -I | awk '{print $1}')"
echo ""

# Change to project directory
PROJECT_DIR="/var/www/ravetracker-v3"
echo "📁 Changing to project directory: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "✅ In directory: $(pwd)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. This might not be a Node.js project."
    echo "📋 Directory contents:"
    ls -la
    exit 1
fi

echo "✅ Found package.json"

# Step 1: Stop existing processes on port 3000
echo ""
echo "🛑 Step 1: Stopping existing processes on port 3000..."
pkill -f "node.*3000" 2>/dev/null || echo "No existing processes to kill"
pkill -f "npm.*start" 2>/dev/null || echo "No npm start processes to kill"
sleep 2

# Check if port is free
if netstat -tlnp 2>/dev/null | grep -q :3000 || ss -tlnp 2>/dev/null | grep -q :3000; then
    echo "⚠️ Port 3000 still in use, trying to kill more processes..."
    sudo fuser -k 3000/tcp 2>/dev/null || echo "fuser not available"
    sleep 2
fi

echo "✅ Port 3000 cleanup completed"

# Step 2: Install dependencies if needed
echo ""
echo "📦 Step 2: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already exist"
fi

# Step 3: Build application if needed
echo ""
echo "🏗️ Step 3: Checking build..."
if [ ! -d "build" ]; then
    echo "🔨 Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ npm build failed"
        exit 1
    fi
    echo "✅ Application built"
else
    echo "✅ Build directory exists"
fi

# Step 4: Create logs directory
echo ""
echo "📄 Step 4: Preparing logs..."
mkdir -p logs
echo "✅ Logs directory ready"

# Step 5: Start the application
echo ""
echo "🚀 Step 5: Starting SvelteKit application..."

# Start in background with logging
echo "🌟 Starting npm start in background..."
nohup npm start > logs/app.log 2>&1 &
APP_PID=$!

echo "🆔 Application PID: $APP_PID"
echo "📄 Logs: $PROJECT_DIR/logs/app.log"

# Wait for startup
echo "⏳ Waiting for application to start..."
sleep 8

# Step 6: Verify the application is running
echo ""
echo "🧪 Step 6: Verifying application..."

# Check if process is still running
if ps -p $APP_PID > /dev/null; then
    echo "✅ Application process is running (PID: $APP_PID)"
else
    echo "❌ Application process died during startup"
    echo "📄 Error logs:"
    tail -20 logs/app.log 2>/dev/null || echo "No logs available"
    exit 1
fi

# Check if port 3000 is listening
echo ""
echo "📡 Checking port 3000..."
if netstat -tlnp 2>/dev/null | grep -q :3000 || ss -tlnp 2>/dev/null | grep -q :3000; then
    echo "✅ Application is listening on port 3000"
    
    # Show what's listening
    echo "🔍 Port 3000 details:"
    netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000
else
    echo "❌ Application is not listening on port 3000"
    echo "📄 Recent logs:"
    tail -10 logs/app.log 2>/dev/null || echo "No logs available"
    exit 1
fi

# Step 7: Test HTTP response
echo ""
echo "🌐 Step 7: Testing HTTP response..."
sleep 2

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://localhost:3000 || echo "000")
echo "📊 Direct app response (port 3000): $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Application responds correctly on port 3000"
else
    echo "⚠️ Application not responding correctly (HTTP: $HTTP_CODE)"
    echo "📄 App logs:"
    tail -10 logs/app.log 2>/dev/null || echo "No logs available"
fi

# Step 8: Test through NGINX
echo ""
echo "🌐 Step 8: Testing through NGINX..."
NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://localhost/ || echo "000")
echo "📊 NGINX response (port 80): $NGINX_CODE"

case $NGINX_CODE in
    200)
        echo "🎉 SUCCESS! 502 Bad Gateway fixed!"
        echo "✅ NGINX can successfully proxy to the SvelteKit app"
        ;;
    502)
        echo "❌ Still getting 502 Bad Gateway"
        echo "💡 NGINX can't connect to the app, even though it's running"
        echo "🔧 Check NGINX configuration"
        ;;
    *)
        echo "⚠️ Unexpected NGINX response: $NGINX_CODE"
        ;;
esac

# Final status
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "🎉 Quick 502 Fix Completed!"
echo "=========================="
echo "✅ SvelteKit application started"
echo "✅ Process ID: $APP_PID"
echo "✅ Logs: $PROJECT_DIR/logs/app.log"
echo ""
echo "📊 Status Summary:"
echo "- App on port 3000: HTTP $HTTP_CODE"
echo "- NGINX on port 80: HTTP $NGINX_CODE"
echo "- Process: $(ps -p $APP_PID -o pid,cmd --no-headers 2>/dev/null || echo 'Not running')"
echo ""
echo "🌐 Access URLs:"
echo "- Main site: http://$SERVER_IP"
echo "- Direct app: http://$SERVER_IP:3000 (if port open)"
echo ""
echo "📄 Monitor logs:"
echo "tail -f $PROJECT_DIR/logs/app.log"
echo ""

if [ "$NGINX_CODE" = "200" ]; then
    echo "🚀 RaveTracker v3.0 is now fully operational!"
else
    echo "⚠️ Additional configuration may be needed"
fi
