# Server Setup Commands

# Auf dem Linux-Server ausführen:

# 1. Cleanup alte Deploy-Artifacts (falls vorhanden)
chmod +x cleanup-server.sh
./cleanup-server.sh

# 2. Deploy-Skripte ausführbar machen
chmod +x smart-deploy.sh
chmod +x deploy-local.sh  
chmod +x rollback.sh

# 3. Verzeichnisstruktur erstellen (falls noch nicht vorhanden)
sudo mkdir -p /var/www/ravetracker-v3
sudo chown -R deploy:deploy /var/www/ravetracker-v3

# 4. PM2 installieren (falls nicht vorhanden)
npm install -g pm2

# 5. Erstes Deployment
./smart-deploy.sh
