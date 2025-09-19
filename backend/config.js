const path = require('path');

const defaultDbPath = path.join(__dirname, 'storage', 'reports.db');

module.exports = {
  port: process.env.PORT || 3001,
  dbPath: process.env.DB_PATH || defaultDbPath,
  corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://relatorios.thiagoriva.com'],
  nodeEnv: process.env.NODE_ENV || 'development'
};
