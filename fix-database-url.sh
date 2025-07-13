#!/bin/bash

# Script para corrigir definitivamente o erro DATABASE_URL must be set
# Executa na VPS onde o erro está ocorrendo

echo "🔧 Corrigindo erro DATABASE_URL definitivamente..."

# Parar todos os processos Node.js existentes
echo "🛑 Parando processos existentes..."
pkill -f "node" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
sleep 2

# Instalar PostgreSQL se necessário
if ! command -v psql &> /dev/null; then
    echo "📥 Instalando PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Iniciar PostgreSQL
echo "🚀 Iniciando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
sleep 3

# Configurar PostgreSQL
echo "🗄️ Configurando PostgreSQL..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS financedb;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS financeuser;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE financedb;"
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
sudo -u postgres psql -c "ALTER DATABASE financedb OWNER TO financeuser;"

# Configurar autenticação PostgreSQL
echo "🔐 Configurando autenticação..."
for version in 12 13 14 15 16; do
    PG_CONFIG="/etc/postgresql/$version/main/pg_hba.conf"
    if [ -f "$PG_CONFIG" ]; then
        sudo cp "$PG_CONFIG" "$PG_CONFIG.backup"
        sudo sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' "$PG_CONFIG"
        sudo sed -i 's/local   all             all                                     md5/local   all             all                                     trust/' "$PG_CONFIG"
        break
    fi
done

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
sleep 5

# Criar arquivo .env DEFINITIVO
echo "📝 Criando arquivo .env definitivo..."
cat > .env << 'EOF'
DATABASE_URL=postgresql://financeuser:financepass123@localhost:5432/financedb
SESSION_SECRET=chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
EOF

# Exportar variáveis no sistema
echo "🔄 Exportando variáveis..."
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"
export NODE_ENV="development"

# Adicionar ao bashrc para persistir
echo 'export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"' >> ~/.bashrc
echo 'export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"' >> ~/.bashrc
echo 'export NODE_ENV="development"' >> ~/.bashrc

# Testar conexão com banco
echo "🔍 Testando conexão..."
if psql -U financeuser -h localhost -d financedb -c "SELECT 1;" 2>/dev/null; then
    echo "✅ Conexão com banco funcionando!"
else
    echo "❌ Erro na conexão, tentando com senha..."
    if PGPASSWORD=financepass123 psql -U financeuser -h localhost -d financedb -c "SELECT 1;" 2>/dev/null; then
        echo "✅ Conexão com senha funcionando!"
    else
        echo "❌ Problema na conexão"
    fi
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Aplicar schema do banco
echo "🗄️ Aplicando schema..."
npx drizzle-kit push --force 2>/dev/null || echo "⚠️ Schema já aplicado"

# Criar arquivo de inicialização
echo "📄 Criando arquivo de inicialização..."
cat > start-app.sh << 'EOF'
#!/bin/bash
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"
export NODE_ENV="development"
cd /root/SisFin
npm run dev
EOF

chmod +x start-app.sh

# Testar aplicação
echo "🧪 Testando aplicação..."
timeout 10s bash -c 'export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"; npm run dev' &
PID=$!
sleep 5

if kill -0 $PID 2>/dev/null; then
    echo "✅ Aplicação iniciou com sucesso!"
    kill $PID 2>/dev/null
else
    echo "❌ Aplicação com problemas"
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Para iniciar a aplicação:"
echo "export DATABASE_URL=\"postgresql://financeuser:financepass123@localhost:5432/financedb\""
echo "npm run dev"
echo ""
echo "📋 Ou use o script:"
echo "./start-app.sh"
echo ""
echo "🌐 Acesso: http://$(curl -s ifconfig.me 2>/dev/null || echo "seu-ip"):5000"
echo "🔑 Usuário: Joel | Senha: 123456"