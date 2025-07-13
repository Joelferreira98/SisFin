#!/bin/bash

# SisFin - Script de Backup Completo
# Cria backup completo do sistema antes da desinstalação ou manutenção

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
echo -e "${BLUE}"
echo "============================================"
echo "        SisFin - Backup Completo"
echo "============================================"
echo -e "${NC}"

# Verificar se é root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Use um usuário normal com sudo."
fi

# Configurações
BACKUP_DIR="/tmp/sisfin-backup-$(date +%Y%m%d_%H%M%S)"
CURRENT_DIR=$(pwd)
DB_NAME="sisfindb"
DB_USER="sisfinuser"

# Criar diretório de backup
log "Criando diretório de backup: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup da aplicação
log "Fazendo backup da aplicação..."
if [[ -f "package.json" ]] && grep -q "sisfin\|SisFin" package.json 2>/dev/null; then
    # Backup do código fonte
    tar -czf "$BACKUP_DIR/app-source.tar.gz" \
        --exclude=node_modules \
        --exclude=dist \
        --exclude=.git \
        --exclude=*.log \
        --exclude=.env \
        . || warning "Erro ao fazer backup do código fonte"
    
    # Backup do .env (sem valores sensíveis)
    if [[ -f ".env" ]]; then
        cp .env "$BACKUP_DIR/env-backup.txt"
        log "Backup do .env criado"
    fi
    
    # Backup do package.json e package-lock.json
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true
    cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
    
    log "Backup da aplicação concluído"
else
    warning "Diretório atual não parece conter o SisFin"
fi

# Backup do banco de dados
log "Fazendo backup do banco de dados..."
if command -v pg_dump >/dev/null 2>&1; then
    # Backup completo do banco
    if sudo -u postgres pg_dump -d "$DB_NAME" > "$BACKUP_DIR/database-full.sql" 2>/dev/null; then
        log "Backup completo do banco criado"
    else
        warning "Erro ao fazer backup do banco $DB_NAME"
    fi
    
    # Backup apenas dos dados (sem estrutura)
    if sudo -u postgres pg_dump -d "$DB_NAME" --data-only > "$BACKUP_DIR/database-data.sql" 2>/dev/null; then
        log "Backup dos dados do banco criado"
    else
        warning "Erro ao fazer backup dos dados"
    fi
    
    # Backup apenas da estrutura (sem dados)
    if sudo -u postgres pg_dump -d "$DB_NAME" --schema-only > "$BACKUP_DIR/database-schema.sql" 2>/dev/null; then
        log "Backup da estrutura do banco criado"
    else
        warning "Erro ao fazer backup da estrutura"
    fi
else
    warning "PostgreSQL não encontrado. Pulando backup do banco."
fi

# Backup das configurações do Nginx
log "Fazendo backup das configurações do Nginx..."
if [[ -f "/etc/nginx/sites-available/sisfin" ]]; then
    sudo cp /etc/nginx/sites-available/sisfin "$BACKUP_DIR/nginx-sisfin.conf"
    log "Backup da configuração do Nginx criado"
else
    warning "Configuração do Nginx não encontrada"
fi

# Backup das configurações do PM2
log "Fazendo backup das configurações do PM2..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 save 2>/dev/null || true
    if [[ -f "$HOME/.pm2/dump.pm2" ]]; then
        cp "$HOME/.pm2/dump.pm2" "$BACKUP_DIR/pm2-apps.json"
        log "Backup das configurações do PM2 criado"
    fi
    
    # Backup dos logs do PM2
    if [[ -d "$HOME/.pm2/logs" ]]; then
        mkdir -p "$BACKUP_DIR/pm2-logs"
        cp "$HOME/.pm2/logs/sisfin"* "$BACKUP_DIR/pm2-logs/" 2>/dev/null || true
        log "Backup dos logs do PM2 criado"
    fi
else
    warning "PM2 não encontrado"
fi

# Backup dos certificados SSL
log "Fazendo backup dos certificados SSL..."
if [[ -d "/etc/letsencrypt" ]]; then
    sudo tar -czf "$BACKUP_DIR/ssl-certificates.tar.gz" /etc/letsencrypt/ 2>/dev/null || warning "Erro ao fazer backup dos certificados SSL"
    log "Backup dos certificados SSL criado"
else
    warning "Certificados SSL não encontrados"
fi

# Backup das configurações do sistema
log "Fazendo backup das configurações do sistema..."

# Cron jobs
sudo crontab -l > "$BACKUP_DIR/crontab-backup.txt" 2>/dev/null || echo "Sem cron jobs" > "$BACKUP_DIR/crontab-backup.txt"

# Configurações de firewall
if command -v ufw >/dev/null 2>&1; then
    sudo ufw status numbered > "$BACKUP_DIR/firewall-rules.txt" 2>/dev/null || true
fi

# Informações do sistema
uname -a > "$BACKUP_DIR/system-info.txt"
cat /etc/os-release >> "$BACKUP_DIR/system-info.txt"

