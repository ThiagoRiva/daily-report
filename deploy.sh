#!/bin/bash

# Script de Deploy para Hostinger
# Execute este script para preparar os arquivos para upload

echo "🚀 Iniciando processo de deploy..."

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf build/
rm -rf backend/logs/

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
yarn install

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
yarn install
cd ..

# Build do frontend para produção
echo "🏗️ Construindo frontend para produção..."
REACT_APP_API_URL="https://report.thiagoriva.com/api" yarn build

# Criar estrutura de deploy
echo "📁 Criando estrutura de deploy..."
mkdir -p deploy/public_html
mkdir -p deploy/api
mkdir -p deploy/api/database
mkdir -p deploy/api/logs

# Copiar arquivos do frontend (build)
echo "📋 Copiando arquivos do frontend..."
cp -r build/* deploy/public_html/

# Copiar arquivos do backend
echo "📋 Copiando arquivos do backend..."
cp backend/server.js deploy/api/
cp backend/config.js deploy/api/
cp -r backend/database deploy/api/
cp backend/package.json deploy/api/
cp backend/yarn.lock deploy/api/
cp backend/ecosystem.config.js deploy/api/

# Criar arquivo .htaccess para SPA (Single Page Application)
echo "⚙️ Criando .htaccess..."
cat > deploy/public_html/.htaccess << 'EOF'
Options -MultiViews
RewriteEngine On

# Handle Angular and React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
EOF

# Criar arquivo de configuração para produção
cat > deploy/api/config.prod.js << 'EOF'
module.exports = {
  port: process.env.PORT || 3001,
  dbPath: process.env.DB_PATH || './database/reports.db',
  corsOrigin: process.env.CORS_ORIGIN || 'https://report.thiagoriva.com',
  nodeEnv: 'production'
};
EOF

# Criar README de deploy
cat > deploy/README-DEPLOY.md << 'EOF'
# Instruções de Deploy - Sistema de Relatórios Diários

## Estrutura de Arquivos

```
deploy/
├── public_html/          # Arquivos do frontend (React build)
│   ├── index.html
│   ├── static/
│   └── .htaccess
└── api/                  # Arquivos do backend (Node.js)
    ├── server.js
    ├── config.js
    ├── package.json
    ├── ecosystem.config.js
    └── database/
```

## Passos para Deploy na Hostinger

### 1. Frontend (React)
1. Faça upload do conteúdo da pasta `public_html/` para a pasta raiz do seu subdomínio
2. Certifique-se que o arquivo `.htaccess` foi enviado

### 2. Backend (Node.js API)
1. Crie um subdiretório `api/` na raiz do seu domínio
2. Faça upload do conteúdo da pasta `api/` para esse diretório
3. No painel da Hostinger, vá em "Avançado" > "Cron Jobs"
4. Adicione um cron job para manter a API rodando:
   ```
   */5 * * * * cd /home/usuario/public_html/api && node server.js > /dev/null 2>&1 &
   ```

### 3. Configuração do Subdomínio
1. No painel da Hostinger, vá em "Domínios" > "Subdomínios"
2. Crie um subdomínio (ex: `relatorios.seudominio.com.br`)
3. Aponte para a pasta onde você fez upload dos arquivos

### 4. Banco de Dados
- O SQLite será criado automaticamente na primeira execução
- O arquivo ficará em `api/database/reports.db`
- Faça backup regular deste arquivo

### 5. Logs
- Os logs da API ficarão em `api/logs/`
- Monitore regularmente para verificar erros

## URLs Finais
- Frontend: https://report.thiagoriva.com
- API: https://report.thiagoriva.com/api

## Teste
Após o deploy, teste:
1. Acesse a URL do frontend
2. Verifique se aparece "Banco de dados conectado" na tela inicial
3. Tente criar um relatório de teste

## Manutenção
- Para atualizar: repita o processo de build e upload
- Para backup: baixe o arquivo `api/database/reports.db`
- Para logs: verifique `api/logs/`
EOF

# Criar arquivo ZIP para upload fácil
echo "📦 Criando arquivo ZIP..."
cd deploy
zip -r ../sistema-relatorios-deploy.zip .
cd ..

echo "✅ Deploy preparado com sucesso!"
echo ""
echo "📁 Arquivos prontos em: ./deploy/"
echo "📦 Arquivo ZIP: ./sistema-relatorios-deploy.zip"
echo ""
echo "📋 Próximos passos:"
echo "1. Leia o arquivo deploy/README-DEPLOY.md"
echo "2. Configure seu subdomínio na Hostinger"
echo "3. Faça upload dos arquivos"
echo "4. Teste a aplicação"
echo ""
echo "🌐 URLs após deploy:"
echo "Frontend: https://report.thiagoriva.com"
echo "API: https://report.thiagoriva.com/api"
