#!/bin/bash

# Script de configuração interativa do SisFin
# Versão: 1.0
# Data: 13/07/2025

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para gerar chave aleatória
generate_key() {
    local length=${1:-32}
    openssl rand -hex $length 2>/dev/null || head -c $length /dev/urandom | xxd -p -c $length
}

# Função para validar URL
validate_url() {
    local url=$1
    if [[ $url =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Função para validar porta
validate_port() {
    local port=$1
    if [[ $port =~ ^[0-9]+$ ]] && [ $port -ge 1 ] && [ $port -le 65535 ]; then
        return 0
    else
        return 1
    fi
}

clear
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}🚀 CONFIGURAÇÃO INTERATIVA DO SISTEMA SISFIN${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${YELLOW}Este script vai configurar automaticamente todas as variáveis${NC}"
echo -e "${YELLOW}de ambiente necessárias para o funcionamento do sistema.${NC}"
echo ""
echo -e "${GREEN}Pressione ENTER para continuar ou Ctrl+C para cancelar...${NC}"
read -p ""

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

echo -e "${BLUE}=== CONFIGURAÇÃO DO BANCO DE DADOS ===${NC}"
echo ""
echo -e "${YELLOW}Opções de banco de dados:${NC}"
echo "1. Usar Replit Database (automático)"
echo "2. Configurar PostgreSQL personalizado"
echo ""
while true; do
    read -p "Escolha uma opção (1 ou 2): " db_choice
    case $db_choice in
        1)
            echo -e "${GREEN}✅ Configuração automática do Replit Database${NC}"
            DATABASE_URL="# Replit Database será carregada automaticamente"
            break
            ;;
        2)
            echo ""
            echo -e "${YELLOW}Digite as informações do PostgreSQL:${NC}"
            read -p "Host do banco (ex: localhost): " db_host
            read -p "Porta do banco (ex: 5432): " db_port
            read -p "Nome do banco (ex: sisfindb): " db_name
            read -p "Usuário do banco (ex: sisfinuser): " db_user
            read -s -p "Senha do banco: " db_pass
            echo ""
            
            if [ -z "$db_host" ] || [ -z "$db_port" ] || [ -z "$db_name" ] || [ -z "$db_user" ] || [ -z "$db_pass" ]; then
                echo -e "${RED}❌ Todas as informações são obrigatórias${NC}"
                continue
            fi
            
            if ! validate_port "$db_port"; then
                echo -e "${RED}❌ Porta inválida${NC}"
                continue
            fi
            
            DATABASE_URL="postgresql://$db_user:$db_pass@$db_host:$db_port/$db_name"
            echo -e "${GREEN}✅ Configuração do PostgreSQL personalizado${NC}"
            break
            ;;
        *)
            echo -e "${RED}❌ Opção inválida${NC}"
            ;;
    esac
done

echo ""
echo -e "${BLUE}=== CONFIGURAÇÃO DO SERVIDOR ===${NC}"
echo ""
while true; do
    read -p "Porta do servidor (padrão: 5000): " server_port
    server_port=${server_port:-5000}
    
    if validate_port "$server_port"; then
        echo -e "${GREEN}✅ Porta configurada: $server_port${NC}"
        break
    else
        echo -e "${RED}❌ Porta inválida${NC}"
    fi
done

