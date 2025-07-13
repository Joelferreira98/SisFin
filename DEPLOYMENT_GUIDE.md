# Guia de Implantação - Finance Manager

## Requisitos do Sistema

- VPS com Ubuntu 20.04 ou superior
- Docker e Docker Compose
- Pelo menos 2GB de RAM
- 20GB de espaço em disco
- Acesso SSH root ou sudo

## Passo 1: Preparação do Servidor

### 1.1 Conectar ao VPS via SSH
```bash
ssh root@seu-ip-do-servidor
```

### 1.2 Atualizar o sistema
```bash
apt update && apt upgrade -y
```

### 1.3 Instalar Docker e Docker Compose
```bash
# Instalar Docker
apt install -y docker.io docker-compose

# Iniciar e habilitar Docker
systemctl start docker
systemctl enable docker

# Verificar instalação
docker --version
docker-compose --version
```

## Passo 2: Configuração da Aplicação

### 2.1 Criar diretório da aplicação
```bash
mkdir -p /opt/finance-manager
cd /opt/finance-manager
```

### 2.2 Fazer upload dos arquivos
Faça upload de todos os arquivos do projeto para `/opt/finance-manager/`

### 2.3 Configurar variáveis de ambiente
```bash
# Criar arquivo .env
nano .env
```

**Conteúdo do arquivo .env:**
```
# Database Configuration
DATABASE_URL=mysql://financeuser:financepass@db:3306/financedb
SESSION_SECRET=sua-chave-secreta-super-segura-aqui

# Evolution API Configuration
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api
EVOLUTION_INSTANCE_NAME=sua-instancia-padrao

# Environment
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Altere os valores acima:
- `sua-chave-secreta-super-segura-aqui`: Use uma chave aleatória de pelo menos 32 caracteres
- `sua-evolution-api-url.com`: URL da sua instância Evolution API
- `sua-chave-da-evolution-api`: Sua chave da Evolution API
- `sua-instancia-padrao`: Nome da instância padrão

## Passo 3: Configuração do Banco de Dados

### 3.1 Configurar senha do MySQL
Edite o arquivo `docker-compose.yml` e altere as senhas:

```yaml
environment:
  - MYSQL_DATABASE=financedb
  - MYSQL_USER=financeuser
  - MYSQL_PASSWORD=SUA_SENHA_AQUI
  - MYSQL_ROOT_PASSWORD=SUA_SENHA_ROOT_AQUI
```

### 3.2 Atualizar DATABASE_URL no .env
```
DATABASE_URL=mysql://financeuser:SUA_SENHA_AQUI@db:3306/financedb
```

## Passo 4: Configuração de Domínio (Opcional)

### 4.1 Configurar Nginx como proxy reverso
```bash
apt install -y nginx

# Criar configuração do site
nano /etc/nginx/sites-available/finance-manager
```

**Conteúdo do arquivo:**
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

```bash
# Habilitar site
ln -s /etc/nginx/sites-available/finance-manager /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4.2 Configurar SSL (Opcional)
```bash
# Instalar certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d seu-dominio.com
```

## Passo 5: Executar a Aplicação

### 5.1 Construir e iniciar containers
```bash
cd /opt/finance-manager

# Construir e iniciar
docker-compose up -d

# Verificar status
docker-compose ps
```

### 5.2 Verificar logs
```bash
# Ver logs da aplicação
docker-compose logs app

# Ver logs do banco de dados
docker-compose logs db
```

## Passo 6: Configuração Inicial

### 6.1 Acessar aplicação
- Via IP: `http://seu-ip-do-servidor:3000`
- Via domínio: `http://seu-dominio.com`

### 6.2 Criar primeiro usuário administrador
1. Acesse a aplicação
2. Clique em "Registrar"
3. Preencha os dados do primeiro usuário
4. O primeiro usuário registrado será automaticamente admin

## Comandos Úteis

### Gerenciamento de Containers
```bash
# Parar aplicação
docker-compose stop

# Iniciar aplicação
docker-compose start

# Reiniciar aplicação
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f app

# Remover containers (cuidado com dados!)
docker-compose down
```

### Backup do Banco de Dados
```bash
# Fazer backup
docker-compose exec db mysqldump -u root -p financedb > backup.sql

# Restaurar backup
docker-compose exec -i db mysql -u root -p financedb < backup.sql
```

### Atualização da Aplicação
```bash
cd /opt/finance-manager

# Parar aplicação
docker-compose stop

# Fazer upload dos novos arquivos
# (substitua os arquivos existentes)

# Reconstruir e iniciar
docker-compose up -d --build
```

## Solução de Problemas

### 1. Erro de conexão com banco de dados
```bash
# Verificar se o MySQL está rodando
docker-compose ps

# Verificar logs do banco
docker-compose logs db

# Reiniciar banco
docker-compose restart db
```

### 2. Aplicação não inicia
```bash
# Verificar logs
docker-compose logs app

# Verificar variáveis de ambiente
docker-compose exec app env
```

### 3. Erro 502 Bad Gateway (Nginx)
```bash
# Verificar se aplicação está rodando
docker-compose ps

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log
```

### 4. Problemas de espaço em disco
```bash
# Limpar containers não utilizados
docker system prune -a

# Verificar espaço em disco
df -h
```

## Segurança

### 1. Firewall
```bash
# Instalar UFW
apt install -y ufw

# Configurar regras básicas
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000  # Apenas se não usar Nginx

# Ativar firewall
ufw enable
```

### 2. Atualizações automáticas
```bash
# Instalar unattended-upgrades
apt install -y unattended-upgrades

# Configurar atualizações automáticas
dpkg-reconfigure -plow unattended-upgrades
```

### 3. Backup automático
Crie um script de backup automático:

```bash
# Criar script de backup
nano /opt/backup-finance.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
cd /opt/finance-manager
docker-compose exec -T db mysqldump -u root -pROOT_PASSWORD financedb > $BACKUP_DIR/database_$DATE.sql

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/finance-manager

# Manter apenas backups dos últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Tornar executável
chmod +x /opt/backup-finance.sh

# Adicionar ao cron para executar diariamente
crontab -e
# Adicionar: 0 2 * * * /opt/backup-finance.sh
```

## Monitoramento

### 1. Verificar status dos serviços
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Logs em tempo real
docker-compose logs -f --tail=50 app
```

### 2. Monitoramento de disco
```bash
# Verificar espaço
df -h

# Verificar uso por diretório
du -sh /opt/finance-manager/*
```

## Suporte

Para problemas técnicos:
1. Verifique os logs: `docker-compose logs app`
2. Verifique a conexão com banco: `docker-compose exec db mysql -u root -p`
3. Verifique variáveis de ambiente: `docker-compose exec app env`

Para mais informações, consulte a documentação do projeto.