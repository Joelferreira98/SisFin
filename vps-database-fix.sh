#!/bin/bash

# Script específico para corrigir DATABASE_URL no VPS
echo "🔧 Correção DATABASE_URL para VPS..."

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o .env existe
if [[ ! -f ".env" ]]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "💡 Execute: ./setup-auto.sh primeiro"
    exit 1
fi

# Verificar se DATABASE_URL está no .env
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ DATABASE_URL não encontrada no .env!"
    
    # Solicitar DATABASE_URL do usuário
    echo "📝 Por favor, forneça a DATABASE_URL do seu banco PostgreSQL:"
    echo "Exemplo: postgresql://usuario:senha@host:5432/database"
    read -p "DATABASE_URL: " USER_DATABASE_URL
    
    if [[ -z "$USER_DATABASE_URL" ]]; then
        echo "❌ DATABASE_URL não fornecida!"
        exit 1
    fi
    
    # Adicionar ao .env
    echo "" >> .env
    echo "# DATABASE_URL para VPS" >> .env
    echo "DATABASE_URL=$USER_DATABASE_URL" >> .env
    
    echo "✅ DATABASE_URL adicionada ao .env"
else
    echo "✅ DATABASE_URL encontrada no .env"
fi

# Backup do server/index.ts
cp server/index.ts server/index.ts.backup.$(date +%Y%m%d_%H%M%S)

# Garantir que dotenv seja carregado antes de tudo
cat > server/index.ts << 'EOF'
// VPS FIX: Carregar dotenv ANTES de qualquer outra coisa
import { config } from 'dotenv';
config();

// Verificar se DATABASE_URL foi carregada
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada!');
    console.error('Verifique se o arquivo .env está configurado corretamente.');
    console.error('Execute: node test-env.js para verificar variáveis de ambiente');
    process.exit(1);
}

console.log('✅ DATABASE_URL carregada:', process.env.DATABASE_URL.substring(0, 50) + '...');

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { reminderService } from "./reminder-service";
import { planBillingService } from "./plan-billing-service";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Iniciar serviços
    reminderService.start();
    planBillingService.start();

    // setup vite in development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // setup error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    const PORT = Number(process.env.PORT) || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
})();
EOF

echo "✅ server/index.ts atualizado para VPS"

# Criar script de teste específico para VPS
cat > test-env.js << 'EOF'
#!/usr/bin/env node

// Teste específico para VPS
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testando variáveis de ambiente no VPS...');

// Carregar .env
const result = config({ path: join(__dirname, '.env') });

if (result.error) {
    console.error('❌ Erro ao carregar .env:', result.error);
    process.exit(1);
}

console.log('✅ Arquivo .env carregado');

// Verificar variáveis essenciais
const requiredVars = ['DATABASE_URL', 'SESSION_SECRET', 'NODE_ENV', 'PORT'];
const missing = [];

console.log('\n📋 Verificando variáveis essenciais:');
for (const varName of requiredVars) {
    if (process.env[varName]) {
        if (varName === 'DATABASE_URL') {
            console.log(`✅ ${varName}: ${process.env[varName].substring(0, 50)}...`);
        } else if (varName === 'SESSION_SECRET') {
            console.log(`✅ ${varName}: ${process.env[varName].substring(0, 16)}...`);
        } else {
            console.log(`✅ ${varName}: ${process.env[varName]}`);
        }
    } else {
        console.log(`❌ ${varName}: NÃO ENCONTRADA`);
        missing.push(varName);
    }
}

if (missing.length > 0) {
    console.log('\n❌ Variáveis ausentes:', missing.join(', '));
    console.log('💡 Execute: ./vps-database-fix.sh');
    process.exit(1);
}

console.log('\n✅ Todas as variáveis essenciais estão configuradas!');
console.log('🚀 Sistema pronto para iniciar no VPS');
EOF

chmod +x test-env.js

echo "✅ test-env.js criado"

# Testar a configuração
echo "🧪 Testando configuração..."
if node test-env.js; then
    echo "✅ Configuração VPS OK!"
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Build: npm run build"
    echo "2. Iniciar: node dist/index.js"
    echo "3. Ou usar: ./start-simple.sh"
else
    echo "❌ Ainda há problemas na configuração"
    echo "💡 Verifique o arquivo .env manualmente"
fi