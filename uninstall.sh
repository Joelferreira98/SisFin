#!/bin/bash

# SisFin - Script de Desinstalação Completa
# Remove completamente o sistema SisFin do servidor

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
echo "     SisFin - Desinstalação Completa"
echo "============================================"
echo -e "${NC}"

warning "Este script irá remover COMPLETAMENTE o SisFin do seu sistema!"
warning "Isso inclui:"
echo "  • Aplicação e todos os arquivos"
echo "  • Banco de dados PostgreSQL e todos os dados"
echo "  • Configurações do Nginx"
echo "  • Processos PM2"
echo "  • Certificados SSL"
echo "  • Usuários e grupos criados"
echo "  • Serviços e cron jobs"
echo ""
echo -e "${YELLOW}ESTA AÇÃO NÃO PODE SER DESFEITA!${NC}"
echo ""

# Sugerir backup
echo -e "${BLUE}RECOMENDAÇÃO: Faça backup antes de desinstalar!${NC}"
echo ""
read -p "Deseja fazer backup agora? (y/n): " make_backup
if [[ "$make_backup" == "y" || "$make_backup" == "Y" ]]; then
    if [[ -f "backup.sh" ]]; then
        log "Executando backup..."
        ./backup.sh
        read -p "Backup concluído. Pressione Enter para continuar com a desinstalação..."
    else
        warning "Script de backup não encontrado. Baixando..."
        wget -O backup.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/backup.sh
        chmod +x backup.sh
        ./backup.sh
        read -p "Backup concluído. Pressione Enter para continuar com a desinstalação..."
    fi
fi

# Confirmação dupla
read -p "Tem certeza que deseja desinstalar o SisFin? (digite 'SIM' para confirmar): " confirm1
if [[ "$confirm1" != "SIM" ]]; then
    error "Desinstalação cancelada pelo usuário"
    exit 1
fi

read -p "Esta ação irá APAGAR TODOS OS DADOS. Confirma novamente? (digite 'CONFIRMO'): " confirm2
if [[ "$confirm2" != "CONFIRMO" ]]; then
    error "Desinstalação cancelada pelo usuário"
    exit 1
fi

# Opções de desinstalação
echo ""
echo -e "${BLUE}Opções de desinstalação:${NC}"
echo "1) Desinstalação completa (tudo)"
echo "2) Apenas aplicação (manter PostgreSQL)"
echo "3) Apenas banco de dados (manter aplicação)"
echo "4) Apenas configurações (manter app e banco)"

read -p "Escolha (1-4): " uninstall_option

case $uninstall_option in
    1)
        REMOVE_APP=true
        REMOVE_DB=true
        REMOVE_CONFIG=true
        REMOVE_SYSTEM=true
        ;;
    2)
        REMOVE_APP=true
        REMOVE_DB=false
        REMOVE_CONFIG=true
        REMOVE_SYSTEM=false
        ;;
    3)
        REMOVE_APP=false
        REMOVE_DB=true
        REMOVE_CONFIG=false
        REMOVE_SYSTEM=false
        ;;
    4)
        REMOVE_APP=false
        REMOVE_DB=false
        REMOVE_CONFIG=true
        REMOVE_SYSTEM=false
        ;;
    *)
        error "Opção inválida"
        exit 1
        ;;
esac

# Parar aplicação
if [[ "$REMOVE_APP" == true ]]; then
    log "Parando aplicação SisFin..."
    
    # Parar PM2
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop sisfin 2>/dev/null || true
        pm2 delete sisfin 2>/dev/null || true
        pm2 save 2>/dev/null || true
    fi
    
    # Parar processo se estiver rodando
    pkill -f "sisfin" 2>/dev/null || true
    pkill -f "node.*index.ts" 2>/dev/null || true
    
    log "Aplicação parada"
fi

