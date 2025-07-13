# PostgreSQL - Guia de Configuração

## 🎯 Visão Geral

O SisFin usa PostgreSQL como banco de dados principal. Este guia fornece instruções completas para configurar PostgreSQL em diferentes ambientes.

## 🚀 Instalação Rápida

### Script Automatizado (Recomendado)
```bash
# Clonar repositório
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin

# Executar configuração automática
chmod +x setup-vps-db.sh
./setup-vps-db.sh

# Aplicar schema e iniciar
npm run db:push
npm run dev
```

### Instalação Manual

#### Ubuntu/Debian
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres createdb financedb
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
```

#### CentOS/RHEL
```bash
# Instalar PostgreSQL
sudo yum install postgresql-server postgresql-contrib

# Inicializar banco
sudo postgresql-setup initdb

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco e usuário
sudo -u postgres createdb financedb
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
```

#### macOS
```bash
# Com Homebrew
brew install postgresql
brew services start postgresql

# Criar banco e usuário
createdb financedb
psql financedb -c "CREATE USER financeuser WITH PASSWORD 'financepass';"
psql financedb -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"
```

## 🐳 Docker

### Docker Compose (Recomendado para produção)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=financedb
      - POSTGRES_USER=financeuser
      - POSTGRES_PASSWORD=financepass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Container único
```bash
# Executar PostgreSQL
docker run --name postgres-sisfin \
  -e POSTGRES_PASSWORD=financepass \
  -e POSTGRES_DB=financedb \
  -e POSTGRES_USER=financeuser \
  -p 5432:5432 \
  -d postgres:15

# Verificar status
docker ps
docker logs postgres-sisfin
```

## ⚙️ Configuração

### Arquivo .env
```env
# Configuração padrão
DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb

# Para Docker
DATABASE_URL=postgresql://financeuser:financepass@db:5432/financedb

# Para servidor remoto
DATABASE_URL=postgresql://financeuser:financepass@192.168.1.100:5432/financedb

# Outras configurações
SESSION_SECRET=sua-chave-secreta-super-segura-de-32-caracteres
NODE_ENV=development
```

### Configuração de Autenticação (pg_hba.conf)
```bash
# Localizar arquivo
sudo find /etc -name "pg_hba.conf"

# Editar configuração
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Adicionar linha para autenticação local
local   all             financeuser                                md5
host    financedb       financeuser     127.0.0.1/32            md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

## 🔧 Comandos Úteis

### Operações Básicas
```bash
# Conectar ao banco
psql -U financeuser -h localhost -d financedb

# Listar bancos
psql -U postgres -l

# Listar usuários
psql -U postgres -c "\du"

# Criar backup
pg_dump -U financeuser -h localhost financedb > backup.sql

# Restaurar backup
psql -U financeuser -h localhost -d financedb < backup.sql
```

### Verificação de Status
```bash
# Status do serviço
systemctl status postgresql

# Verificar conexões ativas
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Verificar tamanho do banco
psql -U financeuser -d financedb -c "SELECT pg_size_pretty(pg_database_size('financedb'));"
```

### Manutenção
```bash
# Vacuum e analyze
psql -U financeuser -d financedb -c "VACUUM ANALYZE;"

# Reindexar
psql -U financeuser -d financedb -c "REINDEX DATABASE financedb;"

# Verificar logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🚨 Troubleshooting

### Erro: "DATABASE_URL must be set"
```bash
# Verificar se variável está definida
echo $DATABASE_URL

# Definir temporariamente
export DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb

# Adicionar ao .env
echo "DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb" >> .env
```

### Erro: "Connection refused"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar se necessário
sudo systemctl start postgresql

# Verificar porta
netstat -tulpn | grep :5432
```

### Erro: "Password authentication failed"
```bash
# Resetar senha
sudo -u postgres psql -c "ALTER USER financeuser WITH PASSWORD 'nova_senha';"

# Verificar autenticação no pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Erro: "Database does not exist"
```bash
# Criar banco
sudo -u postgres createdb financedb

# Ou via SQL
sudo -u postgres psql -c "CREATE DATABASE financedb;"
```

## 📊 Monitoramento

### Verificar Performance
```sql
-- Consultas mais lentas
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Índices não utilizados
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;

-- Tamanho das tabelas
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Configurações de Performance
```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf

# Configurações recomendadas
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

## 🔒 Segurança

### Configurações de Segurança
```bash
# Alterar senha do usuário postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'senha_super_segura';"

# Configurar SSL (opcional)
sudo nano /etc/postgresql/*/main/postgresql.conf
# ssl = on

# Configurar firewall
sudo ufw allow 5432/tcp
```

### Backup Automatizado
```bash
# Criar script de backup
cat > backup_postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U financeuser -h localhost financedb > $BACKUP_DIR/financedb_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

# Dar permissão
chmod +x backup_postgres.sh

# Adicionar ao cron
crontab -e
# 0 2 * * * /path/to/backup_postgres.sh
```

## 📚 Recursos Adicionais

### Documentação Oficial
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM PostgreSQL](https://orm.drizzle.team/docs/overview)

### Ferramentas Úteis
- **pgAdmin**: Interface web para PostgreSQL
- **psql**: Cliente de linha de comando oficial
- **pg_top**: Monitor de atividade em tempo real

### Comandos de Desenvolvimento
```bash
# Aplicar schema
npm run db:push

# Gerar migrations
npm run db:generate

# Executar aplicação
npm run dev

# Verificar conexão
node -e "const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()', (err, res) => {console.log(err ? err : res.rows[0]); pool.end()});"
```

---

**PostgreSQL configurado com sucesso! A aplicação está pronta para uso.**