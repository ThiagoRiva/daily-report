const path = require('path');

const defaultDbPath = path.resolve(__dirname, '..', 'storage', 'reports.db');
const envDbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : null;

module.exports = {
  port: process.env.PORT || 3001,
  dbPath: envDbPath || defaultDbPath,
  corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://relatorios.thiagoriva.com'],
  nodeEnv: process.env.NODE_ENV || 'development'
};
