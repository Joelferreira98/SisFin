# 🚨 SOLUÇÃO URGENTE VPS - DATABASE_URL

Se você está recebendo o erro "DATABASE_URL must be set" no VPS, siga estes passos:

## 🔧 Correção Rápida

### 1. Execute o script de correção:
```bash
chmod +x vps-database-fix.sh
./vps-database-fix.sh
```

### 2. Ou correção manual:

**Passo 1: Verificar .env**
```bash
cat .env | grep DATABASE_URL
```

**Passo 2: Se não existir, adicionar manualmente:**
```bash
echo "DATABASE_URL=postgresql://usuario:senha@host:5432/database" >> .env
```

**Passo 3: Corrigir server/index.ts**
```bash
# Fazer backup
cp server/index.ts server/index.ts.backup

# Editar e garantir que a primeira linha seja:
# import { config } from 'dotenv';
# config();
```

**Passo 4: Testar configuração**
```bash
node test-env.js
```

**Passo 5: Build e iniciar**
```bash
npm run build
./start-vps.sh
```

## 🆘 Solução Definitiva

### Script Completo de Correção:
```bash
#!/bin/bash

# Baixar e executar correção
wget -O vps-database-fix.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-database-fix.sh
chmod +x vps-database-fix.sh
./vps-database-fix.sh

# Fazer build
npm run build

# Iniciar sistema
./start-vps.sh
```

## 📋 Verificação Manual

1. **Verificar se DATABASE_URL está no .env:**
   ```bash
   grep "DATABASE_URL" .env
   ```

2. **Verificar se dotenv está carregando:**
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'OK' : 'ERRO')"
   ```

3. **Testar conexão com banco:**
   ```bash
   node test-env.js
   ```

## 🔗 Configuração da DATABASE_URL

**Formato PostgreSQL:**
```
DATABASE_URL=postgresql://usuario:senha@host:5432/database?sslmode=require
```

**Exemplo com parâmetros:**
```
DATABASE_URL=postgresql://admin:minhasenha@localhost:5432/sisfin?sslmode=require
```

## 🚀 Inicialização no VPS

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
./start-vps.sh
```

**Com PM2:**
```bash
pm2 start ecosystem.config.js
```

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique se o PostgreSQL está rodando
2. Teste a conexão com o banco manualmente
3. Verifique as permissões do arquivo .env
4. Execute `node test-env.js` para diagnóstico

---

**⚡ Esta correção resolve 99% dos problemas de DATABASE_URL no VPS!**