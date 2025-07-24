#!/bin/bash

# Quick Setup Script für RaveTracker v3.0 Deployment
# Führt die notwendigen Schritte für sofortiges Deployment aus

echo "🚀 Quick Setup für RaveTracker v3.0 Deployment..."

APP_PATH="/var/www/ravetracker-v3"
TEMP_BUILD="$APP_PATH/temp_build"

# Prüfen ob temp_build existiert
if [ ! -d "$TEMP_BUILD" ]; then
    echo "❌ $TEMP_BUILD nicht gefunden!"
    echo "📋 Bitte zuerst Code klonen:"
    echo "   git clone https://github.com/ochtii/ravetracker-v3.git $TEMP_BUILD"
    exit 1
fi

echo "📁 Kopiere deployment scripts..."
cp "$TEMP_BUILD/deploy/deploy.sh" "$APP_PATH/"
cp "$TEMP_BUILD/deploy/health-check.sh" "$APP_PATH/" 2>/dev/null || echo "⚠️ health-check.sh nicht gefunden"

echo "🔐 Setze Ausführungsrechte..."
chmod +x "$APP_PATH/deploy.sh"
chmod +x "$APP_PATH/health-check.sh" 2>/dev/null || true

echo "🏗️ Erstelle Verzeichnisstruktur..."
mkdir -p "$APP_PATH"/{releases,shared/{logs,uploads}}

echo "📝 Erstelle .env template..."
if [ ! -f "$APP_PATH/shared/.env.production" ]; then
    cat > "$APP_PATH/shared/.env.production" << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=your-supabase-url
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Add your production environment variables here
EOF
    echo "✅ .env.production template erstellt"
else
    echo "✅ .env.production bereits vorhanden"
fi

echo ""
echo "✅ Setup abgeschlossen!"
echo "📋 Nächste Schritte:"
echo "1. Bearbeite: $APP_PATH/shared/.env.production"
echo "2. Führe aus: cd $APP_PATH && ./deploy.sh"
echo ""
echo "🔍 Deployment Script Status:"
ls -la "$APP_PATH/deploy.sh"
