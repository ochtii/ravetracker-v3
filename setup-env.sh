#!/bin/bash

# RaveTracker v3.0 Environment Setup Script
# Erstellt und konfiguriert .env Datei

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Configuration
APP_PATH="/var/www/ravetracker-v3"
ENV_FILE="$APP_PATH/.env"

echo
echo -e "${CYAN}🔧 RaveTracker v3.0 Environment Setup${NC}"
echo -e "${CYAN}=====================================${NC}"
echo

# Ensure we're in the right directory
mkdir -p "$APP_PATH"
cd "$APP_PATH"

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    log "📋 Vorhandene .env Datei gefunden"
    echo
    info "Aktuelle Konfiguration:"
    grep -E "^[^#]" "$ENV_FILE" | sed 's/=.*/=***/' || echo "Keine Konfiguration sichtbar"
    echo
    
    read -p "Möchten Sie die .env Datei neu erstellen? (j/n): " -r
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        success "Vorhandene .env Datei beibehalten"
        exit 0
    fi
    
    # Backup existing .env
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    log "Backup erstellt: $ENV_FILE.backup.*"
fi

# Collect Supabase configuration
echo
log "🔑 Supabase Konfiguration"
echo
info "Bitte geben Sie Ihre Supabase-Credentials ein:"

read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    error "Supabase URL und Anon Key sind erforderlich!"
fi

# Optional configuration
echo
log "⚙️  Optionale Konfiguration"
echo

read -p "Node Environment [production]: " NODE_ENV
NODE_ENV=${NODE_ENV:-production}

read -p "Port [3000]: " PORT
PORT=${PORT:-3000}

# Create .env file
log "📝 Erstelle .env Datei..."

cat > "$ENV_FILE" << EOF
# RaveTracker v3.0 Environment Configuration
# Generiert am: $(date)

# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Application Configuration
NODE_ENV=$NODE_ENV
PORT=$PORT

# Build Configuration
VITE_BUILD_TIME=$(date +%s)
VITE_VERSION=3.0.0

# Optional: Additional configuration
# Add your custom environment variables below
EOF

# Set correct permissions
chmod 600 "$ENV_FILE"
chown deploy:deploy "$ENV_FILE" 2>/dev/null || chown www-data:www-data "$ENV_FILE" 2>/dev/null || true

success ".env Datei erstellt: $ENV_FILE"

# Verify configuration
echo
log "🔍 Verifikation der Konfiguration..."

# Check if variables are accessible
if node -e "require('dotenv').config(); console.log('✅ Node.js kann .env lesen')" 2>/dev/null; then
    success "Node.js Konfiguration OK"
else
    warning "Node.js dotenv Test fehlgeschlagen (normal bei fehlendem dotenv package)"
fi

# Show final configuration (masked)
echo
info "Finale Konfiguration:"
echo "VITE_SUPABASE_URL=https://***"
echo "VITE_SUPABASE_ANON_KEY=***"
echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"

echo
success "🎉 Environment Setup abgeschlossen!"
echo
info "Nächste Schritte:"
info "1. Teste die Konfiguration: npm run dev"
info "2. Deployment: ./smart-deploy.sh"
info "3. Bei Problemen: ./quick-fix.sh"

# Optional: Test Supabase connection
echo
read -p "Möchten Sie die Supabase-Verbindung testen? (j/n): " -r
if [[ $REPLY =~ ^[Jj]$ ]]; then
    log "🌐 Teste Supabase-Verbindung..."
    
    # Simple curl test
    if curl -f -s -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/" >/dev/null; then
        success "Supabase-Verbindung erfolgreich!"
    else
        warning "Supabase-Verbindung fehlgeschlagen. Bitte prüfen Sie Ihre Credentials."
    fi
fi
