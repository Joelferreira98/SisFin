# Guia de Deploy - SisFin

Este guia explica como fazer deploy do SisFin em diferentes ambientes.

## 📋 Pré-requisitos

- Servidor VPS ou Cloud
- Ubuntu 20.04+
- Node.js 20+
- PostgreSQL 15+
- Nginx (recomendado)

## 🚀 Deploy VPS Rápido

### Script Automatizado
```bash
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh
chmod +x vps-complete-fix.sh
./vps-complete-fix.sh
```

### Deploy Manual

#### 1. Preparação do Servidor
```bash
# Atualização do sistema
sudo apt update && sudo apt upgrade -y

# Instalação de dependências
sudo apt install -y curl wget git nginx postgresql postgresql-contrib

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Configuração do PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres createdb sisfindb
sudo -u postgres psql
CREATE USER sisfinuser WITH PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE sisfindb TO sisfinuser;
\q
```

#### 3. Deploy da Aplicação
```bash
# Clone o repositório
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env
nano .env
```

**Configuração .env para Produção:**
```env
NODE_ENV=production
DATABASE_URL="postgresql://sisfinuser:senha_segura@localhost:5432/sisfindb"
SESSION_SECRET="chave_super_secreta_production"
PORT=5000

# Evolution API (opcional)
EVOLUTION_API_URL="https://sua-evolution-api.com"
EVOLUTION_API_KEY="sua-chave-api"
EVOLUTION_INSTANCE_NAME="sua-instancia"

# SSL (se necessário)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

#### 4. Build e Inicialização
```bash
# Build da aplicação
npm run build

# Inicialize o banco
npm run db:push

# Instale PM2
npm install -g pm2

# Inicie a aplicação
pm2 start npm --name "sisfin" -- start

# Configure auto-start
pm2 startup
pm2 save
```

#### 5. Configuração do Nginx
```bash
sudo nano /etc/nginx/sites-available/sisfin
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ative o site
sudo ln -s /etc/nginx/sites-available/sisfin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Configuração SSL
```bash
# Instale Certbot
sudo apt install certbot python3-certbot-nginx

# Configure SSL
sudo certbot --nginx -d seu-dominio.com

# Teste renovação automática
sudo certbot renew --dry-run
```

#### 7. Configuração do Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🐳 Deploy com Docker

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://sisfinuser:senha_segura@db:5432/sisfindb
      - SESSION_SECRET=chave_super_secreta
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sisfindb
      - POSTGRES_USER=sisfinuser
      - POSTGRES_PASSWORD=senha_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Deploy
docker-compose up -d

# Aplicar schema
docker-compose exec app npm run db:push
```

## ☁️ Deploy em Cloud

### AWS EC2
```bash
# Conecte via SSH
ssh -i your-key.pem ubuntu@your-instance-ip

# Execute o script automatizado
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh
chmod +x vps-complete-fix.sh
./vps-complete-fix.sh
```

### Google Cloud Platform
```bash
# Conecte via SSH
gcloud compute ssh your-instance-name

# Execute o script automatizado
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh
chmod +x vps-complete-fix.sh
./vps-complete-fix.sh
```

## 🔄 Atualizações

### Deploy de Atualizações
```bash
# Baixe as atualizações
git pull origin main

# Instale novas dependências
npm install

# Build da aplicação
npm run build

# Aplique mudanças do banco
npm run db:push

# Reinicie a aplicação
pm2 restart sisfin
```

## 📊 Monitoramento

### Logs
```bash
# PM2
pm2 logs sisfin

# Docker
docker-compose logs -f app

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Métricas
```bash
# PM2 Monitor
pm2 monit

# Docker Stats
docker stats

# Sistema
htop
df -h
free -h
```

## 💾 Backup

### Backup Automático
```bash
# Crie script de backup
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="sisfindb"
DB_USER="sisfinuser"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco
pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /caminho/para/SisFin

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Torne executável
chmod +x backup.sh

# Configure cron
crontab -e
# Adicione: 0 2 * * * /caminho/para/backup.sh
```

## 🛠️ Solução de Problemas

### Problemas Comuns

**1. Aplicação não inicia**
```bash
# Verifique logs
pm2 logs sisfin

# Verifique variáveis de ambiente
cat .env

# Teste conexão com banco
psql -h localhost -U sisfinuser -d sisfindb
```

**2. Erro 502 Bad Gateway**
```bash
# Verifique se a aplicação está rodando
pm2 status

# Verifique configuração Nginx
sudo nginx -t

# Reinicie serviços
pm2 restart sisfin
sudo systemctl restart nginx
```

**3. Erro SSL**
```bash
# Verifique certificados
sudo certbot certificates

# Renove certificados
sudo certbot renew
```

## 📞 Suporte

- **GitHub Issues**: [Reporte problemas](https://github.com/Joelferreira98/SisFin/issues)
- **Documentação**: Ver README.md para mais detalhes

---

**Deploy realizado com sucesso!** 🚀