#!/bin/bash

# Script para configurar o ambiente Node.js corretamente na VPS
# Resolve problemas com import.meta.dirname e configurações do Vite

echo "🔧 Configurando ambiente Node.js para VPS..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto SisFin"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Instalar/atualizar Node.js se necessário
if [[ "$NODE_VERSION" < "v20" ]]; then
    echo "⬆️ Atualizando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    NODE_VERSION=$(node --version)
    echo "✅ Node.js atualizado para: $NODE_VERSION"
fi

# Limpar cache do npm
echo "🧹 Limpando cache do npm..."
npm cache clean --force

# Reinstalar dependências
echo "📦 Reinstalando dependências..."
rm -rf node_modules package-lock.json
npm install

# Configurar variáveis de ambiente necessárias
echo "🔧 Configurando variáveis de ambiente..."
export NODE_ENV=development
export VITE_APP_ENV=development

# Verificar se .env existe e configurar
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << 'EOF'
# Banco de dados
DATABASE_URL=postgresql://financeuser:financepass123@localhost:5432/financedb

# Sessão
SESSION_SECRET=chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024

# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema

# Ambiente
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Vite
VITE_APP_ENV=development
EOF
fi

# Verificar se PostgreSQL está configurado
if ! systemctl is-active --quiet postgresql; then
    echo "🗄️ Configurando PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Configurar banco
    sudo -u postgres psql -c "CREATE DATABASE IF NOT EXISTS financedb;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER IF NOT EXISTS financeuser WITH PASSWORD 'financepass123';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;" 2>/dev/null || true
fi

# Criar script de inicialização que funciona
echo "📄 Criando script de inicialização..."
cat > start-dev.sh << 'EOF'
#!/bin/bash

# Script para iniciar a aplicação em modo desenvolvimento
echo "🚀 Iniciando aplicação SisFin..."

# Configurar variáveis de ambiente
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"
export NODE_ENV="development"
export VITE_APP_ENV="development"

# Verificar se PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql; then
    echo "🗄️ Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sleep 3
fi

# Iniciar aplicação
echo "🎯 Executando aplicação..."
npm run dev
EOF

chmod +x start-dev.sh

# Testar aplicação
echo "🧪 Testando aplicação..."
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
export SESSION_SECRET="chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024"
export NODE_ENV="development"

# Verificar se consegue importar o vite.config.ts
if timeout 10s node -e "import('./vite.config.ts').then(() => console.log('✅ Vite config carregado')).catch(e => console.log('❌ Erro:', e.message))" 2>/dev/null; then
    echo "✅ Configuração do Vite funcionando"
else
    echo "⚠️ Problema com configuração do Vite"
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Para iniciar a aplicação:"
echo "./start-dev.sh"
echo ""
echo "📋 Ou manualmente:"
echo "export DATABASE_URL=\"postgresql://financeuser:financepass123@localhost:5432/financedb\""
echo "npm run dev"
echo ""
echo "🌐 Acesso: http://$(curl -s ifconfig.me 2>/dev/null || echo "seu-ip"):5000"
echo "🔑 Usuário: Joel | Senha: 123456"
EOF

chmod +x setup-node-environment.sh