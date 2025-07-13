# 🚀 Configuração Rápida do SisFin

## Configuração Automática (Recomendada)

Execute este comando para configurar automaticamente o sistema:

```bash
./setup-auto.sh
```

Este script irá:
- ✅ Gerar chave de sessão automaticamente
- ✅ Configurar arquivo .env com valores padrão
- ✅ Configurar dotenv no servidor
- ✅ Configurar PM2 para produção
- ✅ Testar a configuração

## Configuração Interativa (Personalizada)

Para configuração personalizada, execute:

```bash
./setup-interactive.sh
```

## Iniciando o Sistema

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
./start-simple.sh
```

## Testando a Configuração

Para verificar se tudo está funcionando:

```bash
node test-config.js
```

## Estrutura dos Arquivos

```
SisFin/
├── .env                   # Variáveis de ambiente
├── ecosystem.config.js    # Configuração do PM2
├── setup-auto.sh         # Configuração automática
├── setup-interactive.sh  # Configuração interativa
├── start-simple.sh       # Inicialização simples
├── test-config.js        # Teste de configuração
└── logs/                 # Logs da aplicação
```

## Configurações Importantes

### Banco de Dados
- **Replit**: Configuração automática da DATABASE_URL
- **VPS**: Configure manualmente no .env

### WhatsApp (Evolution API)
- Configure as variáveis EVOLUTION_API_* no .env
- Obtenha suas credenciais da Evolution API

### Chave de Sessão
- Gerada automaticamente pelo script
- Mantém as sessões dos usuários seguras

## Solução de Problemas

1. **Erro de DATABASE_URL**: Execute `node test-config.js`
2. **Erro de PM2**: Use `./start-simple.sh` como alternativa
3. **Erro de build**: Execute `npm run build` manualmente
4. **Problemas de configuração**: Execute `./setup-auto.sh` novamente

## Comandos Úteis

```bash
# Ver logs da aplicação
tail -f logs/app.log

# Status do PM2
pm2 status

# Reiniciar aplicação
pm2 restart sisfin

# Testar configuração
node test-config.js
```

---

**Sistema configurado e pronto para uso!**