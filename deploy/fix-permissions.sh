#!/bin/bash

# Fix Permissions Script für RaveTracker v3.0
# Einmalige Ausführung zur Korrektur der Verzeichnisberechtigungen

echo "🔐 Fixing RaveTracker v3.0 directory permissions..."

APP_PATH="/var/www/ravetracker-v3"

# Ensure deploy user owns the entire application directory
sudo chown -R deploy:deploy "$APP_PATH"

# Set proper directory permissions
sudo find "$APP_PATH" -type d -exec chmod 755 {} \;

# Set proper file permissions  
sudo find "$APP_PATH" -type f -exec chmod 644 {} \;

# Make scripts executable
sudo chmod +x "$APP_PATH"/*.sh 2>/dev/null || true

echo "✅ Permissions fixed!"
echo "📋 Ownership:"
ls -la "$APP_PATH"

echo ""
echo "📋 Next steps:"
echo "1. Run: cd $APP_PATH"
echo "2. Run: ./deploy.sh (WITHOUT sudo!)"
