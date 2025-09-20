#!/bin/bash

echo "🚀 Iniciando Sistema de Relatórios - Modo Local"
echo "=============================================="

# Função para verificar se um processo está rodando
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Parar processos existentes nas portas
echo "📋 Verificando portas..."

if check_port 3000; then
    echo "⚠️  Parando processo na porta 3000..."
    pkill -f "react-scripts start" || true
fi

if check_port 3001; then
    echo "⚠️  Parando processo na porta 3001..."
    pkill -f "node server.js" || true
fi

# Aguardar um pouco para os processos pararem
sleep 2

echo "🔧 Iniciando Backend (Modo Desenvolvimento)..."
cd backend
NODE_ENV=development node server.js &
BACKEND_PID=$!

# Aguardar o backend iniciar
sleep 3

echo "🎨 Iniciando Frontend..."
cd ..
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend:  http://localhost:3001"
echo ""
echo "Para parar o sistema, pressione Ctrl+C"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando sistema..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    echo "✅ Sistema parado!"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Aguardar indefinidamente
wait
