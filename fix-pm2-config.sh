#!/bin/bash

# Script para corrigir problemas de configuração do PM2 e ES6 modules
# Versão: 1.0
# Data: 13/07/2025

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

echo "=================================="
echo "🔧 CORREÇÃO DE CONFIGURAÇÃO PM2"
echo "=================================="

# 1. Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    error "Este script deve ser executado no diretório raiz do projeto"
    exit 1
fi

# 2. Parar processos PM2 existentes
log "Parando processos PM2 existentes..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop all >/dev/null 2>&1 || true
    pm2 delete all >/dev/null 2>&1 || true
    success "Processos PM2 parados"
else
    warning "PM2 não encontrado, será instalado posteriormente"
fi

# 3. Verificar se dotenv está instalado
log "Verificando dependências..."
if ! npm list dotenv >/dev/null 2>&1; then
    log "Instalando dotenv..."
    npm install dotenv
fi

# 4. Verificar se dotenv está importado corretamente no server/index.ts
log "Verificando configuração do dotenv..."
if ! grep -q "import dotenv from \"dotenv\"" server/index.ts; then
    log "Adicionando dotenv ao server/index.ts..."
    # Criar backup
    cp server/index.ts server/index.ts.bak
    
    # Adicionar dotenv no início do arquivo
    cat > temp_index.ts << 'EOF'
import dotenv from "dotenv";
// Carregar variáveis de ambiente ANTES de qualquer importação
dotenv.config();

EOF
    
    # Adicionar o resto do arquivo, removendo imports de dotenv existentes
    grep -v "import dotenv" server/index.ts | grep -v "dotenv.config()" >> temp_index.ts
    mv temp_index.ts server/index.ts
    
    success "Dotenv configurado corretamente"
else
    success "Dotenv já está configurado"
fi

# 5. Criar arquivo .env se não existir
if [[ ! -f ".env" ]]; then
    log "Criando arquivo .env..."
    cat > .env << 'EOF'
# ==============================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ==============================================

# Se executando no Replit, a DATABASE_URL será carregada automaticamente
# Se executando em VPS/local, descomente e configure abaixo:
# DATABASE_URL=postgresql://sisfinuser:sisfinpass123@localhost:5432/sisfindb

# ==============================================
# CONFIGURAÇÕES DE SESSÃO
# ==============================================

SESSION_SECRET=sua-chave-secreta-super-segura-de-32-caracteres-para-producao

# ==============================================
# CONFIGURAÇÕES DA EVOLUTION API (WHATSAPP)
# ==============================================

EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema

# ==============================================
# CONFIGURAÇÕES DO AMBIENTE
# ==============================================

NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# ==============================================
# CONFIGURAÇÕES SSL
# ==============================================

NODE_TLS_REJECT_UNAUTHORIZED=0
EOF
    success "Arquivo .env criado"
fi

# 6. Criar diretório de logs
log "Criando diretório de logs..."
mkdir -p logs
success "Diretório de logs criado"

# 7. Criar configuração do PM2 (CommonJS)
log "Criando configuração do PM2..."
cat > ecosystem.config.js << 'EOF'
// Configuração do PM2 - usa CommonJS por compatibilidade
module.exports = {
  apps: [{
    name: 'sisfin',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    // Configurações de log
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    
    // Configurações de reinicialização
    autorestart: true,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    
    // Configurações de monitoramento
    watch: false,
    source_map_support: true,
    merge_logs: true,
    kill_timeout: 5000
  }]
};
EOF
success "Configuração do PM2 criada"

# 8. Compilar aplicação
log "Compilando aplicação..."
if npm run build; then
    success "Aplicação compilada com sucesso"
else
    error "Falha na compilação da aplicação"
    exit 1
fi

# 9. Verificar se dist/index.js foi criado
if [[ ! -f "dist/index.js" ]]; then
    error "Arquivo dist/index.js não foi criado. Verifique a compilação."
    exit 1
fi

# 10. Instalar PM2 se necessário
if ! command -v pm2 >/dev/null 2>&1; then
    log "Instalando PM2..."
    npm install -g pm2
    success "PM2 instalado"
fi

# 11. Testar variáveis de ambiente
log "Testando variáveis de ambiente..."
if node test-env.js 2>/dev/null; then
    success "Variáveis de ambiente OK"
else
    warning "Arquivo test-env.js não encontrado ou erro na execução"
fi

# 12. Iniciar aplicação com PM2
log "Iniciando aplicação com PM2..."
if pm2 start ecosystem.config.js; then
    success "Aplicação iniciada com PM2"
    pm2 save
    pm2 startup
else
    error "Falha ao iniciar aplicação com PM2"
    exit 1
fi

# 13. Verificar status
log "Verificando status da aplicação..."
pm2 status

# 14. Testar aplicação
log "Testando aplicação..."
sleep 5

PORT=${PORT:-5000}
if curl -s "http://localhost:$PORT" >/dev/null 2>&1; then
    success "Aplicação funcionando corretamente!"
    
    echo ""
    echo -e "${GREEN}✅ CORREÇÃO CONCLUÍDA COM SUCESSO!${NC}"
    echo ""
    echo -e "${BLUE}Comandos úteis do PM2:${NC}"
    echo "• Ver logs: pm2 logs sisfin"
    echo "• Reiniciar: pm2 restart sisfin"
    echo "• Parar: pm2 stop sisfin"
    echo "• Status: pm2 status"
    echo "• Monitorar: pm2 monit"
    echo ""
    echo -e "${BLUE}Aplicação disponível em:${NC}"
    echo "🔗 http://localhost:$PORT"
    
else
    error "Aplicação não está respondendo"
    echo ""
    echo -e "${YELLOW}Para debugar:${NC}"
    echo "• Verificar logs: pm2 logs sisfin"
    echo "• Verificar status: pm2 status"
    echo "• Testar variáveis: node test-env.js"
fi

echo ""
echo "=================================="
echo "🎉 SCRIPT CONCLUÍDO"
echo "=================================="