#!/bin/bash

echo "🔧 Configurador de URL da API"
echo "=============================="
echo ""

# Função para log
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Solicitar URL da API
echo "Digite a URL da API no seu VPS:"
echo "Exemplos:"
echo "- https://api-daily-report.seu-dominio.com/api"
echo "- http://SEU_IP:3000/api"
echo ""
read -p "URL da API: " API_URL

if [ -z "$API_URL" ]; then
    error "URL não pode estar vazia!"
    exit 1
fi

# Validar se termina com /api
if [[ ! "$API_URL" =~ /api$ ]]; then
    warning "A URL deve terminar com /api. Adicionando automaticamente..."
    API_URL="${API_URL}/api"
fi

log "URL configurada: $API_URL"

# Atualizar arquivo .env.production
log "Atualizando .env.production..."

if [ -f ".env.production" ]; then
    # Fazer backup
    cp .env.production .env.production.backup
    log "Backup criado: .env.production.backup"
fi

# Criar/atualizar .env.production
cat > .env.production << EOF
# Configurações de Produção
NODE_ENV=production
PORT=3000
JWT_SECRET=MUDE_ESTA_CHAVE_EM_PRODUCAO_256_BITS_SEGURA
DATABASE_PATH=./database/reports.db

# Frontend - URL da API no VPS
REACT_APP_API_URL=$API_URL
EOF

log ".env.production atualizado!"

# Rebuild do frontend
log "Fazendo rebuild do frontend com nova URL..."
npm run build

if [ $? -eq 0 ]; then
    log "✅ Frontend rebuilded com sucesso!"
    echo ""
    echo "🎉 Configuração concluída!"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo "1. Envie o conteúdo da pasta 'build' para report.thiagoriva.com"
    echo "2. Configure o backend no Coolify com a URL: $API_URL"
    echo "3. Teste a aplicação"
    echo ""
else
    error "❌ Erro no build do frontend!"
    exit 1
fi
