# 🚀 RaveTracker v3.0 Smart Deploy System

Ein intelligentes, effizienztes Deploy-System, das nur Änderungen aktualisiert und somit die Downtime minimiert.

## 📋 Übersicht

Das Smart Deploy System analysiert automatisch welche Dateien sich geändert haben und führt nur die notwendigen Schritte aus:

- **Dependencies**: Nur installieren wenn `package.json` oder `package-lock.json` geändert wurde
- **Build**: Nur bauen wenn Code-Dateien (`.js`, `.ts`, `.svelte`, etc.) geändert wurden
- **Atomic Deployment**: Zero-Downtime durch atomischen Switch
- **Automatic Rollback**: Bei Fehlern automatischer Rollback zur vorherigen Version

## 🎯 Features

- ✅ **Inkrementelle Updates** - Nur was sich geändert hat wird aktualisiert
- ✅ **Zero Downtime** - Atomischer Switch zwischen Versionen
- ✅ **Automatic Rollback** - Bei Fehlern automatischer Rollback
- ✅ **Health Checks** - Überprüfung ob die Anwendung läuft
- ✅ **PM2 Integration** - Automatisches Restart des PM2 Prozesses
- ✅ **Manual Override** - Möglichkeit für vollständige Deployments

## 📁 Dateien

```
├── .github/workflows/deploy.yml  # GitHub Actions Workflow
├── smart-deploy.sh              # Server-seitiges Deploy-Skript
├── deploy-local.sh              # Lokales Deploy-Skript
├── rollback.sh                  # Rollback-Skript
├── reset-server.sh              # Server komplett zurücksetzen
├── reset-local.bat              # Lokales Reset (Windows)
├── cleanup-server.sh            # Cleanup alte Deploy-Artifacts
├── quick-fix.sh                 # Schnelle Problembehebung
└── DEPLOY.md                    # Diese Dokumentation
```

## 🚀 Verwendung

### Automatisches Deployment (empfohlen)

```bash
# Einfach Code committen und pushen
git add .
git commit -m "feat: neue Features"
git push origin main
```

Das GitHub Actions Workflow wird automatisch ausgelöst und führt ein intelligentes Deployment durch.

### Manuelles Deployment

```bash
# Vom lokalen Computer aus
./deploy-local.sh
```

### Rollback bei Problemen

```bash
# Auf dem Server ausführen
./rollback.sh
```

### Server komplett zurücksetzen

```bash
# Kompletter Reset des Server-Verzeichnisses
./reset-server.sh
```

### Lokalen Entwicklungsstand zurücksetzen

```batch
REM Auf Windows (lokale Entwicklung)
reset-local.bat
```

### Force Full Deployment

```bash
# Über GitHub Actions (Manual Trigger)
# Gehe zu GitHub → Actions → Deploy → Run workflow
# Setze "Force full deployment" auf true
```

## 🔧 Server Setup

### 1. Verzeichnisstruktur erstellen

```bash
sudo mkdir -p /var/www/ravetracker-v3
sudo chown -R deploy:deploy /var/www/ravetracker-v3
```

### 2. Deploy-Skript ausführbar machen

```bash
cd /var/www/ravetracker-v3
chmod +x smart-deploy.sh
chmod +x rollback.sh
```

### 3. PM2 installieren (falls noch nicht vorhanden)

```bash
npm install -g pm2
```

### 4. Erstes Deployment

```bash
# Manuell das erste Mal ausführen
./smart-deploy.sh
```

## 📊 Deployment-Logik

### Change Detection

Das System erkennt automatisch:

1. **Dependency Changes**: `package.json` oder `package-lock.json` geändert
2. **Build Changes**: Code-Dateien (`.js`, `.ts`, `.svelte`, `.css`, etc.) geändert
3. **Config Changes**: Konfigurationsdateien geändert

### Deployment Steps

1. 📥 **Repository Update** - Fetch latest changes
2. 📦 **Dependencies** - Install nur wenn nötig
3. 🔗 **Environment Setup** - Copy .env und persistent data
4. 🏗️ **Build** - Build nur wenn Code geändert
5. 💾 **Backup** - Backup der aktuellen Version
6. 🔄 **Atomic Switch** - Wechsel zur neuen Version
7. 🔐 **Permissions** - Setze korrekte Berechtigungen
8. 🚀 **Restart** - PM2 Restart
9. 🏥 **Health Check** - Überprüfung der Anwendung

## 🎛️ Environment Variables

Auf dem Server können folgende Umgebungsvariablen gesetzt werden:

```bash
# GitHub Actions setzt diese automatisch
export FORCE_DEPLOY="false"     # Force full deployment
export DEPS_CHANGED="true"      # Dependencies wurden geändert
export BUILD_NEEDED="true"      # Build ist notwendig
export COMMIT_SHA="abc123"      # Git commit hash
```

## 🔍 Monitoring

### Deploy Logs

```bash
# PM2 Logs anzeigen
pm2 logs ravetracker-v3

# Deploy-Status prüfen
pm2 status
```

### Health Check

```bash
# Manueller Health Check
curl http://localhost:3000
```

## 🛡️ Sicherheit

- Deploy-Skripte laufen **NIE** als root
- Automatische Rollback-Mechanismen
- Backup der vorherigen Version
- Health Checks vor Aktivierung

## 📝 Troubleshooting

### Problem: Server in inkonsistentem Zustand

```bash
# Kompletter Reset des Servers
./reset-server.sh
```

### Problem: Alte Deploy-Artifacts stören

```bash
# Cleanup alte Dateien
./cleanup-server.sh
```

### Problem: svelte.config.js Adapter-Fehler

```bash
# Quick Fix anwenden
./quick-fix.sh
```

### Problem: Deployment hängt

```bash
# PM2 Prozess checken
pm2 status

# Logs prüfen
pm2 logs ravetracker-v3

# Manueller Restart
pm2 restart ravetracker-v3
```

### Problem: Build Fehler

```bash
# Dependencies neu installieren
cd /var/www/ravetracker-v3/current
npm ci

# Manual build
npm run build
```

### Problem: Rollback notwendig

```bash
# Rollback zur vorherigen Version
./rollback.sh
```

## 🔄 Migration von altem System

Falls du vom alten Deploy-System migrierst:

1. **Backup erstellen**: Sichere die aktuelle Installation
2. **PM2 stoppen**: `pm2 stop ravetracker-v3`
3. **Neue Skripte hochladen**: Upload der neuen Deploy-Skripte
4. **Erstes Deployment**: `./smart-deploy.sh`

## 🎉 Vorteile des neuen Systems

- **90% weniger Deploy-Zeit** durch inkrementelle Updates
- **Zero Downtime** durch atomischen Switch
- **Automatic Rollback** bei Fehlern
- **Intelligente Change Detection**
- **Einfache Wartung** - nur ein Deploy-Skript statt vielen

## 🔗 Links

- [GitHub Repository](https://github.com/ochtii/ravetracker-v3)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