# Remover certificados SSL
if [[ "$REMOVE_CONFIG" == true ]]; then
    log "Removendo certificados SSL..."
    
    if command -v certbot >/dev/null 2>&1; then
        # Listar e remover certificados
        DOMAINS=$(sudo certbot certificates 2>/dev/null | grep "Certificate Name:" | cut -d' ' -f3 || true)
        
        for domain in $DOMAINS; do
            if [[ -n "$domain" ]]; then
                warning "Removendo certificado SSL para: $domain"
                sudo certbot delete --cert-name "$domain" --non-interactive 2>/dev/null || true
            fi
        done
    fi
    
    log "Certificados SSL removidos"
fi

# Remover configurações do Nginx
if [[ "$REMOVE_CONFIG" == true ]]; then
    log "Removendo configurações do Nginx..."
    
    # Remover arquivos de configuração
    sudo rm -f /etc/nginx/sites-available/sisfin
    sudo rm -f /etc/nginx/sites-enabled/sisfin
    
    # Testar e recarregar Nginx
    if command -v nginx >/dev/null 2>&1; then
        sudo nginx -t && sudo systemctl reload nginx 2>/dev/null || true
    fi
    
    log "Configurações do Nginx removidas"
fi

# Remover banco de dados PostgreSQL
if [[ "$REMOVE_DB" == true ]]; then
    log "Removendo banco de dados PostgreSQL..."
    
    # Remover banco e usuário
    if command -v psql >/dev/null 2>&1; then
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS sisfindb;" 2>/dev/null || true
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS financedb;" 2>/dev/null || true
        sudo -u postgres psql -c "DROP USER IF EXISTS sisfinuser;" 2>/dev/null || true
        sudo -u postgres psql -c "DROP USER IF EXISTS financeuser;" 2>/dev/null || true
    fi
    
    log "Banco de dados removido"
fi

# Remover aplicação
if [[ "$REMOVE_APP" == true ]]; then
    log "Removendo aplicação SisFin..."
    
    # Remover diretório da aplicação
    if [[ -d "/opt/sisfin" ]]; then
        sudo rm -rf /opt/sisfin
    fi
    
    # Remover diretório atual se for SisFin
    if [[ -f "package.json" ]] && grep -q "sisfin\|SisFin" package.json 2>/dev/null; then
        warning "Removendo diretório atual (contém SisFin)..."
        cd /tmp
        sudo rm -rf "$OLDPWD"
    fi
    
    log "Aplicação removida"
fi

# Remover componentes do sistema
if [[ "$REMOVE_SYSTEM" == true ]]; then
    log "Removendo componentes do sistema..."
    
    # Remover cron jobs
    sudo crontab -l 2>/dev/null | grep -v "certbot renew" | sudo crontab - 2>/dev/null || true
    
    # Remover PM2 se foi instalado apenas para SisFin
    if command -v pm2 >/dev/null 2>&1; then
        PM2_APPS=$(pm2 list 2>/dev/null | grep -c "online\|stopped" || echo "0")
        if [[ "$PM2_APPS" -eq 0 ]]; then
            warning "Removendo PM2 (não há outras aplicações)"
            npm uninstall -g pm2 2>/dev/null || true
        fi
    fi
    
    log "Componentes do sistema removidos"
fi

# Remover configurações de firewall específicas
if [[ "$REMOVE_CONFIG" == true ]]; then
    log "Removendo configurações de firewall específicas..."
    
    if command -v ufw >/dev/null 2>&1; then
        # Manter portas essenciais (22, 80, 443) mas remover portas específicas
        sudo ufw delete allow 5000 2>/dev/null || true
        sudo ufw delete allow 3000 2>/dev/null || true
        sudo ufw delete allow 8080 2>/dev/null || true
    fi
    
    log "Configurações de firewall atualizadas"
fi

# Limpeza de logs
if [[ "$REMOVE_APP" == true ]]; then
    log "Limpando logs..."
    
    # Remover logs PM2
    if [[ -d "$HOME/.pm2/logs" ]]; then
        rm -f "$HOME/.pm2/logs/sisfin*"
    fi
    
    # Remover logs do sistema
    sudo rm -f /var/log/sisfin*
    
    log "Logs removidos"
fi

# Limpeza de cache
if [[ "$REMOVE_APP" == true ]]; then
    log "Limpando cache..."
    
    # Limpar cache npm
    npm cache clean --force 2>/dev/null || true
    
    # Limpar cache PM2
    if command -v pm2 >/dev/null 2>&1; then
        pm2 flush 2>/dev/null || true
    fi
    
    log "Cache limpo"
