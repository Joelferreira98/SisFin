# Configuração do Banco PostgreSQL na VPS

## 🎯 Problema Resolvido
Erro: `DATABASE_URL must be set. Did you forget to provision a database?`

## 📋 Configuração Rápida

### 1. Instalar PostgreSQL na VPS
```bash
# Atualizar sistema
sudo apt update

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar e habilitar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Criar banco e usuário
```bash
# Entrar como usuário postgres
sudo -u postgres psql

# Criar banco
CREATE DATABASE financedb;

# Criar usuário
CREATE USER financeuser WITH PASSWORD 'financepass';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;

# Sair
\q
```

### 3. Configurar arquivo .env
```bash
# Editar .env no diretório do projeto
nano .env

# Configurar DATABASE_URL
DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb
SESSION_SECRET=sua-chave-secreta-super-segura-de-32-caracteres
NODE_ENV=production
```

### 4. Aplicar schema
```bash
# No diretório do projeto
npm run db:push
```

### 5. Testar aplicação
```bash
# Iniciar aplicação
npm run dev
```

## 🔧 Configuração Avançada

### Para usar senha personalizada:
```bash
# Alterar senha do usuário
sudo -u postgres psql
ALTER USER financeuser WITH PASSWORD 'sua_senha_segura';
\q

# Atualizar .env
DATABASE_URL=postgresql://financeuser:sua_senha_segura@localhost:5432/financedb
```

### Para usar banco remoto:
```bash
# Formato para banco remoto
DATABASE_URL=postgresql://usuario:senha@host:porta/banco

# Exemplo com IP específico
DATABASE_URL=postgresql://financeuser:senha@192.168.1.100:5432/financedb
```

### Para usar com Docker:
```bash
# Se usando Docker Compose
DATABASE_URL=postgresql://financeuser:senha@db:5432/financedb
```

## 🚀 Script de Instalação Automática

```bash
#!/bin/bash
# Salve como setup-db.sh e execute: chmod +x setup-db.sh && ./setup-db.sh

echo "🔧 Configurando PostgreSQL..."

# Instalar PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres createdb financedb
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"

echo "✅ PostgreSQL configurado com sucesso!"
echo "📋 Configuração:"
echo "   DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb"
```

## 🔍 Verificação

### Testar conexão:
```bash
# Testar conexão diretamente
psql -U financeuser -h localhost -d financedb

# Testar com aplicação
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://financeuser:financepass@localhost:5432/financedb'
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Erro:', err);
  else console.log('Sucesso:', res.rows[0]);
  pool.end();
});
"
```

## 🆘 Troubleshooting

### Erro de permissão:
```bash
# Verificar status do PostgreSQL
sudo systemctl status postgresql

# Verificar se banco existe
sudo -u postgres psql -l | grep financedb

# Verificar usuário
sudo -u postgres psql -c "\du"
```

### Erro de conexão:
```bash
# Verificar configuração do PostgreSQL
sudo nano /etc/postgresql/*/main/postgresql.conf

# Verificar autenticação
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Reiniciar serviço
sudo systemctl restart postgresql
```

### Erro de firewall:
```bash
# Abrir porta 5432 se necessário
sudo ufw allow 5432/tcp
```

---

**Configuração concluída! A aplicação deve funcionar corretamente com PostgreSQL.**