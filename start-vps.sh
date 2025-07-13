#!/bin/bash

# Script para iniciar o sistema no VPS
echo "🚀 Iniciando SisFin no VPS..."

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o .env existe
if [[ ! -f ".env" ]]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "💡 Execute: ./vps-database-fix.sh primeiro"
    exit 1
fi

# Testar configuração
echo "🧪 Testando configuração..."
if ! node test-env.js; then
    echo "❌ Configuração com problemas!"
    echo "💡 Execute: ./vps-database-fix.sh"
    exit 1
fi

# Verificar se o build existe
if [[ ! -f "dist/index.js" ]]; then
    echo "⚙️ Build não encontrado, criando..."
    npm run build
    
    if [[ $? -ne 0 ]]; then
        echo "❌ Erro no build!"
        exit 1
    fi
fi

# Escolher porta
echo "🔧 Configurando porta..."
PORT=${PORT:-5000}

# Verificar se a porta está livre
if command -v lsof &> /dev/null; then
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo "⚠️ Porta $PORT já está em uso"
        echo "Escolha uma porta diferente:"
        echo "1. 3000"
        echo "2. 8080"
        echo "3. 8000"
        echo "4. Personalizada"
        read -p "Opção: " PORT_CHOICE
        
        case $PORT_CHOICE in
            1) PORT=3000 ;;
            2) PORT=8080 ;;
            3) PORT=8000 ;;
            4) 
                read -p "Digite a porta: " CUSTOM_PORT
                PORT=$CUSTOM_PORT
                ;;
            *) echo "Opção inválida, usando porta padrão 5000" ;;
        esac
    fi
fi

# Atualizar PORT no .env
sed -i "s/PORT=.*/PORT=$PORT/" .env

echo "✅ Porta configurada: $PORT"

# Iniciar aplicação
echo "🚀 Iniciando aplicação na porta $PORT..."
echo "📝 Logs serão exibidos abaixo..."
echo "📋 Para parar: Ctrl+C"
echo "----------------------------------------"

# Exportar variáveis antes de iniciar
export $(cat .env | grep -v '^#' | xargs)

# Iniciar a aplicação
NODE_ENV=production PORT=$PORT node dist/index.js