# Guia de Instalação - SisFin

Este guia explica como instalar o SisFin diretamente do GitHub.

## 📋 Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- Git
- npm

## 🚀 Instalação Rápida

### 1. Clone o Repositório
```bash
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure o Banco de Dados

#### Ubuntu/Debian
```bash
# Instale PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crie banco e usuário
sudo -u postgres createdb sisfindb
sudo -u postgres psql
CREATE USER sisfinuser WITH PASSWORD 'suasenha';
GRANT ALL PRIVILEGES ON DATABASE sisfindb TO sisfinuser;
\q
```

#### Docker (alternativa)
```bash
docker run --name sisfindb -e POSTGRES_PASSWORD=suasenha -e POSTGRES_DB=sisfindb -p 5432:5432 -d postgres:15
```

### 4. Configure as Variáveis de Ambiente
```bash
cp .env.example .env
nano .env
```

**Configuração mínima:**
```env
DATABASE_URL="postgresql://sisfinuser:suasenha@localhost:5432/sisfindb"
SESSION_SECRET="sua-chave-secreta-aqui"
NODE_ENV="development"
PORT=5000
```

### 5. Inicialize o Banco
```bash
npm run db:push
```

### 6. Inicie a Aplicação
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## 🔧 Configuração Avançada

### Instalação Automática (VPS)
```bash
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh
chmod +x vps-complete-fix.sh
./vps-complete-fix.sh
```

**O script automatizado inclui:**
- Instalação completa de Node.js 20 e PostgreSQL
- Configuração interativa de porta (5000, 3000, 8080, 80, ou customizada)
- **Configuração de domínio personalizado (opcional)**
- **Certificado SSL Let's Encrypt automático (opcional)**
- Configuração de PM2, Nginx e firewall
- Criação de usuário administrador

### Opções de Configuração Durante Instalação

Durante a execução, você será questionado sobre:

1. **Porta do servidor**: Escolha a porta de sua preferência
2. **Configuração de domínio**:
   - Usar apenas IP: `http://SEU-IP:PORTA`
   - Domínio sem SSL: `http://seudominio.com`
   - Domínio com SSL: `https://seudominio.com` (certificado automático)

### Configuração SSL em Instalação Existente

Se você já tem o SisFin instalado e quer adicionar SSL:

```bash
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/setup-ssl.sh
chmod +x setup-ssl.sh
./setup-ssl.sh
```

**O script de SSL irá:**
- Configurar certificado Let's Encrypt
- Atualizar configuração do Nginx
- Configurar renovação automática
- Testar a configuração

### Configuração Manual SSL/HTTPS
```bash
# Instale Certbot
sudo apt install certbot nginx

# Configure SSL
sudo certbot certonly --standalone -d seu-dominio.com

# Configure Nginx
sudo nano /etc/nginx/sites-available/sisfin
```

**Configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name seu-dominio.com;
    
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
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
      - DATABASE_URL=postgresql://sisfinuser:suasenha@db:5432/sisfindb
      - SESSION_SECRET=sua-chave-secreta
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=sisfindb
      - POSTGRES_USER=sisfinuser
      - POSTGRES_PASSWORD=suasenha
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

## 🛠️ Solução de Problemas

### Problemas Comuns

**1. Erro de Conexão com Banco**
```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql

# Teste conexão
psql -h localhost -U sisfinuser -d sisfindb
```

**2. Erro de Porta em Uso**
```bash
# Verifique porta
sudo netstat -tlnp | grep :5000

# Mude porta no .env
PORT=3000
```

**3. Erro SSL WhatsApp**
```bash
# Adicione ao .env
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Logs e Debugging
```bash
# Logs da aplicação
npm run dev

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## 🚀 Deploy em Produção

### PM2 (Process Manager)
```bash
# Instale PM2
npm install -g pm2

# Build e start
npm run build
pm2 start npm --name "sisfin" -- start

# Auto-start
pm2 startup
pm2 save
```

### Backup
```bash
# Backup do banco
pg_dump -h localhost -U sisfinuser sisfindb > backup.sql

# Restaurar
psql -h localhost -U sisfinuser sisfindb < backup.sql
```

## 📞 Suporte

- **GitHub Issues**: [Reporte bugs](https://github.com/Joelferreira98/SisFin/issues)
- **Documentação**: Ver README.md para mais detalhes

---

**Instalação concluída!** 🎉