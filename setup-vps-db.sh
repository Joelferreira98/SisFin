#!/bin/bash

# Script de configuração rápida do PostgreSQL para VPS
# Resolve o erro: DATABASE_URL must be set

echo "🔧 Configurando PostgreSQL na VPS..."

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "📥 Instalando PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Iniciar e habilitar PostgreSQL
echo "🚀 Iniciando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Aguardar inicialização
sleep 3

# Criar banco e usuário
echo "🗄️  Criando banco e usuário..."
sudo -u postgres createdb financedb 2>/dev/null || echo "⚠️  Banco financedb já existe"
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';" 2>/dev/null || echo "⚠️  Usuário financeuser já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;" 2>/dev/null

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << 'EOF'
# Configuração do banco PostgreSQL
DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb

# Chave de sessão segura
SESSION_SECRET=sua-chave-secreta-super-segura-de-32-caracteres-para-producao

# Evolution API (configure suas credenciais)
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema

# Ambiente
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
EOF
else
    echo "✅ Arquivo .env já existe"
    
    # Verificar se DATABASE_URL está configurada
    if ! grep -q "DATABASE_URL=" .env; then
        echo "📝 Adicionando DATABASE_URL ao .env..."
        echo "DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb" >> .env
    fi
fi

# Testar conexão
echo "🔍 Testando conexão com banco..."
if psql -U financeuser -h localhost -d financedb -c "SELECT 1;" &>/dev/null; then
    echo "✅ Conexão com banco bem-sucedida!"
else
    echo "❌ Erro na conexão. Verificando configuração..."
    
    # Configurar autenticação do PostgreSQL
    PG_VERSION=$(sudo -u postgres psql -c "SELECT version();" | head -1 | grep -o "PostgreSQL [0-9]*" | grep -o "[0-9]*")
    PG_CONFIG="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
    
    if [ -f "$PG_CONFIG" ]; then
        echo "🔧 Configurando autenticação..."
        sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" "$PG_CONFIG"
        sudo systemctl restart postgresql
        sleep 3
        echo "✅ Autenticação configurada"
    fi
fi

# Aplicar schema do banco
echo "🏗️  Aplicando schema do banco..."
if npm run db:push; then
    echo "✅ Schema aplicado com sucesso!"
else
    echo "⚠️  Erro ao aplicar schema. Tente manualmente depois."
fi

echo "🎉 Configuração concluída!"
echo ""
echo "📋 Resumo da configuração:"
echo "   Banco: financedb"
echo "   Usuário: financeuser"
echo "   Senha: financepass"
echo "   URL: postgresql://financeuser:financepass@localhost:5432/financedb"
echo ""
echo "🚀 Para iniciar a aplicação:"
echo "   npm run dev"
echo ""
echo "🔧 Para verificar se está funcionando:"
echo "   psql -U financeuser -h localhost -d financedb -c 'SELECT NOW();'"