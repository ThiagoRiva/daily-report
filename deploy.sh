#!/bin/bash

echo "🚀 Iniciando deploy do Sistema de Relatórios Diários..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto!"
    exit 1
fi

# 1. Fazer backup do banco de dados
log "Fazendo backup do banco de dados..."
if [ -f "backend/database/reports.db" ]; then
    BACKUP_DIR="backups"
    mkdir -p $BACKUP_DIR
    DATE=$(date +%Y%m%d_%H%M%S)
    cp backend/database/reports.db "$BACKUP_DIR/reports_backup_$DATE.db"
    log "Backup criado: $BACKUP_DIR/reports_backup_$DATE.db"
else
    warning "Banco de dados não encontrado, pulando backup..."
fi

# 2. Instalar dependências
log "Instalando dependências do frontend..."
npm install

log "Instalando dependências do backend..."
cd backend && npm install && cd ..

# 3. Build do frontend
log "Criando build de produção do React..."
npm run build

if [ ! -d "build" ]; then
    error "Build do React falhou!"
    exit 1
fi

log "Build criado com sucesso!"

# 4. Verificar estrutura do projeto
log "Verificando estrutura do projeto..."
REQUIRED_FILES=("build/index.html" "backend/server.js" "backend/database/schema.sql")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        error "Arquivo obrigatório não encontrado: $file"
        exit 1
    fi
done

log "Estrutura do projeto verificada!"

# 5. Criar arquivo .env.production se não existir
if [ ! -f ".env.production" ]; then
    log "Criando arquivo .env.production..."
    cat > .env.production << EOF
# Configurações de Produção
NODE_ENV=production
PORT=3001
JWT_SECRET=MUDE_ESTA_CHAVE_EM_PRODUCAO_256_BITS_SEGURA
DATABASE_PATH=./backend/database/reports.db

# Frontend (usado durante o build) - HOSTINGER
REACT_APP_API_URL=https://api.report.thiagoriva.com/api
EOF
    warning "Arquivo .env.production criado! LEMBRE-SE de configurar suas variáveis!"
fi

# 6. Testar se o banco de dados pode ser inicializado
log "Testando inicialização do banco de dados..."
cd backend
node -e "
const db = require('./database/database.js');
console.log('✅ Banco de dados OK');
process.exit(0);
" || {
    error "Erro ao testar banco de dados!"
    exit 1
}
cd ..

# 7. Criar scripts auxiliares
log "Criando scripts auxiliares..."

# Script de inicialização do banco
cat > init_production_db.sh << 'EOF'
#!/bin/bash
echo "🗄️ Inicializando banco de dados de produção..."
cd backend
node -e "
const db = require('./database/database.js');
console.log('Banco inicializado com sucesso!');
"
echo "✅ Banco de dados pronto!"
EOF
chmod +x init_production_db.sh

# Script para criar usuário admin
cat > create_admin.sh << 'EOF'
#!/bin/bash
echo "👤 Criando usuário administrador..."
echo "Digite os dados do administrador:"
read -p "Nome: " nome
read -p "Email: " email
read -s -p "Senha: " senha
echo ""

cd backend
node scripts/dbAdmin.js createAdmin "$nome" "$email" "$senha"
EOF
chmod +x create_admin.sh

log "Scripts auxiliares criados!"

# 8. Resumo final
echo ""
echo "🎉 Deploy preparado com sucesso!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Configure as variáveis em .env.production"
echo "2. Envie os arquivos para seu servidor"
echo "3. No servidor, execute: ./init_production_db.sh"
echo "4. No servidor, execute: ./create_admin.sh"
echo "5. Configure PM2 com: pm2 start ecosystem.config.js"
echo "6. Configure Nginx conforme o DEPLOY_GUIDE.md"
echo ""
echo "📁 ARQUIVOS IMPORTANTES:"
echo "- build/ (frontend compilado)"
echo "- backend/ (API)"
echo "- ecosystem.config.js (configuração PM2)"
echo "- .env.production (variáveis de ambiente)"
echo "- DEPLOY_GUIDE.md (guia completo)"
echo ""
echo "🔗 Consulte o DEPLOY_GUIDE.md para instruções detalhadas!"