echo ""
echo -e "${BLUE}=== CONFIGURAÇÃO DO WHATSAPP (EVOLUTION API) ===${NC}"
echo ""
echo -e "${YELLOW}Esta configuração é opcional. Você pode pular e configurar depois.${NC}"
echo ""
while true; do
    read -p "Deseja configurar o WhatsApp agora? (s/n): " setup_whatsapp
    case $setup_whatsapp in
        [Ss]* )
            echo ""
            while true; do
                read -p "URL da Evolution API (ex: https://api.exemplo.com): " evolution_url
                if [ -z "$evolution_url" ]; then
                    echo -e "${RED}❌ URL é obrigatória${NC}"
                    continue
                fi
                
                if validate_url "$evolution_url"; then
                    echo -e "${GREEN}✅ URL válida${NC}"
                    break
                else
                    echo -e "${RED}❌ URL inválida (deve começar com http:// ou https://)${NC}"
                fi
            done
            
            read -p "Chave da Evolution API: " evolution_key
            if [ -z "$evolution_key" ]; then
                echo -e "${YELLOW}⚠️ Chave não fornecida, usando placeholder${NC}"
                evolution_key="sua-chave-evolution-api"
            fi
            
            read -p "Nome da instância padrão (ex: instancia-sistema): " evolution_instance
            evolution_instance=${evolution_instance:-instancia-sistema}
            
            echo -e "${GREEN}✅ WhatsApp configurado${NC}"
            break
            ;;
        [Nn]* )
            echo -e "${YELLOW}⚠️ WhatsApp não configurado (pode ser feito depois)${NC}"
            evolution_url="https://sua-evolution-api-url.com"
            evolution_key="sua-chave-evolution-api"
            evolution_instance="instancia-sistema"
            break
            ;;
        * )
            echo -e "${RED}❌ Responda com 's' para sim ou 'n' para não${NC}"
            ;;
    esac
done

echo ""
echo -e "${BLUE}=== GERANDO CHAVES DE SEGURANÇA ===${NC}"
echo ""
echo -e "${YELLOW}Gerando chave de sessão segura...${NC}"
session_secret=$(generate_key 32)
echo -e "${GREEN}✅ Chave de sessão gerada: ${session_secret:0:16}...${NC}"

echo ""
echo -e "${BLUE}=== CONFIGURAÇÃO DO AMBIENTE ===${NC}"
echo ""
echo -e "${YELLOW}Ambiente de execução:${NC}"
echo "1. Desenvolvimento"
echo "2. Produção"
echo ""
while true; do
    read -p "Escolha o ambiente (1 ou 2): " env_choice
    case $env_choice in
        1)
            NODE_ENV="development"
            echo -e "${GREEN}✅ Ambiente de desenvolvimento${NC}"
            break
            ;;
        2)
            NODE_ENV="production"
            echo -e "${GREEN}✅ Ambiente de produção${NC}"
            break
            ;;
        *)
            echo -e "${RED}❌ Opção inválida${NC}"
            ;;
    esac
done

echo ""
echo -e "${BLUE}=== CRIANDO ARQUIVO .env ===${NC}"
echo ""

# Backup do .env existente
if [[ -f ".env" ]]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${YELLOW}⚠️ Backup do .env anterior criado${NC}"
fi

# Criar novo arquivo .env
cat > .env << EOF
# ==============================================
# CONFIGURAÇÃO AUTOMÁTICA DO SISFIN
# Gerado em: $(date)
# ==============================================

# ==============================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ==============================================

$(if [ "$DATABASE_URL" = "# Replit Database será carregada automaticamente" ]; then
    echo "# Replit Database será carregada automaticamente"
    echo "# DATABASE_URL será definida automaticamente pelo Replit"
else
    echo "DATABASE_URL=$DATABASE_URL"
fi)

# ==============================================
# CONFIGURAÇÕES DE SESSÃO
# ==============================================

SESSION_SECRET=$session_secret

# ==============================================
# CONFIGURAÇÕES DA EVOLUTION API (WHATSAPP)
# ==============================================

EVOLUTION_API_URL=$evolution_url
EVOLUTION_API_KEY=$evolution_key
EVOLUTION_INSTANCE_NAME=$evolution_instance

# ==============================================
# CONFIGURAÇÕES DO AMBIENTE
# ==============================================

NODE_ENV=$NODE_ENV
PORT=$server_port
HOST=0.0.0.0

# ==============================================
# CONFIGURAÇÕES SSL
# ==============================================

NODE_TLS_REJECT_UNAUTHORIZED=0

# ==============================================
# CONFIGURAÇÕES ADICIONAIS
# ==============================================

# Para debugging em desenvolvimento
DEBUG=false

# Timezone
TZ=America/Sao_Paulo
EOF

echo -e "${GREEN}✅ Arquivo .env criado com sucesso${NC}"

