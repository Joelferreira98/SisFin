#!/usr/bin/env node

// Teste de configuração do sistema
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testando configuração do sistema...');

// Tentar carregar dotenv
try {
    const dotenv = await import('dotenv');
    const result = dotenv.config({ path: join(__dirname, '.env') });
    
    if (result.error) {
        console.error('❌ Erro ao carregar .env:', result.error);
        process.exit(1);
    } else {
        console.log('✅ Arquivo .env carregado com sucesso');
    }
} catch (error) {
    console.error('❌ Erro ao importar dotenv:', error.message);
    console.log('⚠️ Continuando sem dotenv (usando variáveis já carregadas)');
}

console.log('\n📋 Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definida');
console.log('PORT:', process.env.PORT || 'não definida');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Configurada' : '❌ NÃO CONFIGURADA');

if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL: ✅ Configurada');
    
    if (process.env.DATABASE_URL.startsWith('postgresql://')) {
        console.log('Tipo: PostgreSQL');
        try {
            const dbUrl = new URL(process.env.DATABASE_URL);
            console.log('Host:', dbUrl.hostname);
            console.log('Porta:', dbUrl.port || '5432');
            console.log('Banco:', dbUrl.pathname.slice(1));
        } catch (e) {
            console.log('❌ Erro ao analisar URL:', e.message);
        }
    }
} else {
    console.log('DATABASE_URL: 🔄 Será carregada automaticamente pelo Replit');
}

console.log('\n🔗 Configurações do WhatsApp:');
console.log('Evolution API URL:', process.env.EVOLUTION_API_URL || 'não definida');
console.log('Evolution API Key:', process.env.EVOLUTION_API_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA');
console.log('Instância padrão:', process.env.EVOLUTION_INSTANCE_NAME || 'não definida');

console.log('\n✅ Teste de configuração concluído!');

// Verificar se as variáveis essenciais estão definidas
const essentialVars = ['NODE_ENV', 'PORT', 'SESSION_SECRET'];
const missing = essentialVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
    console.log('\n❌ Variáveis essenciais não encontradas:', missing.join(', '));
    console.log('💡 Execute: ./setup-auto.sh para configurar automaticamente');
    process.exit(1);
} else {
    console.log('\n🎉 Todas as variáveis essenciais estão configuradas!');
}
