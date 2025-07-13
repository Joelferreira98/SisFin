#!/bin/bash

# Script de instalação local do SisFin (sem Docker)
# Alternativa para quando Docker apresenta problemas

echo "🚀 Instalação Local - SisFin"
echo "============================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "💡 $1"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Execute este script no diretório raiz do projeto SisFin"
    exit 1
fi

# 1. Verificar Node.js
echo -e "\n1. Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js instalado: $NODE_VERSION"
else
    print_error "Node.js não está instalado"
    print_info "Instalando Node.js..."
    
    # Instalar Node.js via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    if command -v node &> /dev/null; then
        print_success "Node.js instalado com sucesso"
    else
        print_error "Falha ao instalar Node.js"
        exit 1
    fi
fi

# 2. Verificar npm
echo -e "\n2. Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm instalado: $NPM_VERSION"
else
    print_error "npm não está disponível"
    exit 1
fi

# 3. Instalar dependências
echo -e "\n3. Instalando dependências..."
if npm install; then
    print_success "Dependências instaladas com sucesso"
else
    print_error "Falha ao instalar dependências"
    exit 1
fi

# 4. Verificar PostgreSQL
echo -e "\n4. Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    print_success "PostgreSQL instalado: $PG_VERSION"
else
    print_warning "PostgreSQL não está instalado"
    print_info "Instalando PostgreSQL..."
    
    # Instalar PostgreSQL
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    
    # Iniciar PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL instalado com sucesso"
    else
        print_error "Falha ao instalar PostgreSQL"
        print_info "Você pode usar SQLite como alternativa"
    fi
fi

# 5. Configurar arquivo .env
echo -e "\n5. Configurando arquivo .env..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Arquivo .env criado a partir do .env.example"
    else
        print_warning ".env.example não encontrado, criando .env básico"
        cat > .env << EOF
# Configuração básica para desenvolvimento local
DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=development

# Evolution API (configure conforme necessário)
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-api
EVOLUTION_INSTANCE_NAME=instancia-local
EOF
        print_success "Arquivo .env criado com configurações básicas"
    fi
else
    print_success "Arquivo .env já existe"
fi

# 6. Configurar banco de dados
echo -e "\n6. Configurando banco de dados..."
print_info "Criando banco de dados..."

# Verificar se PostgreSQL está rodando
if systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL está rodando"
    
    # Criar banco de dados
    sudo -u postgres createdb financedb 2>/dev/null || {
        print_warning "Banco financedb pode já existir"
        print_info "Isso é normal se você já executou o script antes"
    }
    
    # Criar usuário se necessário
    sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';" 2>/dev/null || {
        print_warning "Usuário financeuser pode já existir"
    }
    
    # Dar permissões
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;" 2>/dev/null
    
else
    print_error "PostgreSQL não está rodando"
    print_info "Inicie o PostgreSQL: sudo systemctl start postgresql"
fi

# 7. Aplicar schema do banco
echo -e "\n7. Aplicando schema do banco..."
if npm run db:push; then
    print_success "Schema aplicado com sucesso"
else
    print_warning "Falha ao aplicar schema - você pode tentar novamente após configurar o banco"
fi

# 8. Verificar portas
echo -e "\n8. Verificando portas..."
if lsof -i :5000 &> /dev/null; then
    print_warning "Porta 5000 está em uso"
    print_info "Processo usando a porta 5000:"
    lsof -i :5000
else
    print_success "Porta 5000 está livre"
fi

# 9. Criar script de inicialização
echo -e "\n9. Criando script de inicialização..."
cat > start-local.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando SisFin localmente..."

# Verificar se PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql; then
    echo "⚠️  Iniciando PostgreSQL..."
    sudo systemctl start postgresql
fi

# Verificar se banco existe
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw financedb; then
    echo "⚠️  Criando banco de dados..."
    sudo -u postgres createdb financedb
    sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
fi

# Aplicar schema se necessário
echo "🔄 Aplicando schema do banco..."
npm run db:push

# Iniciar aplicação
echo "🚀 Iniciando aplicação..."
npm run dev
EOF

chmod +x start-local.sh
print_success "Script de inicialização criado: start-local.sh"

# 10. Informações finais
echo -e "\n================================"
echo "🎉 Instalação local concluída!"
echo "================================"

echo -e "\n📋 Próximos passos:"
echo "1. Configure suas credenciais Evolution API no arquivo .env"
echo "2. Configure a senha do PostgreSQL se necessário"
echo "3. Execute: ./start-local.sh"
echo "4. Ou execute manualmente: npm run dev"
echo "5. Acesse: http://localhost:5000"

echo -e "\n🔧 Comandos úteis:"
echo "- Iniciar aplicação: ./start-local.sh"
echo "- Aplicar schema: npm run db:push"
echo "- Modo desenvolvimento: npm run dev"
echo "- Build produção: npm run build"

echo -e "\n🆘 Se tiver problemas:"
echo "- Verifique logs em: npm run dev"
echo "- Documentação: README.md"
echo "- GitHub: https://github.com/Joelferreira98/SisFin"

echo -e "\n⚠️  Configurações importantes:"
echo "- Edite o arquivo .env com suas configurações"
echo "- Configure Evolution API para WhatsApp"
echo "- Use senha segura para SESSION_SECRET"

print_success "Instalação concluída com sucesso!"