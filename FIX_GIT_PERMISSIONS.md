# 🚨 Git Permission Denied - Sofortlösung

## Problem:
```
error: cannot open '.git/FETCH_HEAD': Permission denied
```

## 🔧 Sofortige Lösungen:

### Option 1: Berechtigungen reparieren (Schnellste Lösung)
```bash
# Auf dem Server als deploy user oder root:
cd /var/www/ravetracker-v3

# Ownership auf deploy user setzen
sudo chown -R deploy:deploy .
sudo chown -R deploy:deploy .git/

# Berechtigungen setzen
sudo chmod -R 755 .
sudo chmod -R 644 .git/objects/
sudo chmod -R 755 .git/refs/

# Git-spezifische Dateien
sudo chmod 664 .git/FETCH_HEAD 2>/dev/null || echo "FETCH_HEAD will be created"
sudo chmod 664 .git/HEAD

# Testen
git status
git pull origin main
```

### Option 2: Git Repository neu initialisieren
```bash
# Auf dem Server:
cd /var/www/ravetracker-v3

# Backup der aktuellen .git
sudo mv .git .git.backup

# Neu initialisieren
git init
git remote add origin https://github.com/ochtii/ravetracker-v3.git
git fetch origin main
git reset --hard origin/main
git branch --set-upstream-to=origin/main main

# Ownership setzen
sudo chown -R deploy:deploy .git/

# Testen
git pull origin main
```

### Option 3: GitHub Actions
1. **"Fix Git Permissions"** Workflow ausführen
2. Fix Type: **full-fix** wählen
3. Scripts werden automatisch erstellt und sind bereit zur Ausführung

## 🔍 Diagnose Commands:

### Git Status prüfen:
```bash
# Aktuelle Berechtigungen anzeigen
ls -la .git/

# Git Repository Status
git status

# Remote Repository Info
git remote -v
```

### Berechtigungen prüfen:
```bash
# Wer gehört das Verzeichnis?
ls -ld /var/www/ravetracker-v3/

# .git Verzeichnis Besitzer
ls -ld /var/www/ravetracker-v3/.git/

# Aktuelle User Info
whoami
id
groups
```

## 🎯 Warum passiert das?

1. **Falsche Ownership** ❌
   - `.git` Verzeichnis gehört root oder anderem User
   - `deploy` User kann nicht schreiben

2. **Falsche Berechtigungen** ❌
   - Git-Dateien sind nicht schreibbar
   - Verzeichnisse nicht durchsuchbar

3. **Mixed Ownership** ❌
   - Verschiedene Dateien gehören verschiedenen Usern

## ✅ Nach der Reparatur:

### Funktionierende Git Commands:
```bash
# Basic Operations
git status
git pull origin main
git fetch origin main
git log --oneline -5

# Deployment
git pull origin main
npm install
npm run build
```

### Vermeide zukünftige Probleme:
```bash
# Immer als deploy user arbeiten
sudo -u deploy git pull origin main

# Oder ownership nach root-Operationen reparieren
sudo chown -R deploy:deploy /var/www/ravetracker-v3/
```

## 🚀 Nach erfolgreicher Reparatur:

- **Git Pull**: `git pull origin main` funktioniert
- **Deployment**: Automatische Updates möglich  
- **Ownership**: Alles gehört dem deploy user
- **Permissions**: Korrekte Git-Berechtigungen gesetzt

Die **schnellste Lösung** ist meist das Setzen der korrekten Ownership! 🔧✨
