# Troubleshooting - SisFin

Guia de solução de problemas comuns do SisFin.

## 🐳 Problemas com Docker

### Erro: "Not supported URL scheme http+docker"

**Sintomas:**
```
urllib3.exceptions.URLSchemeUnknown: Not supported URL scheme http+docker
docker.errors.DockerException: Error while fetching server API version
```

**Causas possíveis:**
1. Versão incompatível do Docker Compose
2. Problemas na configuração do Docker daemon
3. Permissões incorretas do usuário
4. Variáveis de ambiente incorretas

**Soluções:**

#### Solução 1: Reinstalar Docker Compose
```bash
# Remover versão antiga
sudo apt remove docker-compose

# Instalar versão mais recente
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker-compose --version
```

#### Solução 2: Corrigir permissões
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente
newgrp docker

# Testar permissões
docker run hello-world
```

#### Solução 3: Reiniciar Docker
```bash
# Parar Docker
sudo systemctl stop docker

# Limpar configurações problemáticas
sudo rm -rf /var/lib/docker/network/files/

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### Solução 4: Usar instalação local
```bash
# Execute o script de instalação local
chmod +x install-local.sh
./install-local.sh

# Iniciar aplicação sem Docker
npm run dev
```

### Erro: "Port already in use"

**Sintomas:**
```
Error: listen EADDRINUSE: address already in use :::3306
Error: listen EADDRINUSE: address already in use :::5000
```

**Soluções:**
```bash
# Verificar processos nas portas
lsof -i :3306
lsof -i :5000

# Parar processos
sudo kill -9 PID_DO_PROCESSO

# Ou usar portas diferentes no docker-compose.yml
```

## 🗄️ Problemas com MySQL

### Erro: "connect ETIMEDOUT"

**Sintomas:**
```
Error: connect ETIMEDOUT
at PromisePool.query
```

**Causas:**
1. MySQL não está rodando
2. Configuração incorreta da DATABASE_URL
3. Firewall bloqueando conexões
4. Problemas de rede

**Soluções:**

#### Solução 1: Verificar MySQL
```bash
# Verificar status
systemctl status mysql

# Iniciar se necessário
sudo systemctl start mysql
sudo systemctl enable mysql

# Testar conexão
mysql -u root -p -e "SELECT 1;"
```

#### Solução 2: Configurar DATABASE_URL
```bash
# Editar .env
nano .env

# Configurar corretamente
DATABASE_URL=mysql://usuario:senha@localhost:3306/financedb
```

#### Solução 3: Criar banco e usuário
```sql
-- Conectar ao MySQL
mysql -u root -p

-- Criar banco
CREATE DATABASE IF NOT EXISTS financedb;

-- Criar usuário
CREATE USER 'financeuser'@'localhost' IDENTIFIED BY 'senha123';
GRANT ALL PRIVILEGES ON financedb.* TO 'financeuser'@'localhost';
FLUSH PRIVILEGES;
```

#### Solução 4: Usar SQLite (temporário)
```bash
# Instalar SQLite
npm install better-sqlite3

# Configurar .env
DATABASE_URL=sqlite:./database.sqlite
```

### Erro: "Access denied"

**Sintomas:**
```
Error: Access denied for user 'root'@'localhost'
```

**Soluções:**
```bash
# Resetar senha do root
sudo mysql -u root -p

# Ou usar autenticação via socket
sudo mysql -u root

# Configurar senha
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'nova_senha';
FLUSH PRIVILEGES;
```

## 📡 Problemas com Evolution API

### Erro: "Evolution API connection failed"

**Sintomas:**
```
Error: Request failed with status code 401
WhatsApp instance not found
```

**Soluções:**

#### Solução 1: Verificar configuração
```bash
# Editar .env
nano .env

# Configurar corretamente
EVOLUTION_API_URL=https://sua-api.com
EVOLUTION_API_KEY=sua-chave-correta
EVOLUTION_INSTANCE_NAME=nome-da-instancia
```

#### Solução 2: Testar API
```bash
# Testar conectividade
curl -H "apikey: SUA_CHAVE" https://sua-api.com/instance/fetchInstances

# Verificar instância
curl -H "apikey: SUA_CHAVE" https://sua-api.com/instance/connect/SUA_INSTANCIA
```

#### Solução 3: Criar nova instância
```bash
# Via API
curl -X POST \
  -H "apikey: SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "nova-instancia"}' \
  https://sua-api.com/instance/create
```

