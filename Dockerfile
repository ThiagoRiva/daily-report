FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Copiar todo o projeto
COPY . /app

# Definir diretório de trabalho
WORKDIR /app/backend

# Instalar dependências
RUN npm install --production

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
