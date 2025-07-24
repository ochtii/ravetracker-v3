// PM2 Ecosystem Configuration Example für RaveTracker v3.0
// Diese Datei dient als Template
//
// Verwendung:
// 1. Kopiere: cp ecosystem.config.example.js ecosystem.config.production.js  
// 2. Passe server-spezifische Werte an
// 3. ecosystem.config.production.js wird von .gitignore ignoriert

export default {
  apps: [
    {
      // App Configuration
      name: 'ravetracker-v3',
      script: './build/index.js', // adapter-node erstellt index.js
      
      // Working Directory - ANPASSEN falls nötig
      cwd: '/var/www/ravetracker-v3/current',
      
      // Process Management
      instances: 1, // ANPASSEN: 'max' für alle CPU Cores
      exec_mode: 'cluster', // oder 'fork' für single instance
      
      // Auto-restart Configuration
      watch: false, // NICHT für Production
      max_memory_restart: '1G', // ANPASSEN je nach Server RAM
      
      // Environment Variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '127.0.0.1'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000, // ANPASSEN falls anderer Port gewünscht
        HOST: '0.0.0.0'
        // Weitere ENV Vars werden aus .env.production gelesen
      },
      
      // Logging - ANPASSEN Pfade falls nötig
      log_file: '/var/www/ravetracker-v3/shared/logs/combined.log',
      out_file: '/var/www/ravetracker-v3/shared/logs/out.log',
      error_file: '/var/www/ravetracker-v3/shared/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced Options
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      
      // Health Check
      health_check_grace_period: 10000,
      
      // Restart Conditions
      min_uptime: '10s',
      max_restarts: 10,
      
      // Source Map Support (für bessere Error Logs)
      source_map_support: true,
      
      // Graceful Shutdown
      kill_retry_time: 100
    }
  ],
  
  // Deployment Configuration (optional)
  deploy: {
    production: {
      // ANPASSEN: SSH User und Host
      user: 'deploy',
      host: ['your-server-ip-or-domain'],
      
      // ANPASSEN: Repository URL
      repo: 'https://github.com/your-username/ravetracker-v3.git',
      ref: 'origin/main',
      
      // ANPASSEN: Pfade auf Server
      path: '/var/www/ravetracker-v3',
      
      // Post-deploy commands
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save',
      
      // Environment Variables für Deployment
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
