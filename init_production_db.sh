#!/bin/bash
echo "🗄️ Inicializando banco de dados de produção..."
cd backend
node -e "
const db = require('./database/database.js');
console.log('Banco inicializado com sucesso!');
"
echo "✅ Banco de dados pronto!"
