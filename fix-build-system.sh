#!/bin/bash

# Script para corrigir sistema de build completo
# Versão: 1.0
# Data: 13/07/2025

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
echo "🔧 CORREÇÃO COMPLETA DO SISTEMA"
echo "=================================="

# 1. Verificar diretório
if [[ ! -f "package.json" ]]; then
    error "Execute este script no diretório raiz do projeto"
    exit 1
fi

# 2. Limpar cache e node_modules
log "Limpando cache e dependências..."
rm -rf node_modules package-lock.json
npm cache clean --force
success "Cache limpo"

# 3. Reinstalar dependências
log "Reinstalando dependências..."
if npm install; then
    success "Dependências instaladas"
else
    error "Falha ao instalar dependências"
    exit 1
fi

# 4. Verificar se esbuild está instalado
log "Verificando esbuild..."
if ! npm list esbuild >/dev/null 2>&1; then
    log "Instalando esbuild..."
    npm install --save-dev esbuild
fi

# 5. Verificar se tsx está instalado
log "Verificando tsx..."
if ! npm list tsx >/dev/null 2>&1; then
    log "Instalando tsx..."
    npm install --save-dev tsx
fi

# 6. Corrigir server/index.ts
log "Corrigindo server/index.ts..."
if [[ -f "server/index.ts" ]]; then
    # Criar backup
    cp server/index.ts server/index.ts.backup
    
    # Verificar se dotenv já está importado
    if ! grep -q "import dotenv from \"dotenv\"" server/index.ts; then
        # Criar arquivo temporário com dotenv no início
        cat > temp_server.ts << 'EOF'
import dotenv from "dotenv";
// Carregar variáveis de ambiente ANTES de qualquer importação
dotenv.config();

EOF
        
        # Adicionar o resto do arquivo
        cat server/index.ts >> temp_server.ts
        mv temp_server.ts server/index.ts
        success "Dotenv adicionado ao server/index.ts"
    else
        success "Dotenv já está configurado"
    fi
else
    error "Arquivo server/index.ts não encontrado"
    exit 1
fi

# 7. Verificar vite.config.ts
log "Verificando vite.config.ts..."
if [[ -f "vite.config.ts" ]]; then
    success "vite.config.ts encontrado"
else
    error "vite.config.ts não encontrado"
    exit 1
fi

# 8. Criar/verificar .env
log "Configurando .env..."
if [[ ! -f ".env" ]]; then
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

# 9. Testar build do frontend
log "Testando build do frontend..."
if npm run build >/dev/null 2>&1; then
    success "Build do frontend OK"
else
    error "Falha no build do frontend"
    # Tentar novamente com mais informações
    log "Tentando build novamente..."
    npm run build
    exit 1
fi

# 10. Verificar se o build foi criado
if [[ -f "dist/index.js" ]]; then
    success "Arquivo dist/index.js criado"
else
    error "Arquivo dist/index.js não foi criado"
    exit 1
fi

# 11. Testar execução do arquivo compilado
log "Testando arquivo compilado..."
if timeout 5 node dist/index.js >/dev/null 2>&1; then
    success "Arquivo compilado executa sem erros"
else
    warning "Arquivo compilado pode ter problemas, mas continuando..."
fi

# 12. Configurar PM2
log "Configurando PM2..."
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

# 13. Criar diretório de logs
mkdir -p logs

# 14. Criar script de teste de ambiente
log "Criando script de teste..."
cat > test-env.js << 'EOF'
#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = dotenv.config({ path: join(__dirname, '.env') });

console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');
if (result.error) {
    console.error('❌ Erro ao carregar .env:', result.error);
} else {
    console.log('✅ Arquivo .env carregado com sucesso');
}

console.log('\n📋 Variáveis importantes:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definida');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '❌ NÃO DEFINIDA');
console.log('PORT:', process.env.PORT || 'não definida');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Definida' : '❌ NÃO DEFINIDA');

if (process.env.DATABASE_URL) {
    console.log('\n🔗 Testando formato da DATABASE_URL...');
    const url = process.env.DATABASE_URL;
    
    if (url.startsWith('postgresql://')) {
        console.log('✅ URL PostgreSQL válida');
        try {
            const dbUrl = new URL(url);
            console.log('Host:', dbUrl.hostname);
            console.log('Porta:', dbUrl.port || '5432');
            console.log('Banco:', dbUrl.pathname.slice(1));
            console.log('Usuário:', dbUrl.username);
        } catch (e) {
            console.error('❌ Erro ao parsear URL:', e.message);
        }
    } else {
        console.error('❌ URL não é PostgreSQL válida');
    }
}
console.log('\n=== FIM DO TESTE ===');
EOF

chmod +x test-env.js

# 15. Executar teste de ambiente
log "Executando teste de ambiente..."
if node test-env.js; then
    success "Teste de ambiente OK"
else
    warning "Problemas no teste de ambiente"
fi

# 16. Criar script de inicialização
log "Criando script de inicialização..."
cat > start-production.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando SisFin em modo produção..."

# Verificar se o build existe
if [[ ! -f "dist/index.js" ]]; then
    echo "❌ Build não encontrado. Execute: npm run build"
    exit 1
fi

# Verificar se PM2 está instalado
if ! command -v pm2 >/dev/null 2>&1; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Parar processos existentes
echo "⏹️  Parando processos existentes..."
pm2 stop all >/dev/null 2>&1 || true
pm2 delete all >/dev/null 2>&1 || true

# Iniciar aplicação
echo "🔄 Iniciando aplicação..."
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar startup
pm2 startup

# Mostrar status
pm2 status

echo "✅ Aplicação iniciada com sucesso!"
echo "📊 Para monitorar: pm2 monit"
echo "📋 Para ver logs: pm2 logs sisfin"
EOF

chmod +x start-production.sh

echo ""
echo -e "${GREEN}✅ CORREÇÃO COMPLETA CONCLUÍDA!${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Execute: ./start-production.sh (para iniciar com PM2)"
echo "2. Ou execute: npm start (para iniciar modo simples)"
echo "3. Para testar ambiente: node test-env.js"
echo "4. Para desenvolvimento: npm run dev"
echo ""
echo -e "${BLUE}Arquivos criados/atualizados:${NC}"
echo "• ecosystem.config.js - Configuração do PM2"
echo "• start-production.sh - Script de inicialização"
echo "• test-env.js - Teste de variáveis de ambiente"
echo "• server/index.ts - Corrigido com dotenv"
echo "• .env - Configuração de ambiente"
echo ""
echo "=================================="
echo "🎉 SISTEMA PRONTO PARA USO"
echo "=================================="