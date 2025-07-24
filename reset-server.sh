#!/bin/bash

# RaveTracker v3.0 Server Reset Script
# Setzt das komplette Server-Verzeichnis zurück für einen Neustart

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
PM2_APP_NAME="ravetracker-v3"
BACKUP_DIR="/tmp/ravetracker-backup-$(date +%Y%m%d_%H%M%S)"

echo
echo -e "${CYAN}🔄 RaveTracker v3.0 Server Reset${NC}"
echo -e "${CYAN}================================${NC}"
echo
warning "ACHTUNG: Dies wird das komplette Server-Verzeichnis zurücksetzen!"
echo
info "Backup wird erstellt unter: $BACKUP_DIR"
echo

# Confirmation prompt
read -p "Sind Sie sicher, dass Sie fortfahren möchten? (ja/nein): " -r
if [[ ! $REPLY =~ ^[Jj][Aa]$ ]]; then
    echo "Abgebrochen."
    exit 0
fi

echo

log "🛑 Stoppe alle laufenden Services..."

# Stop PM2 processes
if command -v pm2 >/dev/null 2>&1; then
    log "   - Stoppe PM2 Prozesse..."
    pm2 stop all 2>/dev/null || warning "Keine PM2 Prozesse gefunden"
    
    if pm2 show "$PM2_APP_NAME" >/dev/null 2>&1; then
        pm2 delete "$PM2_APP_NAME" || warning "Konnte PM2 Prozess nicht löschen"
    fi
    
    success "PM2 Prozesse gestoppt"
else
    warning "PM2 nicht gefunden"
fi

# Stop any Node.js processes on port 3000
log "   - Prüfe Port 3000..."
if command -v lsof >/dev/null 2>&1; then
    PID=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$PID" ]; then
        log "   - Stoppe Prozess auf Port 3000 (PID: $PID)..."
        kill -TERM "$PID" 2>/dev/null || true
        sleep 2
        kill -KILL "$PID" 2>/dev/null || true
        success "Port 3000 freigegeben"
    fi
fi

# Create backup if directory exists
if [ -d "$APP_PATH" ]; then
    log "💾 Erstelle Backup des aktuellen Verzeichnisses..."
    mkdir -p "$(dirname "$BACKUP_DIR")"
    cp -r "$APP_PATH" "$BACKUP_DIR" 2>/dev/null || warning "Backup konnte nicht vollständig erstellt werden"
    success "Backup erstellt: $BACKUP_DIR"
fi

# Remove the entire application directory
log "🗑️  Entferne komplettes Anwendungsverzeichnis..."
if [ -d "$APP_PATH" ]; then
    rm -rf "$APP_PATH"
    success "Verzeichnis $APP_PATH entfernt"
fi

# Recreate directory structure
log "📁 Erstelle neue Verzeichnisstruktur..."
mkdir -p "$APP_PATH"
mkdir -p "$APP_PATH/logs"

# Set correct ownership
log "🔐 Setze Berechtigungen..."
if id "deploy" &>/dev/null; then
    chown -R deploy:deploy "$APP_PATH"
    success "Berechtigungen für deploy User gesetzt"
elif id "www-data" &>/dev/null; then
    chown -R www-data:www-data "$APP_PATH"
    success "Berechtigungen für www-data User gesetzt"
else
    warning "Weder deploy noch www-data User gefunden"
fi

# Set directory permissions
chmod 755 "$APP_PATH"
chmod 755 "$APP_PATH/logs"

success "Verzeichnisstruktur erstellt"

# Clean PM2 configuration
if command -v pm2 >/dev/null 2>&1; then
    log "🧹 Bereinige PM2 Konfiguration..."
    pm2 save --force >/dev/null 2>&1 || true
    success "PM2 Konfiguration bereinigt"
fi

# Remove any systemd services (if they exist)
log "🔍 Prüfe systemd Services..."
if systemctl list-units --type=service | grep -q ravetracker; then
    log "   - Entferne systemd Services..."
    systemctl stop ravetracker* 2>/dev/null || true
    systemctl disable ravetracker* 2>/dev/null || true
    rm -f /etc/systemd/system/ravetracker* 2>/dev/null || true
    systemctl daemon-reload
    success "systemd Services entfernt"
fi

# Clear any nginx configurations (optional)
if [ -f "/etc/nginx/sites-available/ravetracker" ] || [ -f "/etc/nginx/sites-enabled/ravetracker" ]; then
    log "ℹ️  NGINX Konfigurationsdateien gefunden:"
    ls -la /etc/nginx/sites-*/ravetracker* 2>/dev/null || true
    echo
    warning "NGINX Konfiguration nicht automatisch entfernt."
    info "Bitte manuell prüfen und anpassen falls nötig."
fi

echo
success "🎉 Server Reset erfolgreich abgeschlossen!"
echo
log "📋 Zusammenfassung:"
log "   ✅ PM2 Prozesse gestoppt"
log "   ✅ Verzeichnis $APP_PATH zurückgesetzt"
log "   ✅ Backup erstellt: $BACKUP_DIR"
log "   ✅ Neue Verzeichnisstruktur erstellt"
log "   ✅ Berechtigungen gesetzt"
echo
log "🚀 Nächste Schritte:"
log "   1. Neue Deploy-Skripte hochladen"
log "   2. chmod +x smart-deploy.sh"
log "   3. Erstes Deployment: ./smart-deploy.sh"
echo
info "Der Server ist jetzt bereit für eine saubere Neuinstallation!"

# Show system information
echo
log "📊 System Information:"
log "   - Hostname: $(hostname)"
log "   - User: $(whoami)"
log "   - Working Directory: $(pwd)"
log "   - Available Space: $(df -h $APP_PATH | tail -1 | awk '{print $4}')"
log "   - Node Version: $(node --version 2>/dev/null || echo 'Not installed')"
log "   - NPM Version: $(npm --version 2>/dev/null || echo 'Not installed')"
log "   - PM2 Version: $(pm2 --version 2>/dev/null || echo 'Not installed')"
