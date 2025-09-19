# 🐳 Deploy no Coolify - Sistema de Relatórios Diários

## 🎯 Arquitetura Final:
- **Frontend**: Hostinger (`report.thiagoriva.com`)
- **Backend**: VPS com Coolify (Node.js + SQLite)

## ✅ **Vantagens do Coolify:**
- ✅ **Isolamento completo** via Docker
- ✅ **Não interfere** em outros serviços
- ✅ **SSL automático** via Let's Encrypt
- ✅ **Proxy reverso** automático
- ✅ **Logs centralizados**
- ✅ **Deploy via Git**
- ✅ **Backup automático**

## 📋 Passo a Passo:

### 1️⃣ **Preparar Aplicação para Coolify:**

#### Criar Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json do backend
COPY backend/package*.json ./
RUN npm install --production

# Copiar código do backend
COPY backend/ ./

# Criar diretório para banco de dados
RUN mkdir -p database

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["node", "server.js"]
```

#### Criar docker-compose.yml:
```yaml
version: '3.8'
services:
  daily-report-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_PATH=./database/reports.db
    volumes:
      - ./data:/app/database
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2️⃣ **Configurar no Coolify:**

#### A) Criar Nova Aplicação:
1. **Coolify Dashboard** → **Projects** → **New Resource**
2. **Application** → **Public Repository**
3. **Repository URL**: `https://github.com/seu-usuario/daily-report`
4. **Branch**: `main`
5. **Build Pack**: `Docker`

#### B) Configurações da Aplicação:
- **Name**: `daily-report-api`
- **Domains**: `api.seudominio.com` ou usar subdomínio da VPS
- **Port**: `3000`
- **Health Check**: `/api/health`

#### C) Variáveis de Ambiente:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=sua_chave_jwt_super_secreta_256_bits
DATABASE_PATH=./database/reports.db
```

### 3️⃣ **Deploy:**
1. **Deploy** no Coolify
2. Coolify irá:
   - Fazer pull do repositório
   - Build da imagem Docker
   - Criar container isolado
   - Configurar proxy reverso
   - Gerar SSL automático

### 4️⃣ **Configurar Domínio:**

#### Opção A - Subdomínio da VPS:
- `api-daily-report.sua-vps.com`

#### Opção B - Subdomínio Personalizado:
1. **DNS**: Criar A record `api.thiagoriva.com` → IP da VPS
2. **Coolify**: Adicionar domínio `api.thiagoriva.com`

### 5️⃣ **Inicializar Banco:**
```bash
# Via SSH na VPS
ssh root@sua-vps.com

# Entrar no container
docker exec -it daily-report-api sh

# Criar admin
node scripts/dbAdmin.js createAdmin "Seu Nome" "admin@empresa.com" "senha123"
```

### 6️⃣ **Atualizar Frontend:**
```bash
# URL final da API (exemplo)
echo "REACT_APP_API_URL=https://api.thiagoriva.com/api" > .env.production

# Rebuild
npm run build

# Upload para Hostinger
```

## 🔧 **Estrutura de Arquivos Necessários:**

### Dockerfile (raiz do projeto):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
RUN mkdir -p database
EXPOSE 3000
CMD ["node", "server.js"]
```

### .dockerignore:
```
node_modules
npm-debug.log
.git
.gitignore
README.md
Dockerfile
.dockerignore
src/
build/
public/
```

## 🚀 **Vantagens desta Solução:**

### ✅ **Isolamento Completo:**
- Cada app roda em container separado
- Não interfere em outros serviços
- Recursos dedicados por app

### ✅ **Gerenciamento Fácil:**
- Interface web intuitiva
- Logs em tempo real
- Restart automático
- Updates via Git

### ✅ **Produção-Ready:**
- SSL automático
- Proxy reverso
- Load balancing
- Health checks

### ✅ **Backup e Persistência:**
- Volume para banco SQLite
- Backup automático do Coolify
- Dados persistem entre deploys

## 📊 **Monitoramento:**
- **Logs**: Via interface Coolify
- **Métricas**: CPU, RAM, Network
- **Health**: Status em tempo real
- **Alerts**: Notificações automáticas

## 🔄 **Updates:**
```bash
# Commit mudanças
git add .
git commit -m "Update"
git push

# Coolify detecta automaticamente e redeploy
```

## 💡 **Dica Pro:**
Configure **webhook** no GitHub para deploy automático quando fizer push!
