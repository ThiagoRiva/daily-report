# 🚀 Guia de Deploy para Produção - Sistema de Relatórios Diários

## 📋 Pré-requisitos

### No Servidor de Produção:
- **Node.js** versão 16 ou superior
- **npm** ou **yarn**
- **PM2** (gerenciador de processos)
- **Nginx** (servidor web/proxy reverso)
- **Certificado SSL** (Let's Encrypt recomendado)

## 🔧 Passo 1: Preparar a Aplicação

### 1.1 Build do Frontend
```bash
# Na pasta do projeto
cd /home/thiagoriva/Documents/Projects/daily-report
yarn build
```

### 1.2 Configurar Variáveis de Ambiente
Criar arquivo `.env.production`:
```bash
# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_256_bits
DATABASE_PATH=/var/www/daily-report/database/reports.db

# Frontend (durante o build)
REACT_APP_API_URL=https://seudominio.com/api
```

## 🖥️ Passo 2: Configuração do Servidor

### 2.1 Estrutura de Diretórios no Servidor
```bash
# Criar estrutura no servidor
sudo mkdir -p /var/www/daily-report
sudo chown $USER:$USER /var/www/daily-report
```

### 2.2 Upload dos Arquivos
```bash
# Copiar arquivos para o servidor (via scp, rsync, ou git)
# Exemplo com rsync:
rsync -avz --exclude node_modules --exclude .git ./ usuario@servidor:/var/www/daily-report/
```

### 2.3 Instalar Dependências no Servidor
```bash
# No servidor
cd /var/www/daily-report
npm install --production
cd backend && npm install --production
```

## 🗄️ Passo 3: Configuração do Banco de Dados

### 3.1 Inicializar Banco em Produção
```bash
cd /var/www/daily-report/backend
node scripts/initDatabase.js
```

### 3.2 Criar Usuário Administrador
```bash
node scripts/createUser.js
# Ou usar o script interativo:
node scripts/dbAdmin.js createAdmin "Seu Nome" "admin@empresa.com" "senhaSegura123"
```

## 🔄 Passo 4: Gerenciamento de Processos (PM2)

### 4.1 Instalar PM2
```bash
sudo npm install -g pm2
```

### 4.2 Configurar PM2
Criar arquivo `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'daily-report-api',
    script: './backend/server.js',
    cwd: '/var/www/daily-report',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    error_file: '/var/log/daily-report/api-error.log',
    out_file: '/var/log/daily-report/api-out.log',
    log_file: '/var/log/daily-report/api-combined.log',
    time: true
  }]
};
```

### 4.3 Iniciar Aplicação
```bash
# Criar diretório de logs
sudo mkdir -p /var/log/daily-report
sudo chown $USER:$USER /var/log/daily-report

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Passo 5: Configuração do Nginx

### 5.1 Configurar Nginx
Criar arquivo `/etc/nginx/sites-available/daily-report`:
```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;
    
    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Servir arquivos estáticos do React
    location / {
        root /var/www/daily-report/build;
        try_files $uri $uri/ /index.html;
        
        # Cache para arquivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy para API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Ativar Configuração
```bash
sudo ln -s /etc/nginx/sites-available/daily-report /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Passo 6: SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔐 Passo 7: Segurança e Backup

### 7.1 Configurar Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 7.2 Script de Backup Automático
```bash
# Criar script de backup
cat > /var/www/daily-report/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/daily-report"
mkdir -p $BACKUP_DIR

# Backup do banco de dados
cp /var/www/daily-report/backend/database/reports.db $BACKUP_DIR/reports_$DATE.db

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "reports_*.db" -mtime +7 -delete
EOF

chmod +x /var/www/daily-report/backup.sh

# Agendar backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/daily-report/backup.sh") | crontab -
```

## 📊 Passo 8: Monitoramento

### 8.1 Comandos Úteis
```bash
# Status da aplicação
pm2 status
pm2 logs daily-report-api

# Reiniciar aplicação
pm2 restart daily-report-api

# Status do Nginx
sudo systemctl status nginx

# Verificar logs do sistema
sudo journalctl -u nginx -f
```

## 🔄 Passo 9: Atualizações

### 9.1 Script de Deploy
```bash
cat > /var/www/daily-report/deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando deploy..."

# Fazer backup
./backup.sh

# Atualizar código (se usando git)
git pull origin main

# Instalar dependências
npm install --production
cd backend && npm install --production && cd ..

# Build do frontend
npm run build

# Reiniciar aplicação
pm2 restart daily-report-api

echo "✅ Deploy concluído!"
EOF

chmod +x /var/www/daily-report/deploy.sh
```

## 📱 Passo 10: Acesso ao Banco de Dados em Produção

### 10.1 Comandos de Administração
```bash
# Listar usuários
cd /var/www/daily-report/backend
node scripts/dbAdmin.js users

# Criar novo admin
node scripts/dbAdmin.js createAdmin "Nome" "email@empresa.com" "senha"

# Resetar senha
node scripts/dbAdmin.js resetPassword "email@empresa.com" "novaSenha"

# Backup manual
node scripts/dbAdmin.js backup

# Estatísticas
node scripts/dbAdmin.js stats
```

## ✅ Checklist Final

- [ ] Build do React criado
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivos enviados para o servidor
- [ ] Dependências instaladas
- [ ] Banco de dados inicializado
- [ ] Usuário admin criado
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Monitoramento funcionando

## 🆘 Solução de Problemas

### Aplicação não inicia:
```bash
pm2 logs daily-report-api
```

### Erro 502 Bad Gateway:
- Verificar se a API está rodando na porta 3001
- Verificar configuração do Nginx

### Problemas de permissão:
```bash
sudo chown -R $USER:$USER /var/www/daily-report
```

### Banco de dados corrompido:
```bash
# Restaurar backup mais recente
cp /var/backups/daily-report/reports_YYYYMMDD_HHMMSS.db /var/www/daily-report/backend/database/reports.db
pm2 restart daily-report-api
```

---

**⚠️ Importante**: Substitua `seudominio.com` pelo seu domínio real e configure senhas seguras para produção!