## 🔐 Problemas de Autenticação

### Erro: "Session expired"

**Sintomas:**
```
Error: Session expired or invalid
Unauthorized access
```

**Soluções:**

#### Solução 1: Verificar SESSION_SECRET
```bash
# Gerar nova chave
openssl rand -base64 32

# Configurar no .env
SESSION_SECRET=chave-gerada-acima
```

#### Solução 2: Limpar sessões
```bash
# Conectar ao MySQL
mysql -u root -p financedb

# Limpar tabela de sessões
DELETE FROM sessions;
```

### Erro: "User not found"

**Sintomas:**
```
Error: User with id X not found
Login failed
```

**Soluções:**
```bash
# Verificar usuários no banco
mysql -u root -p financedb -e "SELECT * FROM users;"

# Criar usuário admin se necessário
INSERT INTO users (id, username, email, password, role) 
VALUES (1, 'admin', 'admin@example.com', 'hashed_password', 'admin');
```

## 🚀 Problemas de Performance

### Aplicação lenta

**Sintomas:**
- Páginas demoram para carregar
- Consultas lentas no banco
- Alto uso de CPU/memória

**Soluções:**

#### Solução 1: Otimizar banco
```sql
-- Adicionar índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);
CREATE INDEX idx_payables_due_date ON payables(due_date);

-- Analisar consultas lentas
SHOW PROCESSLIST;
```

#### Solução 2: Limpar dados antigos
```sql
-- Limpar logs antigos
DELETE FROM whatsapp_messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
DELETE FROM reminder_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);
```

#### Solução 3: Configurar cache
```bash
# Instalar Redis (opcional)
sudo apt install redis-server

# Configurar cache no .env
REDIS_URL=redis://localhost:6379
```

## 📱 Problemas PWA

### PWA não instala

**Sintomas:**
- Botão "Adicionar à tela inicial" não aparece
- Manifest.json não carrega
- Service Worker falha

**Soluções:**

#### Solução 1: Verificar HTTPS
```bash
# PWA requer HTTPS em produção
# Configurar SSL com Let's Encrypt
sudo certbot --nginx -d seu-dominio.com
```

#### Solução 2: Verificar manifest
```bash
# Testar manifest
curl https://seu-dominio.com/manifest.json

# Verificar service worker
curl https://seu-dominio.com/sw.js
```

## 🔧 Comandos Úteis

### Diagnóstico completo
```bash
# Executar diagnóstico
chmod +x docker-diagnostics.sh
./docker-diagnostics.sh
```

### Logs importantes
```bash
# Logs da aplicação
tail -f logs/app.log

# Logs do sistema
journalctl -u mysql -f
journalctl -u nginx -f

# Logs Docker
docker-compose logs -f
```

### Backup e restauração
```bash
# Backup completo
mysqldump -u root -p financedb > backup.sql

# Restaurar backup
mysql -u root -p financedb < backup.sql

# Backup arquivos
tar -czf backup.tar.gz /caminho/para/SisFin
```

### Monitoramento
```bash
# Uso de recursos
htop
df -h
free -h

# Conexões de rede
netstat -tulpn | grep :3306
netstat -tulpn | grep :5000
```

## 🆘 Obtendo Ajuda

### Logs detalhados
```bash
# Ativar debug
export DEBUG=*
npm run dev

# Logs do banco
mysql -u root -p -e "SET GLOBAL general_log = 'ON';"
```

### Informações do sistema
```bash
# Informações gerais
uname -a
cat /etc/os-release
node --version
npm --version
mysql --version
docker --version
```

### Contato
- **GitHub Issues**: https://github.com/Joelferreira98/SisFin/issues
- **Documentação**: README.md
- **Instalação**: INSTALL_GITHUB.md

## 📋 Checklist de Diagnóstico

Antes de reportar um problema, verifique:

- [ ] Node.js e npm instalados e atualizados
- [ ] MySQL rodando e acessível
- [ ] Arquivo .env configurado corretamente
- [ ] Portas 3306 e 5000 livres
- [ ] Permissões corretas nos arquivos
- [ ] Dependências instaladas (`npm install`)
- [ ] Schema aplicado (`npm run db:push`)
- [ ] Firewall não bloqueando conexões
- [ ] Espaço em disco suficiente
- [ ] Logs verificados para erros específicos

---

**Para problemas não cobertos aqui, abra uma issue no GitHub com logs detalhados e informações do sistema.**