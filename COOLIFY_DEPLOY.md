# 🚀 Deploy com Coolify - Sistema de Relatórios Diários

Este guia detalha como fazer o deploy do backend na VPS usando Coolify e manter o frontend na Hostinger.

## 📋 Arquitetura Final

```
Frontend (Hostinger)     Backend (VPS + Coolify)
report.thiagoriva.com ←→ api-daily-report.seu-dominio.com
```

## 🔧 Pré-requisitos

- ✅ VPS com Coolify instalado
- ✅ Domínio configurado (ou IP da VPS)
- ✅ GitHub repository público: https://github.com/ThiagoRiva/daily-report
- ✅ Hostinger com subdomínio report.thiagoriva.com

## 🚀 Passo 1: Configurar Aplicação no Coolify

### 1.1 Criar Nova Aplicação
1. Acesse seu painel Coolify
2. Clique em **"New Resource"** → **"Application"**
3. Escolha **"Public Repository"**

### 1.2 Configurar Repository
- **Repository URL**: `https://github.com/ThiagoRiva/daily-report`
- **Branch**: `main`
- **Build Pack**: `Dockerfile`
- **Dockerfile Location**: `./Dockerfile`

### 1.3 Configurações Essenciais

#### General Settings:
- **Name**: `daily-report`
- **Description**: `Sistema de Relatórios Diários - Backend API`

#### Domains:
- Configure seu domínio ou use o IP da VPS
- Exemplo: `api-daily-report.seu-dominio.com`
- Ou: `SEU_IP:3000`

#### Build Settings:
- **Build Pack**: `Dockerfile`
- **Base Directory**: `/` (raiz do projeto)
- **Dockerfile Location**: `./Dockerfile`

#### Environment Variables:
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=MUDE_ESTA_CHAVE_SEGURA_256_BITS
DATABASE_PATH=./database/reports.db
```

#### Network Settings:
- **Port Exposes**: `3000`
- **Port Mapping**: `3000:3000`

#### Health Check:
- ✅ **Enable Health Check**
- **Path**: `/api/health`
- **Port**: `3000`
- **Interval**: `30s`
- **Timeout**: `10s`
- **Retries**: `3`
- **Start Period**: `5s`

### 1.4 Deploy
1. Clique em **"Deploy"**
2. Acompanhe os logs de build
3. Aguarde o health check passar

## 🔍 Troubleshooting Deployment

### Problema: Health Check Failed
**Sintoma**: "New container is not healthy, rolling back"

**Soluções**:
1. Verificar se curl está instalado no container (✅ já corrigido)
2. Confirmar endpoint `/api/health` está respondendo
3. Verificar logs do container

### Problema: Build Failed
**Sintoma**: Erro durante o build

**Soluções**:
1. Verificar se o Dockerfile está correto
2. Confirmar dependências no package.json
3. Verificar logs de build

### Problema: Container Restart Loop
**Sintoma**: Container reinicia constantemente

**Soluções**:
1. Verificar variáveis de ambiente
2. Conferir permissões de arquivo
3. Verificar logs de aplicação

## 🌐 Passo 2: Configurar Frontend (Hostinger)

### 2.1 Configurar URL da API
Execute no seu computador:
```bash
./configure-api-url.sh
```

Quando solicitado, digite a URL da API:
- Se usando domínio: `https://api-daily-report.seu-dominio.com/api`
- Se usando IP: `http://SEU_IP:3000/api`

### 2.2 Upload do Frontend
1. Acesse o hPanel da Hostinger
2. Vá para **Gerenciador de Arquivos**
3. Navegue até `public_html/report/`
4. Exclua conteúdo atual (se houver)
5. Faça upload do conteúdo da pasta `build/`

### 2.3 Configurar .htaccess
Certifique-se que existe o arquivo `.htaccess` em `public_html/report/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

## 🔐 Passo 3: Configurar Usuário Admin

### 3.1 Via Coolify Terminal
1. No painel Coolify, acesse sua aplicação
2. Vá para **"Terminal"** ou **"Console"**
3. Execute:
```bash
cd /app
node scripts/dbAdmin.js createAdmin "Admin" "admin@empresa.com" "senha123"
```

### 3.2 Via Script Local (alternativo)
Se tiver acesso SSH à VPS:
```bash
# SSH na VPS
ssh user@seu-vps

# Encontrar container
docker ps | grep daily-report

# Executar comando no container
docker exec -it CONTAINER_ID node scripts/dbAdmin.js createAdmin "Admin" "admin@empresa.com" "senha123"
```

## 📊 Passo 4: Testar Aplicação

### 4.1 Testar Backend
```bash
# Health check
curl https://api-daily-report.seu-dominio.com/api/health

# Ou com IP
curl http://SEU_IP:3000/api/health

# Resposta esperada:
{
  "status": "ok",
  "timestamp": "2024-XX-XX...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 4.2 Testar Frontend
1. Acesse: https://report.thiagoriva.com
2. Faça login com as credenciais do admin
3. Teste as funcionalidades principais

## 🔄 Passo 5: Monitoramento

### 5.1 Logs no Coolify
- Acesse **"Logs"** na aplicação
- Monitore erros e performance
- Configure alertas se necessário

### 5.2 Backup Automático
Configure backup do volume do banco:
```bash
# No Coolify, configurar volume persistente
# Volume: app_data:/app/database
```

## 🚨 Comandos de Emergência

### Restart da Aplicação
No painel Coolify:
1. Vá para sua aplicação
2. Clique em **"Restart"**

### Rollback
No painel Coolify:
1. Vá para **"Deployments"**
2. Selecione versão anterior
3. Clique em **"Redeploy"**

### Logs em Tempo Real
```bash
# Via SSH na VPS
docker logs -f CONTAINER_ID
```

## 📋 Checklist Final

- [ ] Backend deployado no Coolify
- [ ] Health check passando
- [ ] Domínio/IP configurado
- [ ] Frontend atualizado na Hostinger
- [ ] Usuário admin criado
- [ ] Testes de login funcionando
- [ ] Dados sendo salvos corretamente
- [ ] Backup configurado

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique logs do Coolify**
2. **Teste endpoints manualmente**
3. **Confirme variáveis de ambiente**
4. **Verifique conectividade de rede**

---

## 📞 URLs Importantes

- **Frontend**: https://report.thiagoriva.com
- **Backend**: https://api-daily-report.seu-dominio.com
- **Health Check**: https://api-daily-report.seu-dominio.com/api/health
- **GitHub**: https://github.com/ThiagoRiva/daily-report