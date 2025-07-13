#!/bin/bash

# Script to create deployment package for VPS
echo "📦 Criando pacote de deployment..."

# Create deployment directory
mkdir -p deployment-package

# Copy essential files
cp -r client deployment-package/
cp -r server deployment-package/
cp -r shared deployment-package/

# Copy configuration files
cp package.json deployment-package/
cp package-lock.json deployment-package/
cp tsconfig.json deployment-package/
cp tailwind.config.ts deployment-package/
cp postcss.config.js deployment-package/
cp components.json deployment-package/
cp vite.config.ts deployment-package/

# Copy deployment specific files
cp docker-compose.yml deployment-package/
cp Dockerfile deployment-package/
cp init.sql deployment-package/
cp deploy.sh deployment-package/
cp DEPLOYMENT_GUIDE.md deployment-package/

# Create .env template
cat > deployment-package/.env.template << 'EOF'
# Database Configuration
DATABASE_URL=mysql://financeuser:CHANGE_THIS_PASSWORD@db:3306/financedb
SESSION_SECRET=CHANGE_THIS_TO_A_RANDOM_32_CHARACTER_STRING

# Evolution API Configuration
EVOLUTION_API_URL=https://your-evolution-api-url.com
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_INSTANCE_NAME=your-instance-name

# Environment
NODE_ENV=production
EOF

# Create README for deployment
cat > deployment-package/README-DEPLOYMENT.md << 'EOF'
# Finance Manager - Deployment Package

## Quick Start

1. Faça upload deste diretório para seu VPS em `/opt/finance-manager/`
2. Renomeie `.env.template` para `.env` e configure as variáveis
3. Execute: `chmod +x deploy.sh && ./deploy.sh`
4. Configure as variáveis no arquivo `.env`
5. Execute: `docker-compose up -d`

## Documentação Completa

Consulte `DEPLOYMENT_GUIDE.md` para instruções detalhadas.

## Estrutura do Projeto

- `client/` - Frontend React
- `server/` - Backend Express
- `shared/` - Esquemas compartilhados
- `docker-compose.yml` - Configuração Docker
- `Dockerfile` - Imagem da aplicação
- `deploy.sh` - Script de implantação
- `DEPLOYMENT_GUIDE.md` - Guia completo
EOF

echo "✅ Pacote de deployment criado em: deployment-package/"
echo "📋 Próximos passos:"
echo "1. Comprima o diretório: tar -czf finance-manager-deployment.tar.gz deployment-package/"
echo "2. Faça upload para seu VPS"
echo "3. Siga as instruções em DEPLOYMENT_GUIDE.md"