#!/bin/bash

# Script para corrigir o erro "DATABASE_URL must be set" na VPS
# Uso: ./vps-database-fix.sh

echo "🔧 Corrigindo erro DATABASE_URL na VPS..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto SisFin"
    exit 1
fi

# Parar processos existentes
echo "🛑 Parando processos existentes..."
sudo pkill -f "node" 2>/dev/null || true
sudo pkill -f "npm" 2>/dev/null || true

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "📥 Instalando PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Verificar status do PostgreSQL
echo "🔍 Verificando status do PostgreSQL..."
if ! sudo systemctl is-active --quiet postgresql; then
    echo "🚀 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    sleep 5
fi

# Criar banco e usuário
echo "🗄️  Configurando banco de dados..."
sudo -u postgres createdb financedb 2>/dev/null || echo "⚠️  Banco financedb já existe"
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';" 2>/dev/null || echo "⚠️  Usuário financeuser já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;" 2>/dev/null

# Configurar autenticação do PostgreSQL
echo "🔧 Configurando autenticação..."
PG_VERSION=$(sudo -u postgres psql -c "SELECT version();" | head -1 | grep -o "PostgreSQL [0-9]*\.[0-9]*" | grep -o "[0-9]*\.[0-9]*" | head -1)
PG_MAIN_VERSION=$(echo $PG_VERSION | cut -d. -f1)
PG_CONFIG="/etc/postgresql/$PG_MAIN_VERSION/main/pg_hba.conf"

if [ -f "$PG_CONFIG" ]; then
    # Backup da configuração original
    sudo cp "$PG_CONFIG" "$PG_CONFIG.backup"
    
    # Configurar autenticação md5 para conexões locais
    sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_CONFIG"
    
    # Reiniciar PostgreSQL para aplicar mudanças
    sudo systemctl restart postgresql
    sleep 3
    echo "✅ Autenticação configurada"
else
    echo "⚠️  Arquivo de configuração não encontrado, tentando configuração alternativa..."
    # Configuração alternativa para diferentes versões
    for version in 12 13 14 15 16; do
        ALT_CONFIG="/etc/postgresql/$version/main/pg_hba.conf"
        if [ -f "$ALT_CONFIG" ]; then
            sudo cp "$ALT_CONFIG" "$ALT_CONFIG.backup"
            sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$ALT_CONFIG"
            sudo systemctl restart postgresql
            sleep 3
            echo "✅ Configuração aplicada para PostgreSQL $version"
            break
        fi
    done
fi

# Criar/atualizar arquivo .env
echo "📝 Configurando arquivo .env..."
cat > .env << 'EOF'
# ==============================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ==============================================

# URL de conexão com o banco PostgreSQL
DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb

# ==============================================
# CONFIGURAÇÕES DE SESSÃO
# ==============================================

# Chave secreta para assinatura de sessões
SESSION_SECRET=sua-chave-secreta-super-segura-de-32-caracteres-para-producao-vps

# ==============================================
# CONFIGURAÇÕES DA EVOLUTION API (WHATSAPP)
# ==============================================

# URL da sua instância Evolution API
EVOLUTION_API_URL=https://sua-evolution-api-url.com

# Chave da API fornecida pela Evolution API
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui

# Nome da instância padrão do WhatsApp
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema

# ==============================================
# CONFIGURAÇÕES DO AMBIENTE
# ==============================================

# Ambiente de execução
NODE_ENV=development

# ==============================================
# CONFIGURAÇÕES OPCIONAIS
# ==============================================

# Porta do servidor (padrão: 5000)
PORT=5000

# Host do servidor (padrão: 0.0.0.0)
HOST=0.0.0.0
EOF

# Testar conexão com banco
echo "🔍 Testando conexão com banco de dados..."
if PGPASSWORD=financepass psql -U financeuser -h localhost -d financedb -c "SELECT 1;" &>/dev/null; then
    echo "✅ Conexão com banco bem-sucedida!"
else
    echo "❌ Erro na conexão. Tentando resolver..."
    
    # Tentar resetar senha do usuário
    echo "🔄 Resetando senha do usuário..."
    sudo -u postgres psql -c "ALTER USER financeuser WITH PASSWORD 'financepass';"
    
    # Testar novamente
    if PGPASSWORD=financepass psql -U financeuser -h localhost -d financedb -c "SELECT 1;" &>/dev/null; then
        echo "✅ Conexão restaurada!"
    else
        echo "❌ Problema persistente. Verificando logs..."
        sudo tail -5 /var/log/postgresql/postgresql-*.log
    fi
fi

# Verificar se Node.js está instalado
echo "🔍 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "📥 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Aplicar schema do banco
echo "🗄️  Aplicando schema do banco..."
export DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb
npm run db:push

# Testar aplicação
echo "🧪 Testando aplicação..."
timeout 10s npm run dev &
sleep 5

# Verificar se a aplicação está rodando
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Aplicação funcionando corretamente!"
else
    echo "⚠️  Aplicação pode ter problemas. Verificando logs..."
fi

# Parar teste
sudo pkill -f "node" 2>/dev/null || true

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas credenciais da Evolution API no arquivo .env"
echo "2. Execute: npm run dev"
echo "3. Acesse: http://seu-vps-ip:5000"
echo ""
echo "📞 Em caso de problemas:"
echo "- Verifique os logs: sudo journalctl -u postgresql -f"
echo "- Teste conexão: PGPASSWORD=financepass psql -U financeuser -h localhost -d financedb -c 'SELECT 1;'"
echo "- Consulte: TROUBLESHOOTING.md"
echo ""
echo "✅ DATABASE_URL configurada: postgresql://financeuser:financepass@localhost:5432/financedb"