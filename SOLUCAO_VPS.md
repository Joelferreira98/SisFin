# 🚨 SOLUÇÃO DEFINITIVA - VPS

## ❌ Erros Atuais

### Erro 1: DATABASE_URL
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

### Erro 2: Vite Config
```
TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
```

## ✅ Solução Imediata

Na sua VPS, execute os comandos abaixo **exatamente como mostrado**:

### 1. Configurar PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres psql -c "CREATE DATABASE financedb;"
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
```

### 2. Configurar Autenticação
```bash
# Configurar autenticação para permitir conexões
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' /etc/postgresql/*/main/pg_hba.conf

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 3. Criar arquivo .env
```bash
# Criar arquivo .env no diretório do projeto
cat > .env << 'EOF'
DATABASE_URL=postgresql://financeuser:financepass123@localhost:5432/financedb
SESSION_SECRET=chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
EOF
```

### 4. Executar aplicação
```bash
# Exportar variável e executar
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
npm run dev
```

## 🔧 Solução Completa (Recomendada)

Execute o script completo:
```bash
# Baixar e executar script de configuração
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/setup-node-environment.sh
chmod +x setup-node-environment.sh
./setup-node-environment.sh

# Depois executar
./start-dev.sh
```

## 🔧 Comando Único (Manual)

Execute tudo de uma vez:
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib && sudo systemctl start postgresql && sudo systemctl enable postgresql && sudo -u postgres psql -c "CREATE DATABASE financedb;" && sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass123';" && sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;" && sudo sed -i 's/local   all             all                                     peer/local   all             all                                     trust/' /etc/postgresql/*/main/pg_hba.conf && sudo systemctl restart postgresql && cat > .env << 'EOF'
DATABASE_URL=postgresql://financeuser:financepass123@localhost:5432/financedb
SESSION_SECRET=chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api-aqui
EVOLUTION_INSTANCE_NAME=instancia-padrao-sistema
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
EOF
```

Depois execute:
```bash
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
npm run dev
```

## 🎯 Resultado Esperado

Você deve ver:
```
3:55:23 AM [express] serving on port 5000
🔔 Serviço de lembretes iniciado
💳 Serviço de cobrança de planos iniciado
```

## 📞 Se não funcionar

1. **Verificar PostgreSQL**:
   ```bash
   sudo systemctl status postgresql
   ```

2. **Testar conexão**:
   ```bash
   psql -U financeuser -h localhost -d financedb -c "SELECT 1;"
   ```

3. **Verificar variável**:
   ```bash
   echo $DATABASE_URL
   ```

4. **Logs do PostgreSQL**:
   ```bash
   sudo journalctl -u postgresql -f
   ```

## 🌐 Acesso

- **URL**: http://SEU_IP_VPS:5000
- **Usuário**: Joel
- **Senha**: 123456

---

**Esta solução deve resolver definitivamente o erro DATABASE_URL.**