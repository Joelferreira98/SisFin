# Solução para Erro DATABASE_URL

Se você está vendo este erro:
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

## Solução Rápida (1 comando)

### Para correção completa do sistema:
```bash
wget -O fix-build-system.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/fix-build-system.sh
chmod +x fix-build-system.sh
./fix-build-system.sh
```

### Para correção específica do PM2:
```bash
wget -O fix-pm2-config.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/fix-pm2-config.sh
chmod +x fix-pm2-config.sh
./fix-pm2-config.sh
```

### Para correção do DATABASE_URL:
```bash
wget -O fix-database-url-error.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/fix-database-url-error.sh
chmod +x fix-database-url-error.sh
./fix-database-url-error.sh
```

## Teste das Variáveis de Ambiente

Para verificar se o dotenv está funcionando:

```bash
wget -O test-env.js https://raw.githubusercontent.com/Joelferreira98/SisFin/main/test-env.js
node test-env.js
```

## Solução Manual

### 1. Configurar PostgreSQL

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres psql -c "CREATE DATABASE sisfindb;"
sudo -u postgres psql -c "CREATE USER sisfinuser WITH PASSWORD 'sisfinpass123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sisfindb TO sisfinuser;"
sudo -u postgres psql -c "ALTER USER sisfinuser CREATEDB;"
```

### 2. Verificar se dotenv está instalado

```bash
npm install dotenv
```

### 3. Verificar se dotenv está importado no código

Certifique-se de que o arquivo `server/index.ts` contém no início:

```javascript
import dotenv from "dotenv";
dotenv.config();
```

### 4. Criar arquivo .env

```bash
cat > .env << 'EOF'
DATABASE_URL="postgresql://sisfinuser:sisfinpass123@localhost:5432/sisfindb"
NODE_ENV="production"
PORT=5000
SESSION_SECRET="sua-chave-secreta-super-segura"
EVOLUTION_API_URL="https://evolution-api.com"
EVOLUTION_API_KEY="sua-chave-api"
EVOLUTION_INSTANCE_NAME="sisfin"
NODE_TLS_REJECT_UNAUTHORIZED=0
EOF
```

### 5. Executar Migrations

```bash
npm run db:push
```

### 6. Compilar e Iniciar

```bash
npm run build
pm2 start dist/index.js --name sisfin
pm2 save
```

## Verificar Solução

```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar logs
pm2 logs sisfin

# Testar aplicação
curl http://localhost:5000
```

## Comandos Úteis

- **Ver logs**: `pm2 logs sisfin`
- **Reiniciar**: `pm2 restart sisfin`
- **Parar**: `pm2 stop sisfin`
- **Status**: `pm2 status`

## Problemas Comuns

### PostgreSQL não está instalado
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### Erro de permissão
```bash
sudo -u postgres psql -c "ALTER USER sisfinuser CREATEDB;"
```

### Porta ocupada
```bash
# Verificar porta
sudo netstat -tlnp | grep :5000

# Matar processo
sudo kill -9 PID
```

### PM2 não encontrado
```bash
sudo npm install -g pm2
```

## Suporte

Se o problema persistir:
1. Execute: `pm2 logs sisfin`
2. Verifique o arquivo `.env`
3. Teste conexão: `psql -h localhost -U sisfinuser -d sisfindb`
4. Consulte a documentação completa no README.md