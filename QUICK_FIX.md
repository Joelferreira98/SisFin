# 🚨 Solução Rápida - Problema Docker

## Seu Problema
Erro: `Not supported URL scheme http+docker` no Docker Compose

## ✅ Solução Imediata (Recomendada)

### Opção 1: Instalação Local (Mais Rápida)
```bash
# Execute no diretório do projeto
./install-local.sh

# Depois de configurar, inicie com:
./start-local.sh
```

### Opção 2: Corrigir Docker
```bash
# Diagnosticar problemas
./docker-diagnostics.sh

# Seguir as instruções do script
```

## 🔧 Configuração Rápida

### 1. Baixar do GitHub
```bash
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin
```

### 2. Executar instalação local
```bash
chmod +x install-local.sh
./install-local.sh
```

### 3. Configurar .env
```bash
# Editar arquivo .env
nano .env

# Configurar minimamente:
DATABASE_URL=mysql://root:@localhost:3306/financedb
SESSION_SECRET=sua-chave-secreta-de-32-caracteres
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-api
EVOLUTION_INSTANCE_NAME=instancia-local
```

### 4. Iniciar aplicação
```bash
# Opção 1: Script automático
./start-local.sh

# Opção 2: Manual
npm run dev
```

## 🎯 Acesso
- **URL**: http://localhost:5000
- **Usuário**: Joel
- **Senha**: 123456

## 📞 Se precisar de ajuda
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Documentação**: `README.md`
- **GitHub**: https://github.com/Joelferreira98/SisFin/issues

## 💡 Dicas Importantes
1. ✅ Use instalação local se Docker der problemas
2. ✅ Configure Evolution API depois
3. ✅ MySQL pode ser instalado localmente
4. ✅ Todos os recursos funcionam sem Docker

---
**Tempo estimado: 5-10 minutos**