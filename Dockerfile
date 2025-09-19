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

# Garantir que todos os diretórios necessários existem
RUN mkdir -p database

# Temporariamente removendo usuario nao-root para testar
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S backend -u 1001
# RUN chown -R backend:nodejs /app
# USER backend

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