# Lista de pacotes instalados
dpkg --get-selections > "$BACKUP_DIR/installed-packages.txt" 2>/dev/null || true

# Criar script de restauração
log "Criando script de restauração..."
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/bin/bash

# SisFin - Script de Restauração
# Restaura o backup criado pelo script backup.sh

set -e

BACKUP_DIR=$(dirname "$0")
echo "Restaurando backup do SisFin..."

# Verificar se arquivos de backup existem
if [[ ! -f "$BACKUP_DIR/database-full.sql" ]]; then
    echo "Erro: Backup do banco não encontrado"
    exit 1
fi

echo "1. Restaurando banco de dados..."
sudo -u postgres createdb sisfindb 2>/dev/null || true
sudo -u postgres psql -d sisfindb < "$BACKUP_DIR/database-full.sql"

echo "2. Restaurando aplicação..."
if [[ -f "$BACKUP_DIR/app-source.tar.gz" ]]; then
    tar -xzf "$BACKUP_DIR/app-source.tar.gz" -C /opt/sisfin/
fi

echo "3. Restaurando configurações do Nginx..."
if [[ -f "$BACKUP_DIR/nginx-sisfin.conf" ]]; then
    sudo cp "$BACKUP_DIR/nginx-sisfin.conf" /etc/nginx/sites-available/sisfin
    sudo ln -sf /etc/nginx/sites-available/sisfin /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
fi

echo "4. Restaurando certificados SSL..."
if [[ -f "$BACKUP_DIR/ssl-certificates.tar.gz" ]]; then
    sudo tar -xzf "$BACKUP_DIR/ssl-certificates.tar.gz" -C /
fi

echo "5. Restaurando PM2..."
if [[ -f "$BACKUP_DIR/pm2-apps.json" ]]; then
    pm2 resurrect "$BACKUP_DIR/pm2-apps.json"
fi

echo "Restauração concluída!"
echo "Execute: cd /opt/sisfin && npm install && npm run dev"
EOF

chmod +x "$BACKUP_DIR/restore.sh"

# Criar arquivo de informações do backup
cat > "$BACKUP_DIR/backup-info.txt" << EOF
SisFin - Informações do Backup
==============================

Data/Hora: $(date)
Diretório de origem: $CURRENT_DIR
Backup criado em: $BACKUP_DIR

Arquivos incluídos:
- app-source.tar.gz: Código fonte da aplicação
- database-full.sql: Backup completo do banco
- database-data.sql: Apenas dados do banco
- database-schema.sql: Apenas estrutura do banco
- nginx-sisfin.conf: Configuração do Nginx
- pm2-apps.json: Configurações do PM2
- ssl-certificates.tar.gz: Certificados SSL
- env-backup.txt: Variáveis de ambiente
- restore.sh: Script de restauração
- system-info.txt: Informações do sistema
- installed-packages.txt: Lista de pacotes instalados
- crontab-backup.txt: Cron jobs
- firewall-rules.txt: Regras do firewall

Para restaurar:
1. Instale o SisFin em um servidor limpo
2. Execute: chmod +x restore.sh && ./restore.sh
3. Configure as variáveis de ambiente
4. Inicie a aplicação

IMPORTANTE: Teste a restauração antes de usar em produção!
EOF

# Compactar backup completo
log "Compactando backup completo..."
BACKUP_FILE="/tmp/sisfin-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")"

# Limpar diretório temporário
rm -rf "$BACKUP_DIR"

# Resultado final
echo ""
echo -e "${GREEN}"
echo "============================================"
echo "         BACKUP CONCLUÍDO!"
echo "============================================"
echo -e "${NC}"

echo -e "${BLUE}Arquivo de backup criado:${NC}"
echo "📁 $BACKUP_FILE"
echo ""

echo -e "${BLUE}Tamanho do backup:${NC}"
ls -lh "$BACKUP_FILE"
echo ""

echo -e "${BLUE}Conteúdo do backup:${NC}"
echo "✅ Código fonte da aplicação"
echo "✅ Banco de dados completo"
echo "✅ Configurações do Nginx"
echo "✅ Certificados SSL"
echo "✅ Configurações do PM2"
echo "✅ Variáveis de ambiente"
echo "✅ Script de restauração"
echo "✅ Informações do sistema"
echo ""

echo -e "${YELLOW}Para restaurar:${NC}"
echo "1. Extraia o backup: tar -xzf $BACKUP_FILE"
echo "2. Entre no diretório: cd $(basename "$BACKUP_DIR")"
echo "3. Execute: ./restore.sh"
echo ""

echo -e "${GREEN}Backup salvo com sucesso!${NC}"
echo ""

echo -e "${BLUE}Próximos passos:${NC}"
echo "• Baixe o arquivo de backup para local seguro"
echo "• Teste a restauração em ambiente de desenvolvimento"
echo "• Guarde o backup em local seguro (fora do servidor)"
echo "• Para desinstalar o sistema, execute: ./uninstall.sh"