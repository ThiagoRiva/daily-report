// Configuração de ambiente
export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development'
};

export default config;
