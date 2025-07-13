#!/bin/bash

# Script de instalação completa do SisFin em VPS
# Suporte: Ubuntu 20.04+, Debian 10+, CentOS 7+

echo "🚀 Instalação do SisFin em VPS"
echo "=============================="

# Verificar se está executando como root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Este script não deve ser executado como root"
   echo "💡 Execute como usuário normal: ./install-vps.sh"
   exit 1
fi

# Detectar sistema operacional
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo "❌ Sistema operacional não suportado"
    exit 1
fi

echo "🔍 Sistema detectado: $OS $VER"

# Função para instalar dependências
install_dependencies() {
    echo "📦 Instalando dependências do sistema..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update
        sudo apt install -y curl wget git build-essential software-properties-common
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo yum update -y
        sudo yum install -y curl wget git gcc gcc-c++ make epel-release
    else
        echo "❌ Sistema não suportado: $OS"
        exit 1
    fi
    
    echo "✅ Dependências instaladas"
}

# Função para instalar Node.js
install_nodejs() {
    echo "📦 Instalando Node.js 20..."
    
    # Verificar se Node.js já está instalado
    if command -v node &> /dev/null; then
        NODE_VER=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VER -ge 20 ]]; then
            echo "✅ Node.js já instalado: $(node --version)"
            return
        else
            echo "⚠️ Node.js versão $NODE_VER encontrada, atualizando..."
        fi
    fi
    
    # Instalar Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verificar instalação
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        echo "✅ Node.js instalado: $(node --version)"
        echo "✅ NPM instalado: $(npm --version)"
    else
        echo "❌ Erro na instalação do Node.js"
        exit 1
    fi
}

# Função para instalar PostgreSQL
install_postgresql() {
    echo "📦 Instalando PostgreSQL..."
    
    # Verificar se PostgreSQL já está instalado
    if command -v psql &> /dev/null; then
        echo "✅ PostgreSQL já instalado"
        return
    fi
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt install -y postgresql postgresql-contrib
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo yum install -y postgresql-server postgresql-contrib
        sudo postgresql-setup initdb
    fi
    
    # Iniciar e habilitar PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    echo "✅ PostgreSQL instalado e iniciado"
}

# Função para configurar banco de dados
configure_database() {
    echo "🔧 Configurando banco de dados..."
    
    # Solicitar dados do banco
    read -p "Nome do banco de dados [sisfin]: " DB_NAME
    DB_NAME=${DB_NAME:-sisfin}
    
    read -p "Nome do usuário [sisfin]: " DB_USER
    DB_USER=${DB_USER:-sisfin}
    
    read -s -p "Senha do usuário: " DB_PASS
    echo ""
    
    if [[ -z "$DB_PASS" ]]; then
        echo "❌ Senha não pode estar vazia"
        exit 1
    fi
    
    # Configurar banco de dados
    sudo -u postgres psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Banco de dados configurado"
        DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
    else
        echo "❌ Erro ao configurar banco de dados"
        exit 1
    fi
}

# Função para baixar e configurar SisFin
install_sisfin() {
    echo "📥 Baixando SisFin..."
    
    # Verificar se já existe
    if [[ -d "SisFin" ]]; then
        echo "⚠️ Diretório SisFin já existe"
        read -p "Deseja sobrescrever? (s/N): " OVERWRITE
        if [[ $OVERWRITE =~ ^[Ss]$ ]]; then
            rm -rf SisFin
        else
            echo "❌ Instalação cancelada"
            exit 1
        fi
    fi
    
    # Clonar repositório
    git clone https://github.com/Joelferreira98/SisFin.git
    cd SisFin
    
    # Instalar dependências
    echo "📦 Instalando dependências do projeto..."
    npm install
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Dependências instaladas"
    else
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
}

# Função para configurar aplicação
configure_application() {
    echo "🔧 Configurando aplicação..."
    
    # Criar arquivo .env
    cat > .env << EOF
# ==============================================
# CONFIGURAÇÃO VPS DO SISFIN
# Gerado automaticamente em: $(date)
# ==============================================

# ==============================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ==============================================

DATABASE_URL=$DATABASE_URL

# ==============================================
# CONFIGURAÇÕES DE SESSÃO
# ==============================================

SESSION_SECRET=$(openssl rand -hex 32)

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
    
    # Fazer build
    echo "🔨 Fazendo build da aplicação..."
    npm run build
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Build concluído"
    else
        echo "❌ Erro no build"
        exit 1
    fi
}

# Função para instalar PM2
install_pm2() {
    echo "📦 Instalando PM2..."
    
    # Verificar se PM2 já está instalado
    if command -v pm2 &> /dev/null; then
        echo "✅ PM2 já instalado"
        return
    fi
    
    sudo npm install -g pm2
    
    if [[ $? -eq 0 ]]; then
        echo "✅ PM2 instalado"
    else
        echo "❌ Erro ao instalar PM2"
        exit 1
    fi
}

# Função para configurar firewall
configure_firewall() {
    echo "🛡️ Configurando firewall..."
    
    # Verificar se UFW está instalado
    if ! command -v ufw &> /dev/null; then
        echo "⚠️ UFW não instalado, instalando..."
        sudo apt install -y ufw
    fi
    
    # Configurar UFW
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 5000/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    echo "✅ Firewall configurado"
}

# Função para testar instalação
test_installation() {
    echo "🧪 Testando instalação..."
    
    # Testar configuração
    if node test-env.js; then
        echo "✅ Configuração OK"
    else
        echo "❌ Problema na configuração"
        exit 1
    fi
    
    # Iniciar aplicação
    echo "🚀 Iniciando aplicação..."
    pm2 start ecosystem.config.js
    
    # Configurar inicialização automática
    pm2 startup
    pm2 save
    
    echo "✅ Aplicação iniciada"
}

# Função principal
main() {
    echo "🎯 Iniciando instalação completa..."
    
    install_dependencies
    install_nodejs
    install_postgresql
    configure_database
    install_sisfin
    configure_application
    install_pm2
    configure_firewall
    test_installation
    
    echo ""
    echo "🎉 Instalação concluída com sucesso!"
    echo ""
    echo "📋 Informações importantes:"
    echo "• Aplicação rodando na porta 5000"
    echo "• Banco de dados: $DB_NAME"
    echo "• Usuário admin padrão: Joel / 123456"
    echo "• Logs: pm2 logs sisfin"
    echo "• Status: pm2 status"
    echo "• Reiniciar: pm2 restart sisfin"
    echo ""
    echo "🔧 Próximos passos:"
    echo "1. Configure Evolution API no .env"
    echo "2. Acesse http://seu-servidor:5000"
    echo "3. Faça login com usuário admin"
    echo "4. Configure SSL se necessário"
    echo ""
    echo "📖 Documentação: README.md"
    echo "🆘 Suporte: VPS_FIX_URGENTE.md"
}

# Executar instalação
main "$@"