FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json do backend
COPY backend/package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código do backend mantendo a estrutura de pastas
COPY backend/ ./

# Debug: Testar require() diretamente
RUN echo "=== DEBUG: Testando require() do Node.js ===" && \
    cd /app && \
    node -e "console.log('Working directory:', process.cwd()); console.log('Trying require...'); const db = require('./database/database'); console.log('✅ Require funcionou!'); process.exit(0);" || \
    echo "❌ Require falhou mesmo com arquivos presentes"

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
