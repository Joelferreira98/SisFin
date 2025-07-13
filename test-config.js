#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testando configuração...');

const result = dotenv.config({ path: join(__dirname, '.env') });

if (result.error) {
    console.error('❌ Erro ao carregar .env:', result.error);
    process.exit(1);
} else {
    console.log('✅ .env carregado');
}

console.log('📋 Variáveis:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Gerada' : '❌ Ausente');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '🔄 Replit Database');

console.log('✅ Configuração OK!');
