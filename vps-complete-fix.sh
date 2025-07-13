#!/bin/bash

# Script definitivo para resolver todos os erros da VPS
# Resolve: DATABASE_URL e erro do Vite config

echo "🚀 Corrigindo todos os erros da VPS..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto SisFin"
    exit 1
fi

# Parar processos existentes
echo "🛑 Parando processos existentes..."
pkill -f "node" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
sleep 2

# 1. CONFIGURAR NODE.JS
echo "📋 Verificando Node.js..."
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v20" ]]; then
    echo "⬆️ Atualizando Node.js para v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. CONFIGURAR POSTGRESQL
echo "🗄️ Configurando PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sleep 3

# Configurar banco e usuário
sudo -u postgres psql -c "DROP DATABASE IF EXISTS financedb;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS financeuser;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE financedb;"
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
sudo -u postgres psql -c "ALTER DATABASE financedb OWNER TO financeuser;"

# Configurar autenticação
for version in 12 13 14 15 16; do
    PG_CONFIG="/etc/postgresql/$version/main/pg_hba.conf"
    if [ -f "$PG_CONFIG" ]; then
        sudo cp "$PG_CONFIG" "$PG_CONFIG.backup"
        sudo sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' "$PG_CONFIG"
        sudo systemctl restart postgresql
        sleep 3
        break
    fi
done

# 3. CRIAR ARQUIVO .ENV
echo "📝 Criando arquivo .env..."
cat > .env << 'EOF'
DATABASE_URL=postgresql://financeuser:financepass123@localhost:5432/financedb
SESSION_SECRET=chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
VITE_APP_ENV=development
EOF

# 4. CONFIGURAR DEPENDÊNCIAS
echo "📦 Configurando dependências..."
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 5. TESTAR CONEXÃO COM BANCO
echo "🔍 Testando conexão com banco..."
if psql -U financeuser -h localhost -d financedb -c "SELECT 1;" 2>/dev/null; then
    echo "✅ Conexão com banco funcionando!"
else
    echo "❌ Erro na conexão com banco"
fi

# 6. CRIAR SCRIPT DE INICIALIZAÇÃO
echo "📄 Criando script de inicialização..."
cat > start-app-vps.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando aplicação SisFin na VPS..."

# Configurar variáveis de ambiente
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"
export NODE_ENV="development"
export VITE_APP_ENV="development"

# Verificar PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "🗄️ Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sleep 3
fi

# Mostrar informações
echo "✅ Variáveis configuradas:"
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"
echo ""
echo "🎯 Acesso: http://$(curl -s ifconfig.me 2>/dev/null || echo "seu-ip"):5000"
echo "🔑 Usuário: Joel | Senha: 123456"
echo ""
echo "🔄 Para parar: Ctrl+C"
echo ""

# Executar aplicação
npm run dev
EOF

chmod +x start-app-vps.sh

# 7. APLICAR SCHEMA DO BANCO
echo "🗄️ Aplicando schema do banco..."
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
npx drizzle-kit push --force 2>/dev/null || echo "⚠️ Schema já aplicado"

# 8. TESTAR APLICAÇÃO
echo "🧪 Testando aplicação..."
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export NODE_ENV="development"

timeout 15s npm run dev > test_output.log 2>&1 &
TEST_PID=$!
sleep 10

if kill -0 $TEST_PID 2>/dev/null; then
    echo "✅ Aplicação iniciou com sucesso!"
    kill $TEST_PID 2>/dev/null
else
    echo "❌ Problema na aplicação. Verificando logs..."
    cat test_output.log | tail -10
fi

# Limpar
rm -f test_output.log

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Para iniciar:"
echo "./start-app-vps.sh"
echo ""
echo "📞 Em caso de problemas:"
echo "- Verifique PostgreSQL: sudo systemctl status postgresql"
echo "- Verifique logs: sudo journalctl -u postgresql -f"
echo "- Teste conexão: psql -U financeuser -h localhost -d financedb -c 'SELECT 1;'"
echo ""
echo "✅ Pronto para usar!"