// PM2 Ecosystem Configuration für RaveTracker v3.0
// CommonJS Version für bessere Kompatibilität mit PM2

module.exports = {
  apps: [
    {
      name: 'ravetracker-v3',
      script: './build/index.js',
      cwd: '/var/www/ravetracker-v3/current',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 8000
    }
  ]
};
