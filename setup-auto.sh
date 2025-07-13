#!/bin/bash

# Script de configuração automática do SisFin
# Configura valores padrão e gera chave automaticamente

echo "🚀 Configuração automática do SisFin..."

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Função para gerar chave aleatória
generate_key() {
    local length=${1:-32}
    openssl rand -hex $length 2>/dev/null || head -c $length /dev/urandom | xxd -p -c $length
}

# Gerar chave de sessão
echo "🔐 Gerando chave de sessão..."
SESSION_SECRET=$(generate_key 32)

# Backup do .env existente
if [[ -f ".env" ]]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "📋 Backup do .env anterior criado"
fi

# Criar arquivo .env
echo "📝 Criando arquivo .env..."
cat > .env << EOF
# ==============================================
# CONFIGURAÇÃO AUTOMÁTICA DO SISFIN
# Gerado automaticamente em: $(date)
# ==============================================

# ==============================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ==============================================

# Replit Database será carregada automaticamente
# DATABASE_URL será definida automaticamente pelo Replit

# ==============================================
# CONFIGURAÇÕES DE SESSÃO
# ==============================================

SESSION_SECRET=$SESSION_SECRET

# ==============================================
# CONFIGURAÇÕES DA EVOLUTION API (WHATSAPP)
# ==============================================

EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-evolution-api
EVOLUTION_INSTANCE_NAME=instancia-sistema

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

# ==============================================
# CONFIGURAÇÕES ADICIONAIS
# ==============================================

DEBUG=false
TZ=America/Sao_Paulo
EOF

echo "✅ Arquivo .env criado"

# Configurar dotenv no servidor
echo "🔧 Configurando servidor..."
if [[ -f "server/index.ts" ]]; then
    if ! grep -q "import dotenv from \"dotenv\"" server/index.ts; then
        cp server/index.ts server/index.ts.backup
        
        # Criar arquivo temporário com dotenv no início
        cat > temp_index.ts << 'EOF'
import dotenv from "dotenv";
// Carregar variáveis de ambiente ANTES de qualquer importação
dotenv.config();

EOF
        
        # Adicionar o resto do arquivo
        cat server/index.ts >> temp_index.ts
        mv temp_index.ts server/index.ts
        
        echo "✅ Dotenv configurado no servidor"
    else
        echo "✅ Dotenv já configurado"
    fi
fi

# Configurar PM2
echo "⚙️ Configurando PM2..."
cat > ecosystem.config.js << 'EOF'
// Configuração do PM2 para SisFin
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
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    autorestart: true,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    watch: false,
    source_map_support: true,
    merge_logs: true,
    kill_timeout: 5000
  }]
};
EOF

# Criar diretório de logs
mkdir -p logs

echo "✅ PM2 configurado"

# Criar script de teste
cat > test-config.js << 'EOF'
#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testando configuração...');

const result = dotenv.config({ path: join(__dirname, '.env') });

if (result.error) {
    console.error('❌ Erro ao carregar .env:', result.error);
    process.exit(1);
} else {
    console.log('✅ .env carregado');
}

console.log('📋 Variáveis:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Gerada' : '❌ Ausente');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '🔄 Replit Database');

console.log('✅ Configuração OK!');
EOF

chmod +x test-config.js

echo "🧪 Testando configuração..."
node test-config.js

echo ""
echo "🎉 Configuração automática concluída!"
echo ""
echo "Próximos passos:"
echo "1. Para desenvolvimento: npm run dev"
echo "2. Para produção: npm run build && ./start-simple.sh"
echo "3. Para testar: node test-config.js"
echo ""
echo "Chave de sessão gerada: ${SESSION_SECRET:0:16}..."
echo "Arquivo .env criado com configurações padrão"
echo "Sistema pronto para uso!"