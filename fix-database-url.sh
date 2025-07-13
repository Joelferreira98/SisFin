#!/bin/bash

# Script para corrigir DATABASE_URL quando não é carregada corretamente
echo "🔧 Verificando e corrigindo DATABASE_URL..."

# Verificar se DATABASE_URL está no ambiente
if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ DATABASE_URL não encontrada no ambiente!"
    echo "💡 Verifique se o banco de dados está provisionado no Replit"
    exit 1
fi

echo "✅ DATABASE_URL encontrada no ambiente"
echo "🔗 URL: ${DATABASE_URL:0:50}..."

# Verificar se o .env existe
if [[ ! -f ".env" ]]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "💡 Execute: ./setup-auto.sh"
    exit 1
fi

# Backup do .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "📋 Backup do .env criado"

# Verificar se DATABASE_URL já está no .env
if grep -q "DATABASE_URL=" .env; then
    echo "⚠️ DATABASE_URL já existe no .env, atualizando..."
    
    # Usar sed para atualizar a linha
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" .env
    
    echo "✅ DATABASE_URL atualizada no .env"
else
    echo "➕ Adicionando DATABASE_URL ao .env..."
    
    # Adicionar após a seção de banco de dados
    sed -i '/# CONFIGURAÇÕES DO BANCO DE DADOS/a\\nDATABASE_URL='"$DATABASE_URL"'' .env
    
    echo "✅ DATABASE_URL adicionada ao .env"
fi

# Testar a configuração
echo "🧪 Testando configuração..."
if node test-config.js; then
    echo "✅ DATABASE_URL configurada com sucesso!"
    echo ""
    echo "🎯 Próximos passos:"
    echo "• Reiniciar aplicação: npm run dev"
    echo "• Verificar status: ./status.sh"
else
    echo "❌ Ainda há problemas com a configuração"
    echo "💡 Tente: ./setup-auto.sh"
fi