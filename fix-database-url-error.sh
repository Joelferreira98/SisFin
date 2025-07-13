#!/bin/bash

# SisFin - Correção do Erro DATABASE_URL
# Resolve o erro "DATABASE_URL must be set" em produção

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Banner
echo -e "${RED}"
echo "============================================"
echo "    SisFin - Correção DATABASE_URL"
echo "============================================"
echo -e "${NC}"

# Verificar se está no diretório correto
if [[ ! -f "package.json" ]]; then
    error "Execute este script no diretório raiz do SisFin"
fi

# Parar aplicação se estiver rodando
log "Parando aplicação..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop sisfin 2>/dev/null || true
fi

# Verificar se PostgreSQL está rodando
log "Verificando PostgreSQL..."
if ! sudo systemctl is-active --quiet postgresql; then
    log "Iniciando PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Configurar banco de dados
log "Configurando banco de dados..."

# Variáveis do banco
DB_NAME="sisfindb"
DB_USER="sisfinuser"
DB_PASSWORD="sisfinpass123"
DB_HOST="localhost"
DB_PORT="5432"

# Criar banco e usuário
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null || true

# Configurar .env
log "Configurando arquivo .env..."

# Detectar porta da aplicação
PORT=5000
if [[ -f ".env" ]] && grep -q "PORT=" .env; then
    PORT=$(grep "PORT=" .env | cut -d'=' -f2)
fi

# Detectar domínio/IP
DOMAIN="localhost"
if [[ -n "$1" ]]; then
    DOMAIN="$1"
fi

# Criar arquivo .env
cat > .env << EOF
# SisFin - Configuração de Ambiente
# Gerado automaticamente em $(date)

# ===========================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ===========================================
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# ===========================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ===========================================
NODE_ENV="production"
PORT=$PORT
SESSION_SECRET="$(openssl rand -base64 32)"

# ===========================================
# EVOLUTION API (WhatsApp Integration)
# ===========================================
EVOLUTION_API_URL="https://evolution-api.com"
EVOLUTION_API_KEY="sua-chave-api"
EVOLUTION_INSTANCE_NAME="sisfin"

# ===========================================
# CONFIGURAÇÕES SSL
# ===========================================
NODE_TLS_REJECT_UNAUTHORIZED=0

# ===========================================
# CONFIGURAÇÕES DE PRODUÇÃO
# ===========================================
BASE_URL="http://$DOMAIN:$PORT"
EOF

log "Arquivo .env configurado"

# Verificar conexão com banco
log "Testando conexão com banco..."
if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log "Conexão com banco funcionando"
    else
        error "Falha na conexão com banco. Verifique as configurações."
    fi
else
    warning "psql não encontrado. Pulando teste de conexão."
fi

# Instalar dependências se necessário
if [[ ! -d "node_modules" ]]; then
    log "Instalando dependências..."
    npm install
fi

# Executar migrations
log "Executando migrations do banco..."
npm run db:push 2>/dev/null || warning "Erro ao executar migrations"

# Compilar aplicação
log "Compilando aplicação..."
npm run build

# Configurar PM2
log "Configurando PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
    log "Instalando PM2..."
    sudo npm install -g pm2
fi

# Criar arquivo de configuração do PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'sisfin',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Criar diretório de logs
mkdir -p logs

# Iniciar aplicação
log "Iniciando aplicação..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Verificar status
log "Verificando status da aplicação..."
pm2 status

# Testar aplicação
log "Testando aplicação..."
sleep 5

if curl -s "http://localhost:$PORT" >/dev/null 2>&1; then
    log "Aplicação iniciada com sucesso!"
    echo ""
    echo -e "${GREEN}✅ PROBLEMA RESOLVIDO!${NC}"
    echo ""
    echo -e "${BLUE}Informações da aplicação:${NC}"
    echo "🔗 URL: http://$DOMAIN:$PORT"
    echo "🗄️  Banco: $DB_NAME"
    echo "👤 Usuário: $DB_USER"
    echo "🔑 Senha: $DB_PASSWORD"
    echo ""
    echo -e "${BLUE}Comandos úteis:${NC}"
    echo "• Ver logs: pm2 logs sisfin"
    echo "• Reiniciar: pm2 restart sisfin"
    echo "• Parar: pm2 stop sisfin"
    echo "• Status: pm2 status"
    echo ""
    echo -e "${BLUE}Próximos passos:${NC}"
    echo "1. Acesse: http://$DOMAIN:$PORT"
    echo "2. Configure Evolution API no painel admin"
    echo "3. Configure SSL se necessário"
else
    error "Falha ao iniciar aplicação. Verifique os logs: pm2 logs sisfin"
fi

# Configurar firewall
log "Configurando firewall..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow $PORT/tcp
    sudo ufw allow OpenSSH
    sudo ufw --force enable
fi

log "Configuração concluída!"