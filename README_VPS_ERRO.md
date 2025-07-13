# 🚨 SOLUÇÃO RÁPIDA - ERROS VPS

## ❌ Erros que você está vendo:

1. `DATABASE_URL must be set`
2. `TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string`

## ✅ SOLUÇÃO DEFINITIVA

Na sua VPS, execute **apenas um comando**:

```bash
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh && chmod +x vps-complete-fix.sh && ./vps-complete-fix.sh
```

Depois execute (com seleção de porta):
```bash
./start-app-vps.sh
```

Ou especifique a porta diretamente:
```bash
./start-app-vps.sh 8080
```

## 🎯 O que o script faz:

1. ✅ Atualiza Node.js para v20 (resolve erro do Vite)
2. ✅ Instala e configura PostgreSQL
3. ✅ Cria banco de dados e usuário
4. ✅ Configura arquivo .env com DATABASE_URL
5. ✅ Reinstala dependências
6. ✅ Aplica schema do banco
7. ✅ Testa a aplicação
8. ✅ Cria script de inicialização com seleção de porta
9. ✅ Corrige erros SSL do WhatsApp (Evolution API)

## 🎉 Resultado esperado:

```
🚀 Iniciando aplicação SisFin na VPS...
🔧 Escolha a porta para a aplicação:
1) 5000 (padrão)
2) 3000
3) 8080
4) 80 (requer sudo)
5) Personalizada

Escolha uma opção (1-5): 1

✅ Variáveis configuradas:
DATABASE_URL: postgresql://financeuser:financepass123@localhost:5432/financedb
NODE_ENV: development
PORT: 5000

🎯 Acesso: http://SEU-IP:5000
🔑 Usuário: Joel | Senha: 123456
💡 Para usar outra porta: ./start-app-vps.sh PORTA

> rest-express@1.0.0 dev
> NODE_ENV=development tsx server/index.ts
4:01:31 AM [express] serving on port 5000
🔔 Serviço de lembretes iniciado
💳 Serviço de cobrança de planos iniciado
```

## 📞 Se não funcionar:

1. **Verificar PostgreSQL**: `sudo systemctl status postgresql`
2. **Verificar logs**: `sudo journalctl -u postgresql -f`
3. **Testar banco**: `psql -U financeuser -h localhost -d financedb -c "SELECT 1;"`
4. **Verificar Node.js**: `node --version` (deve ser v20+)

## 🔧 Solução manual (se o script não funcionar):

```bash
# 1. Atualizar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Configurar PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE financedb;"
sudo -u postgres psql -c "CREATE USER financeuser WITH PASSWORD 'financepass123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;"

# 3. Criar .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://financeuser:financepass123@localhost:5432/financedb
SESSION_SECRET=chave-secreta-super-segura-de-32-caracteres-para-producao-vps-2024
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
EOF

# 4. Executar
export DATABASE_URL="postgresql://financeuser:financepass123@localhost:5432/financedb"
npm install
npm run dev
```

---

**⚡ Esta solução resolve definitivamente os erros da VPS!**