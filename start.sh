#!/bin/sh

# Iniciar backend em background
cd /app/backend
node server.js &

# Aguardar um pouco
sleep 2

# Servir frontend na porta 5000
cd /app
serve -s build -l 5000

# Manter o script rodando
wait
