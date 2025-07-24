#!/bin/bash

# Nginx Setup Script für RaveTracker v3.0

echo "🌐 Setting up Nginx for RaveTracker v3.0..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (sudo)"
    exit 1
fi

# Configuration file path
NGINX_CONFIG="/etc/nginx/sites-available/ravetracker-v3"
NGINX_ENABLED="/etc/nginx/sites-enabled/ravetracker-v3"
TEMP_CONFIG="/var/www/ravetracker-v3/temp_build/deploy/nginx-ravetracker-v3.conf"

# Check if config exists in temp_build
if [ ! -f "$TEMP_CONFIG" ]; then
    echo "❌ Nginx config not found at $TEMP_CONFIG"
    echo "📋 Please ensure temp_build is up to date"
    exit 1
fi

# Copy nginx configuration
echo "📋 Installing Nginx configuration..."
cp "$TEMP_CONFIG" "$NGINX_CONFIG"

# Prompt for server_name
echo ""
echo "🔧 Please edit the server_name in the config:"
echo "Current: server_name your-domain.com www.your-domain.com;"
echo ""
read -p "Enter your domain (or server IP): " DOMAIN

if [ -n "$DOMAIN" ]; then
    # Replace placeholder with actual domain
    sed -i "s/your-domain.com/$DOMAIN/g" "$NGINX_CONFIG"
    echo "✅ Domain set to: $DOMAIN"
else
    echo "⚠️ No domain entered, keeping placeholder"
fi

# Enable the site
echo "🔗 Enabling site..."
ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"

# Remove default nginx site if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "🗑️ Removing default nginx site..."
    rm "/etc/nginx/sites-enabled/default"
fi

# Test nginx configuration
echo "🔍 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Restart nginx
    echo "🔄 Restarting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    echo ""
    echo "✅ Nginx setup completed!"
    echo "🌐 Your site should now be available at: http://$DOMAIN"
    echo ""
    echo "📋 Next steps:"
    echo "1. Ensure PM2 is running: pm2 status"
    echo "2. Check if SvelteKit is on port 3000: curl http://localhost:3000"
    echo "3. Test the website: curl http://$DOMAIN"
    
else
    echo "❌ Nginx configuration test failed!"
    echo "🔧 Please check the configuration manually:"
    echo "   sudo nano $NGINX_CONFIG"
    exit 1
fi

echo ""
echo "🔍 Useful commands:"
echo "  sudo nginx -t                    # Test config"
echo "  sudo systemctl restart nginx    # Restart"
echo "  sudo tail -f /var/log/nginx/ravetracker-v3-error.log  # Check errors"
