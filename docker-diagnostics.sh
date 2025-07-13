#!/bin/bash

# Script de diagnóstico Docker para SisFin
# Verifica e corrige problemas comuns do Docker

echo "🔍 Diagnóstico Docker - SisFin"
echo "================================"

# Verificar se Docker está instalado
echo "1. Verificando instalação do Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker está instalado"
    docker --version
else
    echo "❌ Docker não está instalado"
    echo "💡 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Verificar se Docker está rodando
echo -e "\n2. Verificando se Docker está rodando..."
if systemctl is-active --quiet docker; then
    echo "✅ Docker está rodando"
else
    echo "❌ Docker não está rodando"
    echo "💡 Iniciando Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Verificar permissões do usuário
echo -e "\n3. Verificando permissões..."
if groups $USER | grep -q docker; then
    echo "✅ Usuário tem permissões Docker"
else
    echo "❌ Usuário não tem permissões Docker"
    echo "💡 Adicionando usuário ao grupo docker..."
    sudo usermod -aG docker $USER
    echo "⚠️  Você precisa fazer logout e login novamente para aplicar as permissões"
fi

# Verificar Docker Compose
echo -e "\n4. Verificando Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose está instalado"
    docker-compose --version
else
    echo "❌ Docker Compose não está instalado"
    echo "💡 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Testar Docker
echo -e "\n5. Testando Docker..."
if docker run --rm hello-world &> /dev/null; then
    echo "✅ Docker está funcionando corretamente"
else
    echo "❌ Docker apresenta problemas"
    echo "💡 Tentando corrigir..."
    
    # Limpar containers e imagens problemáticas
    docker system prune -af --volumes
    
    # Reiniciar serviço
    sudo systemctl restart docker
    
    # Testar novamente
    if docker run --rm hello-world &> /dev/null; then
        echo "✅ Docker corrigido com sucesso"
    else
        echo "❌ Problemas persistem - usar instalação local"
    fi
fi

# Verificar espaço em disco
echo -e "\n6. Verificando espaço em disco..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "✅ Espaço em disco suficiente ($DISK_USAGE% usado)"
else
    echo "⚠️  Espaço em disco baixo ($DISK_USAGE% usado)"
    echo "💡 Liberando espaço..."
    docker system prune -af --volumes
fi

# Verificar portas
echo -e "\n7. Verificando portas..."
if lsof -i :3306 &> /dev/null; then
    echo "⚠️  Porta 3306 (MySQL) está em uso"
    echo "💡 Processo usando a porta:"
    lsof -i :3306
else
    echo "✅ Porta 3306 está livre"
fi

if lsof -i :5000 &> /dev/null; then
    echo "⚠️  Porta 5000 (App) está em uso"
    echo "💡 Processo usando a porta:"
    lsof -i :5000
else
    echo "✅ Porta 5000 está livre"
fi

echo -e "\n================================"
echo "🏁 Diagnóstico concluído!"
echo "================================"

# Sugestões finais
echo -e "\n💡 Próximos passos:"
echo "1. Se Docker está funcionando: execute 'docker-compose up -d'"
echo "2. Se Docker tem problemas: use 'npm run dev' (instalação local)"
echo "3. Para instalação local: siga o guia em INSTALL_GITHUB.md"
echo "4. Para suporte: https://github.com/Joelferreira98/SisFin/issues"