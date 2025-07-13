#!/bin/bash

# Script para verificar o status do sistema SisFin
echo "🔍 Verificando status do sistema SisFin..."

# Verificar se o arquivo .env existe
if [[ -f ".env" ]]; then
    echo "✅ Arquivo .env encontrado"
else
    echo "❌ Arquivo .env não encontrado"
    echo "💡 Execute: ./setup-auto.sh"
    exit 1
fi

# Verificar se o servidor está rodando
if pgrep -f "node.*server/index.ts" > /dev/null || pgrep -f "tsx.*server/index.ts" > /dev/null; then
    echo "✅ Servidor está rodando"
    
    # Verificar se a porta está ativa
    if command -v curl &> /dev/null; then
        if curl -s -f http://localhost:5000 > /dev/null 2>&1; then
            echo "✅ Aplicação respondendo na porta 5000"
        else
            echo "⚠️ Servidor rodando mas não responde na porta 5000"
        fi
    else
        echo "⚠️ curl não disponível para testar a porta"
    fi
else
    echo "❌ Servidor não está rodando"
    echo "💡 Execute: npm run dev"
fi

# Verificar se PM2 está instalado
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 instalado"
    
    # Verificar se há processos PM2 rodando
    if pm2 list | grep -q "sisfin"; then
        echo "✅ Processo PM2 ativo"
        pm2 list | grep sisfin
    else
        echo "⚠️ Nenhum processo PM2 ativo"
    fi
else
    echo "⚠️ PM2 não instalado"
fi

# Verificar dependências
echo ""
echo "📦 Verificando dependências..."
if [[ -f "package.json" ]]; then
    echo "✅ package.json encontrado"
    
    if [[ -d "node_modules" ]]; then
        echo "✅ node_modules encontrado"
        
        # Verificar algumas dependências importantes
        if [[ -d "node_modules/dotenv" ]]; then
            echo "✅ dotenv instalado"
        else
            echo "❌ dotenv não instalado"
        fi
        
        if [[ -d "node_modules/express" ]]; then
            echo "✅ express instalado"
        else
            echo "❌ express não instalado"
        fi
        
        if [[ -d "node_modules/drizzle-orm" ]]; then
            echo "✅ drizzle-orm instalado"
        else
            echo "❌ drizzle-orm não instalado"
        fi
    else
        echo "❌ node_modules não encontrado"
        echo "💡 Execute: npm install"
    fi
else
    echo "❌ package.json não encontrado"
fi

# Verificar build
echo ""
echo "🔨 Verificando build..."
if [[ -d "dist" ]]; then
    echo "✅ Diretório dist encontrado"
    
    if [[ -f "dist/index.js" ]]; then
        echo "✅ Build do servidor encontrado"
    else
        echo "❌ Build do servidor não encontrado"
        echo "💡 Execute: npm run build"
    fi
else
    echo "❌ Diretório dist não encontrado"
    echo "💡 Execute: npm run build"
fi

# Verificar logs
echo ""
echo "📋 Verificando logs..."
if [[ -d "logs" ]]; then
    echo "✅ Diretório logs encontrado"
    
    if [[ -f "logs/out.log" ]]; then
        echo "✅ Logs de saída encontrados"
        echo "Últimas 3 linhas do log:"
        tail -n 3 logs/out.log 2>/dev/null || echo "Log vazio"
    else
        echo "⚠️ Logs de saída não encontrados"
    fi
else
    echo "⚠️ Diretório logs não encontrado"
fi

# Executar teste de configuração
echo ""
echo "🧪 Executando teste de configuração..."
if node test-config.js; then
    echo "✅ Teste de configuração passou"
else
    echo "❌ Teste de configuração falhou"
fi

echo ""
echo "🎯 Comandos úteis:"
echo "• Configurar: ./setup-auto.sh"
echo "• Desenvolvimento: npm run dev"
echo "• Build: npm run build"
echo "• Produção: ./start-simple.sh"
echo "• Testar: node test-config.js"
echo "• Status: ./status.sh"