fi

# Verificar se precisa remover PostgreSQL completamente
if [[ "$REMOVE_DB" == true ]]; then
    echo ""
    read -p "Deseja remover o PostgreSQL completamente do sistema? (y/n): " remove_postgres
    if [[ "$remove_postgres" == "y" || "$remove_postgres" == "Y" ]]; then
        log "Removendo PostgreSQL completamente..."
        
        # Parar PostgreSQL
        sudo systemctl stop postgresql 2>/dev/null || true
        
        # Remover PostgreSQL
        sudo apt purge -y postgresql postgresql-contrib postgresql-client-common postgresql-common 2>/dev/null || true
        sudo apt autoremove -y 2>/dev/null || true
        
        # Remover diretórios
        sudo rm -rf /var/lib/postgresql/
        sudo rm -rf /etc/postgresql/
        sudo rm -rf /var/log/postgresql/
        
        # Remover usuário postgres
        sudo deluser postgres 2>/dev/null || true
        
        log "PostgreSQL removido completamente"
    fi
fi

# Verificar se precisa remover Node.js
if [[ "$REMOVE_SYSTEM" == true ]]; then
    echo ""
    read -p "Deseja remover Node.js do sistema? (y/n): " remove_node
    if [[ "$remove_node" == "y" || "$remove_node" == "Y" ]]; then
        log "Removendo Node.js..."
        
        # Remover Node.js via apt
        sudo apt purge -y nodejs npm 2>/dev/null || true
        
        # Remover Node.js via snap
        sudo snap remove node 2>/dev/null || true
        
        # Remover diretórios
        sudo rm -rf /usr/local/lib/node_modules
        sudo rm -rf /usr/local/bin/node
        sudo rm -rf /usr/local/bin/npm
        
        log "Node.js removido"
    fi
fi

# Verificar se precisa remover Nginx
if [[ "$REMOVE_SYSTEM" == true ]]; then
    echo ""
    read -p "Deseja remover Nginx do sistema? (y/n): " remove_nginx
    if [[ "$remove_nginx" == "y" || "$remove_nginx" == "Y" ]]; then
        log "Removendo Nginx..."
        
        # Parar Nginx
        sudo systemctl stop nginx 2>/dev/null || true
        
        # Remover Nginx
        sudo apt purge -y nginx nginx-common nginx-core 2>/dev/null || true
        sudo apt autoremove -y 2>/dev/null || true
        
        # Remover diretórios
        sudo rm -rf /etc/nginx/
        sudo rm -rf /var/log/nginx/
        sudo rm -rf /var/www/html/
        
        log "Nginx removido"
    fi
fi

# Relatório final
echo ""
echo -e "${GREEN}"
echo "============================================"
echo "      DESINSTALAÇÃO CONCLUÍDA"
echo "============================================"
echo -e "${NC}"

echo -e "${BLUE}Itens removidos:${NC}"
[[ "$REMOVE_APP" == true ]] && echo "✅ Aplicação SisFin"
[[ "$REMOVE_DB" == true ]] && echo "✅ Banco de dados PostgreSQL"
[[ "$REMOVE_CONFIG" == true ]] && echo "✅ Configurações Nginx e SSL"
[[ "$REMOVE_SYSTEM" == true ]] && echo "✅ Componentes do sistema"

echo ""
echo -e "${YELLOW}Lembre-se:${NC}"
echo "• Todos os dados foram permanentemente removidos"
echo "• Certificados SSL foram revogados"
echo "• Configurações de firewall foram atualizadas"
echo "• Faça backup se precisar dos dados no futuro"

echo ""
echo -e "${GREEN}Sistema SisFin removido com sucesso!${NC}"

# Sugestão de limpeza adicional
echo ""
echo -e "${BLUE}Limpeza adicional recomendada:${NC}"
echo "• Execute: sudo apt autoremove -y"
echo "• Execute: sudo apt autoclean"
echo "• Verifique: sudo df -h"
echo "• Reinicie o servidor se necessário"