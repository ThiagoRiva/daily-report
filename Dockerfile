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

# Debug: Verificar estrutura após COPY
RUN echo "=== DEBUG: Listando estrutura de arquivos ===" && \
    find /app -type f -name "*.js" | head -20 && \
    echo "=== DEBUG: Conteúdo do diretório /app ===" && \
    ls -la /app && \
    echo "=== DEBUG: Testando se database.js existe ===" && \
    test -f /app/database/database.js && echo "✅ database.js encontrado" || echo "❌ database.js NÃO encontrado" && \
    echo "=== DEBUG: Listando /app/database/ ===" && \
    ls -la /app/database/ || echo "❌ Diretório database não existe"

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
