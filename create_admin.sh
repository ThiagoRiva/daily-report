#!/bin/bash
echo "👤 Criando usuário administrador..."
echo "Digite os dados do administrador:"
read -p "Nome: " nome
read -p "Email: " email
read -s -p "Senha: " senha
echo ""

cd backend
node scripts/dbAdmin.js createAdmin "$nome" "$email" "$senha"
