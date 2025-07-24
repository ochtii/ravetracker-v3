# Server Setup Commands

# Auf dem Linux-Server ausführen:

# 1. Deploy-Skripte ausführbar machen
chmod +x smart-deploy.sh
chmod +x deploy-local.sh  
chmod +x rollback.sh

# 2. Verzeichnisstruktur erstellen
sudo mkdir -p /var/www/ravetracker-v3
sudo chown -R deploy:deploy /var/www/ravetracker-v3

# 3. PM2 installieren (falls nicht vorhanden)
npm install -g pm2

# 4. Erstes Deployment
./smart-deploy.sh
