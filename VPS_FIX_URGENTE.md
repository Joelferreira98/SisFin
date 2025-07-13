# 🚨 ERRO VPS: DATABASE_URL must be set

## 🎯 Solução Imediata

Se você está vendo o erro `DATABASE_URL must be set` na sua VPS, execute:

```bash
# 1. Baixar script de correção
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-database-fix.sh

# 2. Dar permissão
chmod +x vps-database-fix.sh

# 3. Executar correção
./vps-database-fix.sh

# 4. Iniciar aplicação
./start-vps.sh
```

## 📋 Ou execute passo a passo:

### 1. Instalar PostgreSQL
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Criar banco e usuário
```bash
sudo -u postgres createdb financedb
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
```

### 3. Configurar autenticação
```bash
# Localizar arquivo de configuração
sudo find /etc -name "pg_hba.conf"

# Editar (substitua XX pela versão encontrada)
sudo nano /etc/postgresql/XX/main/pg_hba.conf

# Alterar linha:
# DE: local   all             all                                     peer
# PARA: local   all             all                                     md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 4. Criar arquivo .env
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb
SESSION_SECRET=sua-chave-secreta-super-segura-de-32-caracteres-para-producao
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
EOF
```

### 5. Testar conexão
```bash
PGPASSWORD=financepass psql -U financeuser -h localhost -d financedb -c "SELECT 1;"
```

### 6. Instalar dependências e aplicar schema
```bash
npm install
npm run db:push
```

### 7. Iniciar aplicação
```bash
npm run dev
```

## 🔧 Verificações

### Verificar se PostgreSQL está rodando:
```bash
sudo systemctl status postgresql
```

### Verificar conexão:
```bash
PGPASSWORD=financepass psql -U financeuser -h localhost -d financedb -c "SELECT version();"
```

### Verificar logs:
```bash
sudo journalctl -u postgresql -f
```

### Verificar portas:
```bash
netstat -tuln | grep :5432
netstat -tuln | grep :5000
```

## 🚨 Problemas Comuns

### Erro: "password authentication failed"
```bash
sudo -u postgres psql -c "ALTER USER financeuser WITH PASSWORD 'financepass';"
```

### Erro: "connection refused"
```bash
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### Erro: "database does not exist"
```bash
sudo -u postgres createdb financedb
```

### Erro: "permission denied"
```bash
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
```

## 🎯 Acesso Final

- **URL**: http://seu-vps-ip:5000
- **Usuário**: Joel
- **Senha**: 123456

## 📞 Suporte

Se ainda tiver problemas:
1. Execute: `./vps-database-fix.sh`
2. Verifique logs: `sudo journalctl -u postgresql -f`
3. Consulte: `TROUBLESHOOTING.md`

---

**⚡ Tempo estimado: 5 minutos**