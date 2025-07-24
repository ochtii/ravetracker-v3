#!/bin/bash

# RaveTracker v3.0 - Server Setup Script
# Einmalige Einrichtung der Deployment-Struktur

echo "🏗️ Setting up RaveTracker v3.0 deployment structure..."

# Configuration
APP_PATH="/var/www/ravetracker-v3"
REPO_URL="https://github.com/ochtii/ravetracker-v3.git"

# Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p "$APP_PATH"/{releases,shared/{logs,uploads}}
sudo chown -R deploy:deploy "$APP_PATH"

# Clone repository for initial setup
echo "📥 Cloning repository for initial setup..."
cd /tmp
git clone "$REPO_URL" ravetracker-setup
cd ravetracker-setup

# Copy deployment scripts
echo "🔧 Setting up deployment scripts..."
cp deploy/deploy.sh "$APP_PATH/"
cp deploy/health-check.sh "$APP_PATH/"
chmod +x "$APP_PATH/deploy.sh"
chmod +x "$APP_PATH/health-check.sh"

# Create shared environment file template
echo "📝 Creating environment template..."
cat > "$APP_PATH/shared/.env.production" << EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=your-supabase-url
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Add your production environment variables here
EOF

echo "✅ Setup completed!"
echo "📋 Next steps:"
echo "1. Edit: $APP_PATH/shared/.env.production"
echo "2. Run: cd $APP_PATH && ./deploy.sh"

# Cleanup
rm -rf /tmp/ravetracker-setup
