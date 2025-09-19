module.exports = {
  apps: [{
    name: 'daily-report-api',
    script: './backend/server.js',
    cwd: './public_html/daily-report',
    env: {
      NODE_ENV: 'production',
      PORT: 3000, // Porta padrão da Hostinger
      JWT_SECRET: 'sua_chave_jwt_super_secreta_aqui_256_bits_mude_em_producao',
      DATABASE_PATH: './backend/storage/reports.db',
      DB_PATH: './backend/storage/reports.db'
    },
    instances: 1,
    exec_mode: 'fork', // Fork ao invés de cluster para Hostinger
    watch: false,
    max_memory_restart: '200M', // Limite menor para shared hosting
    time: true,
    restart_delay: 1000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
