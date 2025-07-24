#!/bin/bash

# RaveTracker v3.0 - Emergency NGINX Fix
# ====================================
# Run this script on the server to fix NGINX permission issues

echo "🚨 RaveTracker v3.0 - Emergency NGINX Fix"
echo "=========================================="
echo "📅 $(date)"
echo "🖥️ Server: $(hostname)"
echo "📍 IP: $(hostname -I | awk '{print $1}')"
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run with sudo"
    echo "💡 Usage: sudo bash emergency_nginx_fix.sh"
    exit 1
fi

echo "✅ Running as root/sudo"

# Step 1: Stop all NGINX processes
echo ""
echo "🛑 Step 1: Stopping all NGINX processes..."
pkill nginx 2>/dev/null || echo "No NGINX processes to stop"
systemctl stop nginx 2>/dev/null
sleep 2

# Step 2: Clean up PID files
echo ""
echo "🗑️ Step 2: Cleaning up PID files..."
rm -f /run/nginx.pid
rm -f /var/run/nginx.pid
echo "✅ PID files cleaned"

# Step 3: Check and fix configuration
echo ""
echo "📝 Step 3: Checking NGINX configuration..."
if nginx -t; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration has errors"
    echo ""
    echo "🔧 Creating minimal working configuration..."
    
    # Backup existing config
    if [ -f "/etc/nginx/sites-available/ravetracker-v3" ]; then
        cp /etc/nginx/sites-available/ravetracker-v3 /etc/nginx/sites-available/ravetracker-v3.emergency-backup
        echo "✅ Backup created"
    fi
    
    # Create minimal working config
    cat > /etc/nginx/sites-available/ravetracker-v3 << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    root /var/www/ravetracker-v3/temp_build;
    index index.html index.htm;
    
    # Basic file serving
    location / {
        try_files $uri $uri/ @app;
    }
    
    # App proxy fallback
    location @app {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 3s;
        proxy_send_timeout 3s;
        proxy_read_timeout 3s;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "RaveTracker v3.0 - OK\n";
        add_header Content-Type text/plain;
    }
    
    # Security
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    server_tokens off;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF
    
    echo "✅ Minimal configuration created"
    
    # Test new config
    if nginx -t; then
        echo "✅ New configuration is valid"
    else
        echo "❌ Configuration still has issues"
        exit 1
    fi
fi

# Step 4: Start NGINX service
echo ""
echo "🚀 Step 4: Starting NGINX service..."
systemctl start nginx

# Check if it started
sleep 2
if systemctl is-active --quiet nginx; then
    echo "✅ NGINX started successfully"
    
    # Show status
    echo ""
    echo "📊 NGINX Status:"
    systemctl status nginx --no-pager -l | head -10
    
    # Check PID
    if [ -f /run/nginx.pid ]; then
        echo "✅ PID file created: $(cat /run/nginx.pid)"
    else
        echo "⚠️ PID file not found (may be normal)"
    fi
    
else
    echo "❌ NGINX failed to start"
    echo "📄 Error details:"
    journalctl -u nginx --no-pager -n 10
    exit 1
fi

# Step 5: Test functionality
echo ""
echo "🧪 Step 5: Testing functionality..."

# Check if port 80 is listening
if ss -tlnp | grep -q :80; then
    echo "✅ Port 80 is listening"
else
    echo "❌ Port 80 is not listening"
fi

# Test HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed (HTTP $HTTP_CODE)"
else
    echo "⚠️ Health check returned HTTP $HTTP_CODE"
fi

# Step 6: Enable service
echo ""
echo "🔧 Step 6: Enabling NGINX service..."
systemctl enable nginx
echo "✅ NGINX will start automatically on boot"

# Final status
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "🎉 Emergency NGINX Fix Completed!"
echo "================================="
echo "✅ NGINX is running"
echo "✅ Configuration is valid"
echo "✅ Service is enabled"
echo "🌐 Access URL: http://$SERVER_IP"
echo "🔍 Health check: http://$SERVER_IP/health"
echo ""
echo "📊 Current Status:"
echo "- NGINX PID: $(cat /run/nginx.pid 2>/dev/null || echo 'Not found')"
echo "- Listening ports: $(ss -tlnp | grep :80 | awk '{print $4}')"
echo "- Service status: $(systemctl is-active nginx)"
echo ""
echo "🚀 RaveTracker v3.0 is ready!"
