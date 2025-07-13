#!/bin/bash

# Script para corrigir o erro de import.meta.dirname no vite.config.ts
# Este erro ocorre quando o Node.js não suporta import.meta.dirname

echo "🔧 Corrigindo erro do Vite config..."

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Verificar se o diretório está correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se vite.config.ts existe
if [ ! -f "vite.config.ts" ]; then
    echo "❌ Arquivo vite.config.ts não encontrado"
    exit 1
fi

# Criar uma versão temporária do vite.config.ts que funciona em Node.js mais antigo
echo "📝 Criando configuração temporária do Vite..."
cat > vite.config.temp.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
EOF

# Fazer backup do arquivo original
echo "📁 Fazendo backup do arquivo original..."
cp vite.config.ts vite.config.original.ts

# Aplicar correção temporária
echo "🔄 Aplicando correção..."
cp vite.config.temp.ts vite.config.ts

# Testar se funciona
echo "🧪 Testando configuração..."
if timeout 10s npm run dev 2>&1 | grep -q "serving on port"; then
    echo "✅ Configuração funcionando!"
else
    echo "❌ Ainda há problemas, restaurando original..."
    cp vite.config.original.ts vite.config.ts
fi

# Limpar arquivos temporários
rm -f vite.config.temp.ts

echo "✅ Script concluído"