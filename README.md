# SisFin - Sistema de Gestão Financeira

Sistema completo de gestão financeira para pequenas e médias empresas com integração WhatsApp, controle de clientes, contas a receber/pagar, vendas parceladas e muito mais.

## 📋 Índice

- [Recursos Principais](#-recursos-principais)
- [Tecnologias](#️-tecnologias)
- [Instalação](#-instalação)
- [Instalação em VPS](#️-instalação-em-vps)
- [Solução de Problemas](#-solução-urgente-vps---database_url)
- [Uso](#-uso)
- [API](#-api)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🚀 Recursos Principais

### 💰 Gestão Financeira
- **Contas a Receber**: Controle completo de recebíveis com vencimentos
- **Contas a Pagar**: Gestão de pagamentos e obrigações
- **Dashboard**: Visão geral da situação financeira
- **Relatórios**: Análises detalhadas e métricas

### 👥 Gestão de Clientes
- **Cadastro Completo**: Nome, WhatsApp, CPF/CNPJ, endereço
- **Histórico**: Acompanhe todas as transações por cliente
- **Comunicação**: Integração direta com WhatsApp

### 📱 Integração WhatsApp
- **Lembretes Automáticos**: Notificações de vencimento
- **Confirmações**: Links de confirmação via WhatsApp
- **Templates**: Mensagens personalizáveis
- **Multi-instância**: Cada usuário pode ter sua própria instância

### 🛒 Vendas Parceladas
- **Confirmação Digital**: Clientes confirmam com assinatura digital
- **Aprovação Admin**: Processo de aprovação com comentários
- **Geração Automática**: Criação automática de recebíveis
- **Notificações**: Comunicação automática via WhatsApp

### 🔧 Administração
- **Gestão de Planos**: Diferentes níveis de acesso
- **Configurações**: Personalização completa do sistema
- **Usuários**: Controle de acesso e permissões
- **Relatórios**: Métricas de uso e performance

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** com **Neon Serverless**
- **Drizzle ORM** para modelagem de dados
- **TypeScript** para tipagem estática
- **Evolution API** para integração WhatsApp

### Frontend
- **React 18** com **TypeScript**
- **Vite** para build e desenvolvimento
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** para gerenciamento de estado
- **Wouter** para roteamento

### Segurança
- **Autenticação** com sessões seguras
- **Autorização** baseada em roles
- **Validação** com Zod em frontend e backend
- **Sanitização** de dados

## 📦 Instalação

### Requisitos
- Node.js 20+
- PostgreSQL 15+
- Git

### Instalação Rápida

1. **Clone o repositório**
```bash
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure automaticamente**
```bash
./setup-auto.sh
```

4. **Inicie o sistema**
```bash
npm run dev
```

### 🔧 Comandos Úteis

- **Configurar sistema**: `./setup-auto.sh`
- **Desenvolvimento**: `npm run dev`
- **Build**: `npm run build`
- **Produção**: `./start-simple.sh`
- **Testar configuração**: `node test-config.js`
- **Status do sistema**: `./status.sh`

### 📋 Configuração Automática

O script `setup-auto.sh` realiza automaticamente:
- Geração de chave de sessão segura
- Criação do arquivo .env com configurações padrão
- Configuração do dotenv no servidor
- Configuração do PM2 para produção
- Teste completo da configuração

### 🔍 Verificação do Sistema

Para verificar se tudo está funcionando:

```bash
./status.sh
```

Este comando mostra:
- Status do servidor
- Dependências instaladas
- Configurações do banco de dados
- Logs do sistema
- Teste de configuração

## 🚨 SOLUÇÃO URGENTE VPS - DATABASE_URL

Se você está recebendo o erro "DATABASE_URL must be set" no VPS:

```bash
# Solução rápida
./vps-database-fix.sh

# Ou baixar e executar
wget -O vps-database-fix.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-database-fix.sh
chmod +x vps-database-fix.sh
./vps-database-fix.sh
```

**Depois do fix:**
```bash
npm run build
./start-vps.sh
```

📋 **Documentação completa:** [VPS_FIX_URGENTE.md](VPS_FIX_URGENTE.md)

## 🖥️ Instalação em VPS

### Requisitos do Sistema
- **Sistema**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**: Versão 20+
- **PostgreSQL**: Versão 15+
- **RAM**: Mínimo 1GB
- **Espaço**: 2GB livres

### Instalação Automática (Recomendada)

```bash
# Baixar script de instalação
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/install-vps.sh
chmod +x install-vps.sh

# Executar instalação completa
./install-vps.sh
```

**O script instalará automaticamente:**
- Node.js 20
- PostgreSQL 15
- SisFin e dependências
- PM2 para gerenciamento
- Configuração do firewall
- Configuração do banco de dados

### Instalação Manual

#### 1. Preparar o Sistema
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget git gcc gcc-c++ make
```

#### 2. Instalar Node.js 20
```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versão
node --version
npm --version
```

#### 3. Instalar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar usuário
sudo -u postgres psql
CREATE USER sisfin WITH PASSWORD 'sua_senha_aqui';
CREATE DATABASE sisfin OWNER sisfin;
GRANT ALL PRIVILEGES ON DATABASE sisfin TO sisfin;
\q
```

#### 4. Baixar e Configurar SisFin
```bash
# Clonar repositório
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin

# Instalar dependências
npm install

# Configurar banco de dados
./vps-database-fix.sh
# Quando solicitado, insira: postgresql://sisfin:sua_senha_aqui@localhost:5432/sisfin

# Fazer build
npm run build

# Iniciar aplicação
./start-vps.sh
```

#### 5. Configurar Firewall
```bash
# Permitir porta da aplicação
sudo ufw allow 5000/tcp

# Ou para porta personalizada
sudo ufw allow 8080/tcp
```

#### 6. Configurar SSL (Opcional)
```bash
# Instalar Certbot
sudo apt install -y certbot

# Gerar certificado (substitua seu-dominio.com)
sudo certbot certonly --standalone -d seu-dominio.com

# Configurar HTTPS no sistema
./setup-ssl.sh
```

### Configuração com PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar inicialização automática
pm2 startup
pm2 save
```

### Configuração com Nginx (Proxy Reverso)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/sisfin

# Conteúdo da configuração:
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar configuração
sudo ln -s /etc/nginx/sites-available/sisfin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Comandos Úteis VPS

```bash
# Verificar status
./status.sh

# Testar configuração
node test-env.js

# Reiniciar aplicação
pm2 restart sisfin

# Ver logs
pm2 logs sisfin

# Atualizar sistema
git pull origin main
npm install
npm run build
pm2 restart sisfin
```

### Solução de Problemas VPS

1. **Erro DATABASE_URL**: `./vps-database-fix.sh`
2. **Porta ocupada**: Altere PORT no .env
3. **Permissões**: `sudo chown -R $USER:$USER /path/to/SisFin`
4. **Firewall**: `sudo ufw status` e configurar portas
5. **SSL**: Verificar certificados com `sudo certbot certificates`

### Monitoramento

```bash
# Status do sistema
htop

# Logs da aplicação
tail -f logs/app.log

# Status do PostgreSQL
sudo systemctl status postgresql

# Status do Nginx
sudo systemctl status nginx
```

### Backup e Manutenção

#### Backup Automático
```bash
# Criar script de backup
cat > backup-sisfin.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/sisfin"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
sudo -u postgres pg_dump sisfin > $BACKUP_DIR/database_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /home/user/SisFin --exclude=node_modules --exclude=dist

# Manter apenas 7 dias de backup
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup concluído: $DATE"
EOF

chmod +x backup-sisfin.sh

# Configurar cron para backup diário
echo "0 2 * * * /path/to/backup-sisfin.sh" | sudo crontab -
```

#### Atualização do Sistema
```bash
# Script de atualização
cat > update-sisfin.sh << 'EOF'
#!/bin/bash
cd /home/user/SisFin

# Backup antes da atualização
./backup-sisfin.sh

# Atualizar código
git pull origin main

# Instalar dependências
npm install

# Fazer build
npm run build

# Reiniciar aplicação
pm2 restart sisfin

echo "Sistema atualizado com sucesso!"
EOF

chmod +x update-sisfin.sh
```

#### Monitoramento com Scripts
```bash
# Script de monitoramento
cat > monitor-sisfin.sh << 'EOF'
#!/bin/bash
echo "=== Status do SisFin ==="
echo "Data: $(date)"
echo ""

# Status PM2
echo "Status PM2:"
pm2 status

# Status PostgreSQL
echo "Status PostgreSQL:"
sudo systemctl status postgresql --no-pager

# Status Nginx
echo "Status Nginx:"
sudo systemctl status nginx --no-pager

# Uso de recursos
echo "Uso de recursos:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "RAM: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "Disco: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')"

# Conexões do banco
echo "Conexões PostgreSQL:"
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

echo ""
echo "=== Logs Recentes ==="
pm2 logs sisfin --lines 10
EOF

chmod +x monitor-sisfin.sh
```

## 🔧 Configuração Avançada

### SSL com Let's Encrypt
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Configuração de Domínio
```bash
# Configurar DNS
# A Record: seu-dominio.com -> IP_DO_SERVIDOR
# CNAME: www.seu-dominio.com -> seu-dominio.com

# Atualizar configuração Nginx
sudo nano /etc/nginx/sites-available/sisfin

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Otimização de Performance
```bash
# Configurar limites do sistema
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Otimizar PostgreSQL
sudo nano /etc/postgresql/15/main/postgresql.conf
# Ajustar: shared_buffers, effective_cache_size, work_mem

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

```

3. **Configure o ambiente**
```bash
cp .env.example .env
# Configure suas variáveis de ambiente
```

4. **Configure o banco de dados**
```bash
# Crie um banco PostgreSQL
createdb sisfindb

# Configure a DATABASE_URL no .env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sisfindb"
```

5. **Inicialize o banco**
```bash
npm run db:push
```

6. **Inicie o servidor**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## 🚨 Soluções Rápidas

### 🔴 Erro DATABASE_URL
Se você está vendo este erro:
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

**Solução em 1 comando:**
```bash
wget -O fix-database-url-error.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/fix-database-url-error.sh
chmod +x fix-database-url-error.sh
./fix-database-url-error.sh
```

### 🚀 Instalação VPS (Automática)

Para deploy em servidor VPS com configuração completa:

```bash
# Download e execução do script completo
wget -O vps-complete-fix.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh
chmod +x vps-complete-fix.sh
./vps-complete-fix.sh
```

**Recursos do script automatizado:**
- ✅ Instalação completa de Node.js 20 e PostgreSQL
- ✅ Configuração interativa de porta
- ✅ **Configuração de domínio personalizado**
- ✅ **Certificado SSL Let's Encrypt automático**
- ✅ Configuração de PM2, Nginx e firewall
- ✅ Criação de usuário administrador

### 🔐 Configuração SSL

Para adicionar SSL a uma instalação existente:

```bash
# Script para configurar SSL
wget -O setup-ssl.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/setup-ssl.sh
chmod +x setup-ssl.sh
./setup-ssl.sh
```

### 🗑️ Desinstalação Completa

Para remover completamente o SisFin do sistema:

```bash
# Script de desinstalação completa
wget -O uninstall.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/uninstall.sh
chmod +x uninstall.sh
./uninstall.sh
```

**Opções de desinstalação:**
- 🔴 **Completa**: Remove tudo (aplicação, banco, configurações, SSL)
- 🟡 **Apenas aplicação**: Mantém PostgreSQL instalado
- 🟠 **Apenas banco**: Remove só o banco de dados
- 🔵 **Apenas configurações**: Remove Nginx, SSL, mantém app e banco

### 💾 Backup Completo

Antes de desinstalar ou para manutenção, faça backup completo:

```bash
# Script de backup completo
wget -O backup.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/backup.sh
chmod +x backup.sh
./backup.sh
```

**O backup inclui:**
- ✅ Código fonte da aplicação
- ✅ Banco de dados completo
- ✅ Configurações Nginx e SSL
- ✅ Certificados SSL
- ✅ Configurações PM2
- ✅ Script de restauração automática

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sisfindb"

# Sessão
SESSION_SECRET="sua-chave-secreta-aqui"

# Evolution API (WhatsApp)
EVOLUTION_API_URL="https://sua-api.com"
EVOLUTION_API_KEY="sua-chave-api"
EVOLUTION_INSTANCE_NAME="sua-instancia"

# Aplicação
NODE_ENV="development"
PORT=5000

# SSL (para resolução de problemas de certificado)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Configuração do WhatsApp

1. **Obtenha acesso à Evolution API**
   - Configure uma instância da Evolution API
   - Obtenha a URL e chave de API

2. **Configure no sistema**
   - Acesse a área administrativa
   - Configure as credenciais da Evolution API
   - Cada usuário pode criar suas próprias instâncias

## 🚀 Deploy

### Deploy Local
```bash
# Build da aplicação
npm run build

# Inicie em produção
npm start
```

### Deploy VPS/Docker
```bash
# Docker Compose
docker-compose up -d

# Ou use nosso script automatizado
./vps-complete-fix.sh
```

## 📱 Recursos Avançados

### PWA (Progressive Web App)
- **Instalação**: Pode ser instalado como app nativo
- **Offline**: Funciona sem conexão
- **Notificações**: Push notifications
- **Responsivo**: Otimizado para mobile

### Sistema de Planos
- **Plano Gratuito**: Recursos básicos
- **Planos Pagos**: Recursos avançados
- **Limitações**: Controle automático de limites
- **Upgrades**: Solicitação de mudança de plano

### Automação
- **Lembretes**: Envio automático de cobranças
- **Confirmações**: Links de confirmação automáticos
- **Relatórios**: Geração automática de relatórios
- **Backups**: Backup automático de dados

## 🔒 Segurança

### Autenticação
- **Senhas**: Hash bcrypt
- **Sessões**: Armazenamento seguro
- **Tokens**: Tokens únicos para confirmações
- **Expiração**: Sessões com expiração

### Dados
- **Validação**: Validação em todas as camadas
- **Sanitização**: Limpeza de dados de entrada
- **Encriptação**: Dados sensíveis encriptados
- **Backup**: Backup regular dos dados

## 🤝 Contribuição

### Como Contribuir
1. **Fork** o projeto
2. **Crie** uma branch (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

### Padrões de Código
- **TypeScript**: Tipagem estrita
- **ESLint**: Linting automático
- **Prettier**: Formatação consistente
- **Testes**: Testes unitários e integração

## 📞 Suporte

### Documentação
- **INSTALL.md**: Guia de instalação detalhado
- **DEPLOYMENT.md**: Guia de deploy
- **API.md**: Documentação da API

### Contato
- **Issues**: Reporte bugs no GitHub
- **Email**: suporte@sisfinapp.com
- **Discord**: [Link do Discord]

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎯 Roadmap

### Versão 2.0
- [ ] API REST pública
- [ ] Integração PIX
- [ ] Relatórios avançados
- [ ] Multi-empresa

### Versão 1.5
- [ ] Importação de dados
- [ ] Templates de email
- [ ] Integração contábil
- [ ] App mobile nativo

---

**Desenvolvido com ❤️ para pequenas e médias empresas**