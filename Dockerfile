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

# Health check removido - será gerenciado pelo Coolify

# Comando de inicialização
CMD ["node", "server.js"]
