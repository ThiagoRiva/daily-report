module.exports = {
  port: process.env.PORT || 3001,
  dbPath: process.env.DB_PATH || './database/reports.db',
  corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://report.thiagoriva.com'],
  nodeEnv: process.env.NODE_ENV || 'development'
};
