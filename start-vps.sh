#!/bin/bash

# Script para iniciar a aplicação na VPS
# Uso: ./start-vps.sh

echo "🚀 Iniciando aplicação SisFin na VPS..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto SisFin"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Execute primeiro: ./vps-database-fix.sh"
    exit 1
fi

# Verificar se PostgreSQL está rodando
if ! sudo systemctl is-active --quiet postgresql; then
    echo "🚀 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sleep 3
fi

# Verificar conexão com banco
echo "🔍 Verificando conexão com banco..."
if ! PGPASSWORD=financepass psql -U financeuser -h localhost -d financedb -c "SELECT 1;" &>/dev/null; then
    echo "❌ Erro na conexão com banco. Execute: ./vps-database-fix.sh"
    exit 1
fi

# Exportar variáveis de ambiente
export DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb
export NODE_ENV=development

# Parar processos existentes
echo "🛑 Parando processos existentes..."
sudo pkill -f "node.*dev" 2>/dev/null || true
sudo pkill -f "npm.*dev" 2>/dev/null || true

# Aguardar processos terminarem
sleep 2

# Verificar se a porta está livre
if netstat -tuln | grep -q ":5000 "; then
    echo "⚠️  Porta 5000 ainda em uso. Aguardando..."
    sleep 3
fi

# Iniciar aplicação
echo "🎯 Iniciando aplicação..."
echo "📍 Acesse: http://$(curl -s ifconfig.me 2>/dev/null || echo "seu-ip"):5000"
echo "🔑 Usuário: Joel | Senha: 123456"
echo ""
echo "🔄 Para parar a aplicação, pressione Ctrl+C"
echo ""

# Executar aplicação
npm run dev