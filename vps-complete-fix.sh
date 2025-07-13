#!/bin/bash

# SisFin - Script de Deploy VPS Completo
# Versão: 2.0
# Compatível com: Ubuntu 20.04+

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
echo -e "${BLUE}"
echo "============================================"
echo "       SisFin - Deploy VPS Automatizado"
echo "============================================"
echo -e "${NC}"

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Use um usuário normal com sudo."
fi

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Atualizar sistema
log "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
log "Instalando dependências básicas..."
sudo apt install -y curl wget git nginx postgresql postgresql-contrib build-essential

# Instalar Node.js 20
log "Instalando Node.js 20..."
if ! command_exists node || [[ $(node --version | cut -d'.' -f1 | cut -d'v' -f2) -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar versões
log "Verificando versões instaladas..."
node --version
npm --version
psql --version

# Configurar PostgreSQL
log "Configurando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
log "Criando banco de dados e usuário..."
sudo -u postgres createdb sisfindb 2>/dev/null || info "Banco sisfindb já existe"
sudo -u postgres psql -c "CREATE USER sisfinuser WITH PASSWORD 'sisfinpass123';" 2>/dev/null || info "Usuário sisfinuser já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sisfindb TO sisfinuser;" 2>/dev/null || info "Permissões já concedidas"

# Configurar PostgreSQL para aceitar conexões
log "Configurando PostgreSQL para aceitar conexões..."
PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
PG_CONFIG_DIR="/etc/postgresql/${PG_VERSION}/main"

if [ -d "$PG_CONFIG_DIR" ]; then
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONFIG_DIR/postgresql.conf"
    sudo systemctl restart postgresql
fi

# Clone do repositório
log "Clonando repositório SisFin..."
if [ -d "SisFin" ]; then
    cd SisFin
    git pull origin main
else
    git clone https://github.com/Joelferreira98/SisFin.git
    cd SisFin
fi

# Instalar dependências do projeto
log "Instalando dependências do projeto..."
npm install

# Configurar arquivo .env
log "Configurando arquivo .env..."
cat > .env << EOF
# SisFin - Configuração de Produção
NODE_ENV=production
DATABASE_URL="postgresql://sisfinuser:sisfinpass123@localhost:5432/sisfindb"
SESSION_SECRET="$(openssl rand -base64 32)"
PORT=5000

# Evolution API (configure conforme necessário)
EVOLUTION_API_URL="https://sua-evolution-api.com"
EVOLUTION_API_KEY="sua-chave-api"
EVOLUTION_INSTANCE_NAME="sua-instancia"

# SSL
NODE_TLS_REJECT_UNAUTHORIZED=0
EOF

# Build da aplicação
log "Fazendo build da aplicação..."
npm run build

# Aplicar schema do banco
log "Aplicando schema do banco de dados..."
npm run db:push

# Instalar PM2
log "Instalando PM2..."
if ! command_exists pm2; then
    sudo npm install -g pm2
fi

# Configurar PM2
log "Configurando PM2..."
pm2 stop sisfin 2>/dev/null || true
pm2 delete sisfin 2>/dev/null || true
pm2 start npm --name "sisfin" -- start
pm2 save
pm2 startup | grep -v "PM2" | sudo bash || true

# Configurar Nginx
log "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/sisfin > /dev/null << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/sisfin /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Configurar firewall
log "Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Função para seleção de porta
select_port() {
    echo -e "${BLUE}Selecione uma porta para a aplicação:${NC}"
    echo "1) 5000 (padrão)"
    echo "2) 3000"
    echo "3) 8080"
    echo "4) 80"
    echo "5) Porta customizada"
    
    read -p "Escolha (1-5): " choice
    
    case $choice in
        1) PORT=5000 ;;
        2) PORT=3000 ;;
        3) PORT=8080 ;;
        4) PORT=80 ;;
        5) 
            read -p "Digite a porta customizada: " PORT
            ;;
        *) 
            warning "Opção inválida. Usando porta padrão 5000."
            PORT=5000 
            ;;
    esac
    
    # Atualizar .env com a porta selecionada
    sed -i "s/PORT=5000/PORT=$PORT/" .env
    
    # Atualizar configuração do Nginx
    sudo sed -i "s/proxy_pass http:\/\/localhost:5000/proxy_pass http:\/\/localhost:$PORT/" /etc/nginx/sites-available/sisfin
    sudo systemctl restart nginx
    
    # Reiniciar aplicação
    pm2 restart sisfin
    
    log "Porta configurada para: $PORT"
}

# Perguntar se quer mudar a porta
read -p "Deseja alterar a porta padrão (5000)? (y/n): " change_port
if [[ $change_port == "y" || $change_port == "Y" ]]; then
    select_port
fi

# Obter IP do servidor
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

# Teste final
log "Testando aplicação..."
sleep 5
if curl -s http://localhost:${PORT:-5000} > /dev/null; then
    echo -e "${GREEN}✅ Aplicação funcionando corretamente!${NC}"
else
    warning "Aplicação pode não estar respondendo. Verifique os logs."
fi

# Instruções finais
echo -e "${GREEN}"
echo "============================================"
echo "         DEPLOY CONCLUÍDO COM SUCESSO!"
echo "============================================"
echo -e "${NC}"
echo -e "${BLUE}Informações do Deploy:${NC}"
echo "• Aplicação: http://$SERVER_IP:${PORT:-5000}"
echo "• Banco: PostgreSQL rodando na porta 5432"
echo "• PM2: Aplicação rodando em background"
echo "• Nginx: Proxy reverso configurado"
echo "• Firewall: Portas 22, 80, 443 liberadas"
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "• Ver logs: pm2 logs sisfin"
echo "• Status: pm2 status"
echo "• Reiniciar: pm2 restart sisfin"
echo "• Parar: pm2 stop sisfin"
echo "• Logs Nginx: sudo tail -f /var/log/nginx/access.log"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Configure um domínio apontando para $SERVER_IP"
echo "2. Configure SSL com: sudo certbot --nginx -d seu-dominio.com"
echo "3. Configure Evolution API nas configurações do sistema"
echo "4. Crie o primeiro usuário administrador"
echo ""
echo -e "${GREEN}Deploy finalizado! Sua aplicação está pronta para uso.${NC}"