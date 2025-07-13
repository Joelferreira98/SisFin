#!/usr/bin/env node

// Script para testar se o dotenv está funcionando corretamente
// Usado para debug de problemas de DATABASE_URL

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
const result = dotenv.config({ path: join(__dirname, '.env') });

console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');

if (result.error) {
    console.error('❌ Erro ao carregar .env:', result.error);
} else {
    console.log('✅ Arquivo .env carregado com sucesso');
}

console.log('\n📋 Variáveis importantes:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definida');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '❌ NÃO DEFINIDA');
console.log('PORT:', process.env.PORT || 'não definida');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Definida' : '❌ NÃO DEFINIDA');

console.log('\n🔍 Variáveis relacionadas ao banco:');
const dbVars = Object.keys(process.env).filter(key => 
    key.includes('DATABASE') || key.includes('DB') || key.includes('NEON')
);
dbVars.forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ Definida' : '❌ NÃO DEFINIDA'}`);
});

console.log('\n🔍 Variáveis do Evolution API:');
const apiVars = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE_NAME'];
apiVars.forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ Definida' : '❌ NÃO DEFINIDA'}`);
});

console.log('\n🔐 Verificação SSL:');
console.log('NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'não definida');

// Teste de conexão com DATABASE_URL se disponível
if (process.env.DATABASE_URL) {
    console.log('\n🔗 Testando formato da DATABASE_URL...');
    const url = process.env.DATABASE_URL;
    
    if (url.startsWith('postgresql://')) {
        console.log('✅ URL PostgreSQL válida');
        
        // Extrair partes da URL
        try {
            const dbUrl = new URL(url);
            console.log('Host:', dbUrl.hostname);
            console.log('Porta:', dbUrl.port || '5432');
            console.log('Banco:', dbUrl.pathname.slice(1));
            console.log('Usuário:', dbUrl.username);
            console.log('SSL:', dbUrl.searchParams.get('sslmode') || 'não especificado');
        } catch (e) {
            console.error('❌ Erro ao parsear URL:', e.message);
        }
    } else {
        console.error('❌ URL não é PostgreSQL válida');
    }
} else {
    console.error('❌ DATABASE_URL não definida');
}

console.log('\n=== FIM DO TESTE ===');