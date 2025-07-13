#!/bin/bash

# Script para corrigir erros de certificado SSL do WhatsApp

echo "🔧 Corrigindo erros de certificado SSL do WhatsApp..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Atualizar arquivo .env com configuração SSL
echo "📝 Atualizando configuração SSL..."
if [ -f ".env" ]; then
    # Remover linha existente se houver
    sed -i '/NODE_TLS_REJECT_UNAUTHORIZED/d' .env
    # Adicionar nova configuração
    echo "NODE_TLS_REJECT_UNAUTHORIZED=0" >> .env
    echo "✅ Configuração SSL atualizada no .env"
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

# Criar script para definir variáveis de ambiente
cat > set-env.sh << 'EOF'
#!/bin/bash
# Script para definir variáveis de ambiente que corrigem erros SSL

export NODE_TLS_REJECT_UNAUTHORIZED=0
export NODE_ENV=development
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"

echo "✅ Variáveis de ambiente configuradas"
echo "NODE_TLS_REJECT_UNAUTHORIZED: $NODE_TLS_REJECT_UNAUTHORIZED"
echo "NODE_ENV: $NODE_ENV"
EOF

chmod +x set-env.sh

# Testar aplicação com nova configuração
echo "🧪 Testando aplicação com nova configuração SSL..."
export NODE_TLS_REJECT_UNAUTHORIZED=0
export NODE_ENV=development
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"

# Verificar se PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "🗄️ PostgreSQL não está rodando. Iniciando..."
    if command -v systemctl > /dev/null; then
        sudo systemctl start postgresql
        sleep 3
    fi
fi

echo "✅ Correção aplicada!"
echo ""
echo "📋 Para usar:"
echo "1. Execute: source set-env.sh"
echo "2. Depois: npm run dev"
echo ""
echo "📋 Ou use diretamente:"
echo "NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev"
echo ""
echo "⚠️ Nota: NODE_TLS_REJECT_UNAUTHORIZED=0 desabilita verificação de certificado SSL"
echo "   Isso é necessário para o Evolution API funcionar corretamente."