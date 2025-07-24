# Server Setup Commands

# Auf dem Linux-Server ausführen:

# 1. Cleanup alte Deploy-Artifacts (falls vorhanden)
chmod +x cleanup-server.sh
./cleanup-server.sh

# 2. Environment Setup (WICHTIG: .env Datei konfigurieren)
chmod +x setup-env.sh
./setup-env.sh

# 3. Deploy-Skripte ausführbar machen
chmod +x smart-deploy.sh
chmod +x deploy-local.sh  
chmod +x rollback.sh
chmod +x reset-server.sh
chmod +x quick-fix.sh

# 4. Verzeichnisstruktur erstellen (falls noch nicht vorhanden)
sudo mkdir -p /var/www/ravetracker-v3
sudo chown -R deploy:deploy /var/www/ravetracker-v3

# 5. PM2 installieren (falls nicht vorhanden)
npm install -g pm2

# 6. Erstes Deployment
./smart-deploy.sh
