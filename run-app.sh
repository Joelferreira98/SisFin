#!/bin/bash

# Script para executar a aplicação com DATABASE_URL configurada
# Uso: ./run-app.sh

echo "🚀 Executando aplicação SisFin..."

# Definir variáveis de ambiente
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"
export NODE_ENV="development"
export PORT="5000"
export HOST="0.0.0.0"

# Verificar se PostgreSQL está rodando
if ! sudo systemctl is-active --quiet postgresql; then
    echo "🚀 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sleep 3
fi

# Mostrar variáveis configuradas
echo "✅ Variáveis configuradas:"
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo ""

# Executar aplicação
echo "🎯 Iniciando aplicação..."
npm run dev