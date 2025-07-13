#!/bin/bash

# Script de inicialização simplificada
# Executa após setup-interactive.sh

echo "🚀 Iniciando SisFin..."

# Verificar se foi configurado
if [[ ! -f ".env" ]]; then
    echo "❌ Sistema não configurado. Execute primeiro: ./setup-interactive.sh"
    exit 1
fi

# Verificar se o build existe
if [[ ! -f "dist/index.js" ]]; then
    echo "📦 Compilando aplicação..."
    npm run build || {
        echo "❌ Falha na compilação"
        exit 1
    }
fi

# Tentar iniciar com PM2
if command -v pm2 >/dev/null 2>&1; then
    echo "🔄 Iniciando com PM2..."
    pm2 stop sisfin >/dev/null 2>&1 || true
    pm2 delete sisfin >/dev/null 2>&1 || true
    
    if pm2 start ecosystem.config.js; then
        echo "✅ Aplicação iniciada com PM2"
        pm2 save
        pm2 status
        exit 0
    else
        echo "⚠️ PM2 falhou, tentando modo simples..."
    fi
fi

# Modo simples
echo "🔄 Iniciando em modo simples..."
mkdir -p logs
nohup node dist/index.js > logs/app.log 2>&1 &
PID=$!
echo $PID > app.pid

sleep 3

if ps -p $PID > /dev/null; then
    echo "✅ Aplicação iniciada (PID: $PID)"
    echo "📋 Para ver logs: tail -f logs/app.log"
    echo "⏹️ Para parar: kill $PID"
else
    echo "❌ Falha ao iniciar aplicação"
    exit 1
fi