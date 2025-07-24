# 🚨 502 Bad Gateway - Sofortlösung

## Problem:
```
502 Bad Gateway
```

Das bedeutet: **NGINX läuft, aber die SvelteKit-App auf Port 3000 ist nicht erreichbar!**

## 🔧 Sofortige Lösungen:

### Option 1: SvelteKit App starten (Empfohlen)
```bash
# SSH zum Server
ssh deploy@3.68.110.79

# In das Projektverzeichnis wechseln
cd /var/www/ravetracker-v3

# Alte Prozesse beenden
pkill -f "node.*3000"

# App starten
npm start &

# Status prüfen
curl http://localhost:3000
```

### Option 2: GitHub Actions
1. **"Fix 502 Bad Gateway"** Workflow ausführen
2. Fix Type: **start-app** wählen  
3. Auf dem Server: `bash ~/start_ravetracker_app.sh`

### Option 3: Static Fallback (Keine 502 Fehler mehr)
```bash
# Auf dem Server als root/sudo:
cat > /tmp/nginx-static.conf << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/ravetracker-v3/temp_build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /health {
        return 200 "Static Mode - OK";
        add_header Content-Type text/plain;
    }
}
EOF

sudo cp /tmp/nginx-static.conf /etc/nginx/sites-available/ravetracker-v3
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Diagnose Commands:

### Prüfe ob Port 3000 läuft:
```bash
# Listening ports anzeigen
netstat -tlnp | grep :3000
# oder
ss -tlnp | grep :3000

# Node.js Prozesse anzeigen
ps aux | grep node
```

### Prüfe NGINX Logs:
```bash
# NGINX Error Logs
sudo tail -f /var/log/nginx/error.log

# Speziell nach 502 Fehlern suchen
sudo grep "502\|upstream" /var/log/nginx/error.log
```

### App Logs prüfen:
```bash
# Falls App gestartet wurde
tail -f /var/www/ravetracker-v3/logs/app.log
```

## 🎯 Ursachen für 502:

1. **SvelteKit App läuft nicht** ❌ (Häufigste Ursache)
2. **App läuft auf falschem Port** ❌
3. **App ist abgestürzt** ❌  
4. **NGINX Proxy-Konfiguration falsch** ❌

## ✅ Nach der Reparatur:

### SvelteKit App läuft:
- **Port 3000 Test**: `curl http://localhost:3000`
- **Main Site**: **http://3.68.110.79** (200 OK)
- **Features**: Vollständige SvelteKit Funktionalität

### Static Fallback:
- **Main Site**: **http://3.68.110.79** (200 OK)  
- **Features**: Nur statische Dateien, keine API
- **Vorteil**: Keine 502 Fehler möglich

## 🚀 Empfohlene Reihenfolge:

1. **Versuche App zu starten** (Option 1)
2. **Falls das nicht funktioniert** → Static Fallback (Option 3)
3. **Debug später** mit den Diagnose-Commands

Die **schnellste Lösung** ist meist `npm start` im Projektverzeichnis! 🎉
