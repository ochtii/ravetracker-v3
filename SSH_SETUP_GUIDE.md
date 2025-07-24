# 🔐 SSH Keys für GitHub Actions Setup

## Ihre SSH-Keys:

### ✅ Public Key (für den Server):
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID6agAsv7vpXLnpWeR1Ipc2BpYirRUisP5SSG2+ESUxf deploy@ravetracker
```

### ✅ Private Key (für GitHub Secret):
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACA+moALL+76Vy56VnkdSKXNgaWIq0VIrD+UkhtvhElMXwAAAJiyeqcZsnqn
GQAAAAtzc2gtZWQyNTUxOQAAACA+moALL+76Vy56VnkdSKXNgaWIq0VIrD+UkhtvhElMXw
AAAECEeXCe84FsP8PJ12j3iL/a/0Xx51RErM2fWTaiHYfulz6agAsv7vpXLnpWeR1Ipc2B
pYirRUisP5SSG2+ESUxfAAAAEmRlcGxveUByYXZldHJhY2tlcgECAw==
-----END OPENSSH PRIVATE KEY-----
```

## 📋 GitHub Secrets Konfiguration:

### 1. GitHub Repository öffnen:
- Gehen Sie zu: https://github.com/ochtii/ravetracker-v3
- Klicken Sie auf **Settings** (oben rechts)
- Im linken Menü: **Secrets and variables** → **Actions**

### 2. Folgende Secrets erstellen:

#### `SSH_KEY` (WICHTIG!)
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACA+moALL+76Vy56VnkdSKXNgaWIq0VIrD+UkhtvhElMXwAAAJiyeqcZsnqn
GQAAAAtzc2gtZWQyNTUxOQAAACA+moALL+76Vy56VnkdSKXNgaWIq0VIrD+UkhtvhElMXw
AAAECEeXCe84FsP8PJ12j3iL/a/0Xx51RErM2fWTaiHYfulz6agAsv7vpXLnpWeR1Ipc2B
pYirRUisP5SSG2+ESUxfAAAAEmRlcGxveUByYXZldHJhY2tlcgECAw==
-----END OPENSSH PRIVATE KEY-----
```

#### `HOST`
- Ihre Server IP-Adresse oder Domain
- Beispiel: `192.168.1.100` oder `your-server.com`

#### `USERNAME` 
- SSH-Benutzername auf Ihrem Server
- Beispiel: `ubuntu`, `root`, `deploy`

#### `PORT` (Optional)
- SSH-Port (Standard: 22)
- Beispiel: `22`

## 🖥️ Server Setup:

### Public Key auf dem Server installieren:
```bash
# Auf Ihrem Server ausführen:
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID6agAsv7vpXLnpWeR1Ipc2BpYirRUisP5SSG2+ESUxf deploy@ravetracker" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Projektverzeichnis erstellen:
```bash
# Deployment-Verzeichnis erstellen
sudo mkdir -p /var/www/ravetracker-v3
sudo chown $USER:$USER /var/www/ravetracker-v3
```

## 🧪 Verbindung testen:

### Lokal testen:
```bash
# SSH-Verbindung von Ihrem Computer testen
ssh -i C:\Users\[IhrBenutzername]\.ssh\ravetracker_deploy [username]@[server-ip]
```

### GitHub Actions Test:
1. Gehen Sie zu **Actions** → **SSH Connection Troubleshooting**
2. Klicken Sie **Run workflow**
3. Wählen Sie "secrets-check" aus
4. Klicken Sie **Run workflow**

## ⚠️ Wichtige Hinweise:

- ✅ Private Key KOMPLETT kopieren (inklusive BEGIN/END Zeilen)
- ✅ Public Key auf dem Server in `~/.ssh/authorized_keys` einfügen
- ✅ Korrekte Berechtigungen für SSH-Dateien setzen
- ✅ Server-IP und Username korrekt in GitHub Secrets eintragen

## 🔍 Troubleshooting:

**"missing server host"** → HOST Secret ist leer
**"Permission denied"** → Public Key nicht auf Server oder falscher Username
**"Connection timeout"** → Server nicht erreichbar oder falscher Port

---

*Generiert am: 24.07.2025 - RaveTracker v3.0*
