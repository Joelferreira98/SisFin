# Instalação via GitHub - SisFin

Guia completo para instalar e configurar o SisFin diretamente do repositório GitHub.

## 🚀 Instalação Rápida

### 1. Clonar o Repositório

```bash
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

**Configurações obrigatórias no .env:**
```env
# Banco de dados
DATABASE_URL=mysql://financeuser:senha@localhost:3306/financedb

# Chave de sessão (gerar chave aleatória)
SESSION_SECRET=sua-chave-secreta-de-32-caracteres

# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-api
EVOLUTION_INSTANCE_NAME=instancia-padrao
```

### 4. Configurar Banco de Dados

**Opção A: MySQL Local**
```bash
# Instalar MySQL
sudo apt install mysql-server

# Conectar ao MySQL
sudo mysql -u root -p

# Criar banco e usuário
CREATE DATABASE financedb;
CREATE USER 'financeuser'@'localhost' IDENTIFIED BY 'sua-senha';
GRANT ALL PRIVILEGES ON financedb.* TO 'financeuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Opção B: Docker MySQL**
```bash
# Executar MySQL em container
docker run --name mysql-sisfin \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=financedb \
  -e MYSQL_USER=financeuser \
  -e MYSQL_PASSWORD=sua-senha \
  -p 3306:3306 \
  -d mysql:8.0
```

### 5. Aplicar Schema do Banco

```bash
npm run db:push
```

### 6. Executar Aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run start
```

**Acesso:** http://localhost:5000

## 🔧 Configuração Detalhada

### Evolution API WhatsApp

1. **Obter uma instância Evolution API**
   - Acesse seu provedor de Evolution API
   - Crie uma nova instância
   - Obtenha a URL e chave da API

2. **Configurar no .env**
   ```env
   EVOLUTION_API_URL=https://evolution-api.exemplo.com
   EVOLUTION_API_KEY=sua-chave-obtida
   EVOLUTION_INSTANCE_NAME=minha-instancia
   ```

3. **Testar conexão**
   ```bash
   curl -H "apikey: SUA_CHAVE" \
        "https://evolution-api.exemplo.com/instance/connect/minha-instancia"
   ```

### Configuração de Sessão

```bash
# Gerar chave segura
openssl rand -base64 32

# Adicionar ao .env
SESSION_SECRET=chave-gerada-acima
```

### Estrutura de Pastas

```
SisFin/
├── client/                 # Frontend React
├── server/                 # Backend Express
├── shared/                 # Tipos compartilhados
├── .env.example           # Exemplo de configuração
├── docker-compose.yml     # Docker para produção
├── package.json          # Dependências
└── README.md             # Documentação
```

## 🐳 Deployment em VPS

### Pré-requisitos

- VPS com Ubuntu 20.04+
- Docker e Docker Compose
- Domínio (opcional)

### Passo a Passo

1. **Preparar VPS**
   ```bash
   # Conectar ao VPS
   ssh root@seu-ip-vps
   
   # Instalar Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Instalar Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clonar e Configurar**
   ```bash
   # Clonar projeto
   git clone https://github.com/Joelferreira98/SisFin.git
   cd SisFin
   
   # Configurar ambiente
   cp .env.example .env
   nano .env
   ```

3. **Configurar .env para Produção**
   ```env
   # Banco Docker
   DATABASE_URL=mysql://financeuser:senha-segura@db:3306/financedb
   
   # Chave de produção
   SESSION_SECRET=chave-producao-diferente-desenvolvimento
   
   # Environment
   NODE_ENV=production
   
   # Evolution API
   EVOLUTION_API_URL=https://sua-evolution-api.com
   EVOLUTION_API_KEY=sua-chave-api
   EVOLUTION_INSTANCE_NAME=instancia-producao
   ```

4. **Executar Deployment**
   ```bash
   # Dar permissão ao script
   chmod +x deploy.sh
   
   # Executar deployment
   ./deploy.sh
   
   # Iniciar serviços
   docker-compose up -d
   ```

5. **Verificar Instalação**
   ```bash
   # Status dos containers
   docker-compose ps
   
   # Logs da aplicação
   docker-compose logs -f app
   
   # Acessar aplicação
   curl http://localhost:3000
   ```

## 🔐 Configuração SSL (Opcional)

### Nginx + Let's Encrypt

1. **Instalar Nginx**
   ```bash
   sudo apt install nginx
   ```

2. **Configurar Site**
   ```bash
   # Criar configuração
   sudo nano /etc/nginx/sites-available/sisfin
   ```

   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Ativar Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/sisfin /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Configurar SSL**
   ```bash
   # Instalar Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Obter certificado
   sudo certbot --nginx -d seu-dominio.com
   ```

## 🔍 Troubleshooting

### Problemas Comuns

**1. Erro: "Cannot find module"**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

**2. Erro de conexão MySQL**
```bash
# Verificar se MySQL está rodando
systemctl status mysql

# Ou se usando Docker
docker ps | grep mysql
```

**3. Erro: "Port 5000 already in use"**
```bash
# Verificar processo usando a porta
lsof -i :5000

# Parar processo
kill -9 PID_DO_PROCESSO
```

**4. Erro de permissão**
```bash
# Dar permissões aos scripts
chmod +x deploy.sh
chmod +x package-for-deployment.sh
```

**5. Erro Evolution API**
```bash
# Testar conexão
curl -H "apikey: SUA_CHAVE" https://sua-evolution-api.com/instance/fetchInstances

# Verificar logs
docker-compose logs app | grep -i evolution
```

## 🚀 Desenvolvimento

### Estrutura de Desenvolvimento

```bash
# Terminal 1: Frontend (desenvolvimento)
cd client
npm run dev

# Terminal 2: Backend (desenvolvimento)
cd server
npm run dev

# Terminal 3: Banco de dados
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=financedb -p 3306:3306 -d mysql:8.0
```

### Scripts Úteis

```bash
# Verificar tipos TypeScript
npm run check

# Aplicar schema no banco
npm run db:push

# Build para produção
npm run build

# Iniciar produção
npm run start
```

## 📦 Atualizações

### Atualizar do GitHub

```bash
# Fazer backup
cp .env .env.backup

# Atualizar código
git pull origin main

# Reinstalar dependências
npm install

# Aplicar novas migrações
npm run db:push

# Reiniciar aplicação
npm run dev
```

### Atualizar em VPS

```bash
# Parar serviços
docker-compose stop

# Atualizar código
git pull origin main

# Reconstruir containers
docker-compose up -d --build

# Verificar logs
docker-compose logs -f app
```

## 🆘 Suporte

### Logs Úteis

```bash
# Logs da aplicação
tail -f logs/app.log

# Logs do sistema
journalctl -u nginx -f

# Logs Docker
docker-compose logs -f
```

### Contato

- **GitHub**: https://github.com/Joelferreira98/SisFin
- **Issues**: Para reportar problemas
- **Discussões**: Para dúvidas gerais

---

**Instalação via GitHub concluída com sucesso!**