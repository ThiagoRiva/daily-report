FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json do backend
COPY backend/package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código do backend
COPY backend/ ./

# Criar diretório para banco de dados
RUN mkdir -p database

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Dar permissões ao usuário
RUN chown -R backend:nodejs /app
USER backend

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Comando de inicialização
CMD ["node", "server.js"]