echo ""
echo -e "${BLUE}=== CONFIGURANDO SERVIDOR ===${NC}"
echo ""

# Verificar se dotenv está configurado no server/index.ts
if [[ -f "server/index.ts" ]]; then
    if ! grep -q "import dotenv from \"dotenv\"" server/index.ts; then
        echo -e "${YELLOW}Configurando dotenv no servidor...${NC}"
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
        
        echo -e "${GREEN}✅ Dotenv configurado no servidor${NC}"
    else
        echo -e "${GREEN}✅ Dotenv já configurado no servidor${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo server/index.ts não encontrado${NC}"
fi

echo ""
echo -e "${BLUE}=== CONFIGURANDO PM2 ===${NC}"
echo ""

# Criar configuração do PM2
cat > ecosystem.config.js << EOF
// Configuração do PM2 para SisFin
// Gerado automaticamente em: $(date)
module.exports = {
  apps: [{
    name: 'sisfin',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '$NODE_ENV',
      PORT: $server_port
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: $server_port
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

echo -e "${GREEN}✅ Configuração do PM2 criada${NC}"

# Criar diretório de logs
mkdir -p logs
echo -e "${GREEN}✅ Diretório de logs criado${NC}"

echo ""
echo -e "${BLUE}=== TESTANDO CONFIGURAÇÃO ===${NC}"
echo ""

# Criar script de teste
cat > test-config.js << 'EOF'
#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testando configuração do sistema...\n');

const result = dotenv.config({ path: join(__dirname, '.env') });

if (result.error) {
    console.error('❌ Erro ao carregar .env:', result.error);
    process.exit(1);
} else {
    console.log('✅ Arquivo .env carregado com sucesso\n');
}

console.log('📋 Variáveis configuradas:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definida');
console.log('PORT:', process.env.PORT || 'não definida');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Configurada' : '❌ NÃO CONFIGURADA');

if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL: ✅ Configurada');
    
    if (process.env.DATABASE_URL.startsWith('postgresql://')) {
        console.log('Tipo: PostgreSQL');
        try {
            const dbUrl = new URL(process.env.DATABASE_URL);
            console.log('Host:', dbUrl.hostname);
            console.log('Porta:', dbUrl.port || '5432');
            console.log('Banco:', dbUrl.pathname.slice(1));
        } catch (e) {
            console.log('❌ Erro ao parsear URL:', e.message);
        }
    }
} else {
    console.log('DATABASE_URL: 🔄 Será carregada pelo Replit');
}

console.log('\n🔗 WhatsApp (Evolution API):');
console.log('URL:', process.env.EVOLUTION_API_URL || 'não definida');
console.log('Chave:', process.env.EVOLUTION_API_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA');
console.log('Instância:', process.env.EVOLUTION_INSTANCE_NAME || 'não definida');

console.log('\n✅ Teste de configuração concluído!');
EOF

chmod +x test-config.js

echo -e "${YELLOW}Executando teste de configuração...${NC}"
if node test-config.js; then
    echo -e "${GREEN}✅ Configuração testada com sucesso${NC}"
else
    echo -e "${RED}❌ Problemas na configuração${NC}"
fi

echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e "${GREEN}Arquivos criados/configurados:${NC}"
echo "• .env - Variáveis de ambiente"
echo "• ecosystem.config.js - Configuração do PM2"
echo "• test-config.js - Teste de configuração"
echo "• server/index.ts - Configurado com dotenv"
echo "• logs/ - Diretório de logs"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Para desenvolvimento: npm run dev"
echo "2. Para produção: npm run build && npm start"
echo "3. Para PM2: npm run build && pm2 start ecosystem.config.js"
echo "4. Para testar: node test-config.js"
echo ""
echo -e "${YELLOW}Informações importantes:${NC}"
echo "• Chave de sessão gerada automaticamente"
echo "• Backup do .env anterior criado (se existia)"
echo "• Configuração do servidor ajustada para porta $server_port"
echo "• Ambiente configurado para $NODE_ENV"
echo ""
echo -e "${GREEN}Sistema pronto para uso!${NC}"