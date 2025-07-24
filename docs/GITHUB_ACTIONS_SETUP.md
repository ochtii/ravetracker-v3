# 🚀 GitHub Actions Auto-Deployment Setup llol

## 📋 Benötigte GitHub Secrets:

Gehe zu: `https://github.com/ochtii/ravetracker-v3/settings/secrets/actions`

### 1. SSH_PRIVATE_KEY
```bash
# Auf Windows (Git Bash oder PowerShell):
cat ~/.ssh/id_ed25519
# Kopiere den KOMPLETTEN Inhalt (inklusive -----BEGIN/END-----)
```

### 2. SERVER_HOST
```
# Deine Server IP-Adresse:
your-server-ip-address
```

### 3. SERVER_USER
```
deploy
```

## 🔍 Auto-Deployment Status prüfen:

### Option A: GitHub Actions Tab
1. Gehe zu: https://github.com/ochtii/ravetracker-v3/actions
2. Siehst du "Deploy to Production" Workflows?
3. Sind sie ✅ grün oder ❌ rot?

### Option B: Server Logs
```bash
# SSH auf Server:
ssh deploy@your-server-ip

# PM2 Logs prüfen:
pm2 logs ravetracker-v3

# Deployment History:
ls -la /var/www/ravetracker-v3/releases/
```

### Option C: Test Push
```bash
# Kleine Änderung committen:
echo "# Test Auto-Deploy $(date)" >> README.md
git add README.md
git commit -m "test: Auto-deployment test"
git push origin main

# Dann auf GitHub Actions Tab schauen!
```

## 📊 Deployment Triggers:

- **✅ Automatisch:** Jeder `git push` auf `main` branch
- **🎯 Manuell:** GitHub Actions → "Run workflow" Button
- **🔧 SSH:** `ssh deploy@server && cd /var/www/ravetracker-v3 && ./deploy.sh`

## 🚨 Troubleshooting:

### GitHub Actions failed?
1. Check Secrets sind richtig eingestellt
2. SSH Key funktioniert: `ssh -i ~/.ssh/id_ed25519 deploy@server-ip`
3. Server deploy.sh ist ausführbar: `chmod +x deploy.sh`

### Kein Auto-Deploy?
1. .github/workflows/deploy.yml im Repository?
2. GitHub Actions aktiviert in Repository Settings?
3. Push auf `main` branch (nicht andere branches)?
