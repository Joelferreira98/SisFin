# 🔧 Guia Completo de Correção do Sistema SisFin

Este documento contém todas as soluções para os problemas mais comuns encontrados no sistema SisFin.

## 📋 Problemas Identificados e Soluções

### 1. Erro: "DATABASE_URL must be set"
**Causa:** Variável de ambiente não carregada corretamente
**Solução:** Configuração adequada do dotenv

### 2. Erro: "File ecosystem.config.js malformated"
**Causa:** Conflito entre ES6 modules e CommonJS no PM2
**Solução:** Usar CommonJS no arquivo de configuração do PM2

### 3. Erro: "ReferenceError: module is not defined"
**Causa:** PM2 tentando ler sintaxe ES6 modules
**Solução:** Configuração correta do ecosystem.config.js

### 4. Problemas de Build
**Causa:** Configuração inadequada do esbuild ou dependências
**Solução:** Recompilação completa com dependências atualizadas

## 🚀 Soluções Rápidas

### Solução 1: Correção Completa do Sistema
```bash
wget -O fix-build-system.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/fix-build-system.sh
chmod +x fix-build-system.sh
./fix-build-system.sh
```

### Solução 2: Correção Específica do PM2
```bash
wget -O fix-pm2-config.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/fix-pm2-config.sh
chmod +x fix-pm2-config.sh
./fix-pm2-config.sh
```

### Solução 3: Correção do DATABASE_URL
```bash
wget -O fix-database-url-error.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/fix-database-url-error.sh
chmod +x fix-database-url-error.sh
./fix-database-url-error.sh
```

## 🔍 Diagnóstico Manual

### Passo 1: Verificar Ambiente
```bash
# Baixar e executar teste de ambiente
wget -O test-env.js https://raw.githubusercontent.com/Joelferreira98/SisFin/main/test-env.js
node test-env.js
```

### Passo 2: Verificar Build
```bash
# Verificar se o build funciona
npm run build

# Verificar se o arquivo foi criado
ls -la dist/index.js
```

### Passo 3: Verificar PM2
```bash
# Verificar se PM2 está instalado
pm2 --version

# Verificar configuração
cat ecosystem.config.js
```

## 🛠️ Correção Manual

### 1. Configurar dotenv corretamente
```bash
# Instalar dotenv se necessário
npm install dotenv

# Verificar se está importado no server/index.ts
grep -n "import dotenv" server/index.ts
```

### 2. Corrigir arquivo ecosystem.config.js
```javascript
// ecosystem.config.js - DEVE usar CommonJS
module.exports = {
  apps: [{
    name: 'sisfin',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

### 3. Configurar .env
```bash
# Criar arquivo .env se não existir
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
SESSION_SECRET=sua-chave-secreta-super-segura
EVOLUTION_API_URL=https://sua-evolution-api-url.com
EVOLUTION_API_KEY=sua-chave-da-evolution-api
EVOLUTION_INSTANCE_NAME=instancia-padrao
NODE_TLS_REJECT_UNAUTHORIZED=0
EOF
```

### 4. Configurar server/index.ts
```typescript
// No início do arquivo server/index.ts
import dotenv from "dotenv";
// Carregar variáveis de ambiente ANTES de qualquer importação
dotenv.config();

// Resto das importações...
```

## 📝 Comandos de Manutenção

### PM2 Commands
```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs sisfin

# Reiniciar
pm2 restart sisfin

# Parar
pm2 stop sisfin

# Monitorar
pm2 monit
```

### Build Commands
```bash
# Build completo
npm run build

# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install

# Iniciar desenvolvimento
npm run dev

# Iniciar produção
npm start
```

## 🔧 Estrutura de Arquivos Corrigida

```
SisFin/
├── server/
│   ├── index.ts           # ✅ Com dotenv no início
│   ├── routes.ts
│   ├── db.ts
│   └── ...
├── dist/
│   └── index.js           # ✅ Arquivo compilado
├── logs/                  # ✅ Diretório de logs
│   ├── err.log
│   ├── out.log
│   └── combined.log
├── .env                   # ✅ Variáveis de ambiente
├── ecosystem.config.js    # ✅ CommonJS para PM2
├── package.json           # ✅ Com "type": "module"
├── test-env.js           # ✅ Teste de ambiente
└── fix-*.sh              # ✅ Scripts de correção
```

## ⚠️ Importante

1. **Sempre use CommonJS** no arquivo `ecosystem.config.js` (module.exports)
2. **O projeto usa ES6 modules** em todos os outros arquivos TypeScript
3. **Dotenv deve ser importado** no início do server/index.ts
4. **PM2 precisa ser instalado globalmente** para funcionar corretamente
5. **Sempre compile** antes de iniciar com PM2

## 🎯 Verificação Final

Após executar qualquer correção, verifique:

1. ✅ `node test-env.js` - variáveis de ambiente OK
2. ✅ `npm run build` - build sem erros
3. ✅ `ls -la dist/index.js` - arquivo compilado existe
4. ✅ `pm2 start ecosystem.config.js` - PM2 inicia sem erros
5. ✅ `curl http://localhost:5000` - aplicação responde

## 📞 Suporte

Se ainda houver problemas após seguir este guia:

1. Execute `node test-env.js` e envie o resultado
2. Execute `npm run build` e envie os erros (se houver)
3. Verifique os logs: `pm2 logs sisfin` ou `cat logs/err.log`
4. Verifique o status: `pm2 status`

---

**Última atualização:** 13/07/2025  
**Versão:** 1.0  
**Compatibilidade:** Node.js 18+, PM2 5+, PostgreSQL 12+