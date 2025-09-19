// Configuração para PM2 (gerenciador de processos Node.js)
const path = require('path');

const dbPath = path.join(__dirname, '..', 'storage', 'reports.db');

module.exports = {
  apps: [{
    name: 'daily-report-api',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_PATH: dbPath
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
