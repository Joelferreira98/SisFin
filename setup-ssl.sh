#!/bin/bash

# SisFin - Script de Configuração SSL
# Para uso em instalações existentes

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
echo "       SisFin - Configuração SSL"
echo "============================================"
echo -e "${NC}"

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Use um usuário normal com sudo."
fi

# Verificar se Nginx está instalado
if ! command -v nginx >/dev/null 2>&1; then
    error "Nginx não está instalado. Execute primeiro o script de instalação completo."
fi

# Verificar se a aplicação está rodando
if ! pgrep -f "sisfin" > /dev/null; then
    error "Aplicação SisFin não está rodando. Execute: pm2 start sisfin"
fi

# Solicitar domínio
read -p "Digite seu domínio (ex: meusite.com): " DOMAIN
if [[ -z "$DOMAIN" ]]; then
    error "Domínio é obrigatório"
fi

# Solicitar email para certificado
read -p "Digite seu email para o certificado SSL: " EMAIL
if [[ -z "$EMAIL" ]]; then
    EMAIL="admin@$DOMAIN"
    warning "Usando email padrão: $EMAIL"
fi

# Obter IP do servidor
SERVER_IP=$(curl -s ifconfig.me)
log "IP do servidor: $SERVER_IP"

# Verificar se domínio aponta para o servidor
log "Verificando configuração DNS..."
DOMAIN_IP=$(nslookup $DOMAIN | grep -A 2 "Non-authoritative answer:" | grep Address | tail -1 | cut -d' ' -f2 2>/dev/null || echo "")

if [[ "$DOMAIN_IP" != "$SERVER_IP" ]]; then
    warning "ATENÇÃO: O domínio $DOMAIN não aponta para este servidor"
    warning "IP do servidor: $SERVER_IP"
    warning "IP do domínio: $DOMAIN_IP"
    warning "Configure o DNS antes de continuar:"
    warning "  - Crie um registro A apontando $DOMAIN para $SERVER_IP"
    warning "  - Aguarde a propagação DNS (pode levar até 48h)"
    read -p "Domínio já está configurado corretamente? (y/n): " dns_ready
    if [[ $dns_ready != "y" && $dns_ready != "Y" ]]; then
        error "Configure o DNS primeiro e execute novamente"
    fi
fi

# Instalar certbot
log "Instalando certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Atualizar configuração do Nginx
log "Atualizando configuração do Nginx..."
sudo tee /etc/nginx/sites-available/sisfin > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
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

# Testar configuração do Nginx
if ! sudo nginx -t; then
    error "Erro na configuração do Nginx"
fi

# Reiniciar Nginx
sudo systemctl reload nginx

# Configurar certificado SSL
log "Configurando certificado SSL para $DOMAIN..."
if sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL; then
    log "Certificado SSL configurado com sucesso!"
    
    # Configurar renovação automática
    log "Configurando renovação automática..."
    (sudo crontab -l 2>/dev/null || echo "") | grep -v "certbot renew" | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -
    
    # Testar renovação
    log "Testando renovação automática..."
    if sudo certbot renew --dry-run; then
        log "Renovação automática configurada corretamente"
    else
        warning "Problema na configuração da renovação automática"
    fi
    
    # Atualizar .env se existir
    if [[ -f ".env" ]]; then
        log "Atualizando configuração da aplicação..."
        if grep -q "base_url" .env; then
            sed -i "s|base_url.*|base_url=https://$DOMAIN|" .env
        else
            echo "base_url=https://$DOMAIN" >> .env
        fi
        
        # Reiniciar aplicação
        pm2 restart sisfin 2>/dev/null || true
    fi
    
    # Configurar redirecionamento HTTPS
    log "Configurando redirecionamento HTTPS..."
    sudo systemctl reload nginx
    
    echo -e "${GREEN}"
    echo "============================================"
    echo "         SSL CONFIGURADO COM SUCESSO!"
    echo "============================================"
    echo -e "${NC}"
    echo -e "${BLUE}Informações do SSL:${NC}"
    echo "• Domínio: $DOMAIN"
    echo "• URL: https://$DOMAIN"
    echo "• Certificado: Let's Encrypt"
    echo "• Renovação: Automática (diário às 12h)"
    echo "• Email: $EMAIL"
    echo ""
    echo -e "${YELLOW}Comandos úteis:${NC}"
    echo "• Verificar SSL: sudo certbot certificates"
    echo "• Renovar SSL: sudo certbot renew"
    echo "• Testar renovação: sudo certbot renew --dry-run"
    echo "• Status Nginx: sudo systemctl status nginx"
    echo ""
    echo -e "${GREEN}Seu site agora está seguro com HTTPS!${NC}"
    
else
    error "Falha ao configurar certificado SSL. Verifique:"
    echo "1. Domínio está apontando para o servidor"
    echo "2. Portas 80 e 443 estão abertas no firewall"
    echo "3. Nginx está funcionando corretamente"
fi