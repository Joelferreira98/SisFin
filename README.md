# SisFin - Sistema de Gestão Financeira

Sistema completo de gestão financeira com funcionalidades avançadas de comunicação WhatsApp, PWA e deployment para VPS.

## 🚀 Características Principais

### 💼 Gestão Financeira Completa
- **Clientes**: Cadastro completo com dados pessoais e de contato
- **Contas a Receber**: Controle de valores a receber com status e vencimentos
- **Contas a Pagar**: Gestão de pagamentos com fornecedores
- **Relatórios**: Dashboard com métricas financeiras detalhadas
- **Vendas Parceladas**: Sistema de confirmação com assinatura digital

### 📱 Integração WhatsApp
- **Evolution API**: Conexão via WhatsApp-Baileys com QR Code
- **Mensagens Automáticas**: Envio automático de confirmações e cobranças
- **Lembretes**: Sistema automatizado de lembretes de pagamento
- **Multi-usuário**: Cada usuário gerencia suas próprias instâncias

### 🎨 Interface Moderna
- **PWA**: Progressive Web App instalável
- **Responsivo**: Interface adaptável para todos os dispositivos
- **Personalização**: Logo, nome e tema customizáveis
- **Offline**: Funciona sem conexão com internet

### 👥 Sistema de Usuários
- **Autenticação**: Login seguro com sessões persistentes
- **Perfis**: Usuários normais e administradores
- **Planos**: Sistema de assinatura com limitações
- **Controle**: Solicitações de mudança de plano

## 🛠️ Tecnologias

**Frontend:**
- React 18 + TypeScript
- Vite + Tailwind CSS
- shadcn/ui components
- TanStack Query
- PWA Service Worker

**Backend:**
- Node.js + Express
- PostgreSQL + Drizzle ORM
- Evolution API
- Cron Jobs automáticos

**Deployment:**
- Docker + Docker Compose
- PostgreSQL 15 container
- Nginx proxy reverso
- SSL automático

## 📦 Instalação Rápida

### 🚨 ERROS VPS: Solução Completa

Se você está vendo erros como:
- `DATABASE_URL must be set`
- `TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string`

**SOLUÇÃO DEFINITIVA:**
```bash
# Script completo que resolve todos os erros
wget https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh
chmod +x vps-complete-fix.sh
./vps-complete-fix.sh

# Iniciar aplicação
./start-app-vps.sh
```

**Documentação completa:** `README_VPS_ERRO.md`

### Método 1: Desenvolvimento Local

```bash
# Clonar o repositório
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar o arquivo .env com suas configurações

# Configurar banco de dados PostgreSQL
# Opção A: Script automatizado
chmod +x setup-vps-db.sh
./setup-vps-db.sh

# Opção B: Docker PostgreSQL
docker run --name postgres-sisfin -e POSTGRES_PASSWORD=financepass -e POSTGRES_DB=financedb -e POSTGRES_USER=financeuser -p 5432:5432 -d postgres:15

# Aplicar schema do banco
npm run db:push

# Executar em modo desenvolvimento
npm run dev
```

**Acesse:** http://localhost:5000

### Método 2: Deployment VPS com Docker

```bash
# Clonar repositório
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin

# Executar deployment automático
chmod +x deploy.sh
./deploy.sh

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com configurações do VPS

# Iniciar com Docker
docker-compose up -d

# Verificar status
docker-compose ps
```

## ⚙️ Configuração

### Arquivo .env

```env
# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://financeuser:financepass@localhost:5432/financedb

# Sessão (use chave aleatória de 32+ caracteres)
SESSION_SECRET=sua-chave-secreta-super-segura

# Evolution API WhatsApp
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-da-api
EVOLUTION_INSTANCE_NAME=instancia-padrao

# Ambiente
NODE_ENV=development
```

### Configuração PostgreSQL

```sql
-- Criar banco de dados
CREATE DATABASE financedb;

-- Criar usuário
CREATE USER financeuser WITH PASSWORD 'financepass';
GRANT ALL PRIVILEGES ON DATABASE financedb TO financeuser;
```

### Configuração Rápida PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Usar script automatizado
chmod +x setup-vps-db.sh
./setup-vps-db.sh

# Aplicar schema
npm run db:push
```

### Configuração Evolution API

1. **Obter instância Evolution API**
2. **Configurar URL e chave da API**
3. **Definir instância padrão**
4. **Testar conexão:**

```bash
curl -H "apikey: SUA_CHAVE" https://sua-evolution-api.com/instance/connect/INSTANCIA
```

## 🐳 Docker Deployment

### Pré-requisitos VPS
- Ubuntu 20.04+ ou CentOS 8+
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- 20GB espaço em disco

### Deployment Automático

```bash
# Clonar projeto
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin

# Executar script de deployment
chmod +x deploy.sh
./deploy.sh

# Configurar .env
cp .env.example .env
nano .env

# Iniciar serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f app
```

### Comandos Docker Úteis

```bash
# Parar serviços
docker-compose stop

# Reiniciar serviços
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f app

# Backup do banco
docker-compose exec db mysqldump -u root -p financedb > backup.sql

# Restaurar backup
docker-compose exec -i db mysql -u root -p financedb < backup.sql
```

## 📱 PWA - Progressive Web App

### Instalação Mobile
1. Acesse o sistema pelo navegador
2. Toque no menu "Adicionar à tela inicial"
3. Confirme a instalação
4. Use como app nativo

### Recursos PWA
- ✅ Instalação nativa
- ✅ Funcionamento offline
- ✅ Ícones personalizáveis
- ✅ Notificações push
- ✅ Manifest dinâmico

## 🔐 Segurança

### Medidas Implementadas
- Autenticação por sessão
- Validação de dados
- Sanitização de entrada
- Controle de acesso
- Backup automático

### Configuração SSL (VPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Funcionalidades Detalhadas

### Gestão de Clientes
- Cadastro completo (nome, documento, contato)
- Histórico de transações
- Integração com WhatsApp
- Relatórios personalizados

### Contas a Receber
- Controle de vencimentos
- Status automático (pendente, pago, vencido)
- Geração de lembretes
- Relatórios financeiros

### Contas a Pagar
- Gestão de fornecedores
- Controle de pagamentos
- Alertas de vencimento
- Fluxo de caixa

### Vendas Parceladas
- Criação de vendas
- Confirmação por assinatura digital
- Workflow de aprovação
- Geração automática de parcelas

### Sistema WhatsApp
- Conexão via QR Code
- Mensagens automáticas
- Templates personalizáveis
- Logs de envio

## 🗂️ Estrutura do Projeto

```
SisFin/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/         # Hooks customizados
│   │   ├── lib/           # Utilitários
│   │   ├── pages/         # Páginas da aplicação
│   │   └── App.tsx        # Componente principal
│   └── public/            # Arquivos estáticos
├── server/                # Backend Express
│   ├── auth.ts           # Sistema de autenticação
│   ├── db.ts             # Conexão com banco
│   ├── routes.ts         # Rotas da API
│   ├── storage.ts        # Camada de dados
│   └── whatsapp.ts       # Integração WhatsApp
├── shared/               # Código compartilhado
│   └── schema.ts         # Schema do banco
├── docker-compose.yml    # Configuração Docker
├── Dockerfile           # Imagem da aplicação
├── deploy.sh            # Script de deployment
├── .env.example         # Exemplo de configuração
└── README.md            # Esta documentação
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor desenvolvimento
npm run build        # Build produção
npm run start        # Servidor produção
npm run check        # Verificar TypeScript
npm run db:push      # Aplicar schema no banco

# Deployment
./deploy.sh                    # Deployment automático
./package-for-deployment.sh    # Criar pacote deployment
```

## 🔍 Monitoramento

### Logs do Sistema
```bash
# Logs da aplicação
docker-compose logs -f app

# Logs do banco
docker-compose logs -f db

# Logs do Nginx
tail -f /var/log/nginx/access.log
```

### Métricas
```bash
# Status containers
docker-compose ps

# Uso de recursos
docker stats

# Espaço em disco
df -h
```

## 🆘 Solução de Problemas

### Problemas Comuns

**1. Erro de conexão MySQL:**
```bash
# Verificar se MySQL está rodando
docker-compose ps db

# Reiniciar serviço
docker-compose restart db

# Verificar logs
docker-compose logs db
```

**2. Aplicação não inicia:**
```bash
# Verificar variáveis de ambiente
docker-compose exec app env

# Verificar logs
docker-compose logs app
```

**3. Problemas WhatsApp:**
```bash
# Testar conexão Evolution API
curl -H "apikey: SUA_CHAVE" https://sua-evolution-api.com/instance/connect/INSTANCIA

# Verificar logs WhatsApp
docker-compose logs app | grep -i whatsapp
```

**4. Erro 502 Bad Gateway:**
```bash
# Verificar se aplicação está rodando
docker-compose ps

# Verificar configuração Nginx
nginx -t

# Reiniciar Nginx
systemctl reload nginx
```

## 📈 Backup e Manutenção

### Backup Automático
```bash
#!/bin/bash
# Script incluído no projeto
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup banco
docker-compose exec -T db mysqldump -u root -p$MYSQL_ROOT_PASSWORD financedb > $BACKUP_DIR/db_$DATE.sql

# Backup arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/SisFin
```

### Manutenção Regular
```bash
# Limpar containers antigos
docker system prune -a

# Verificar espaço em disco
df -h

# Atualizar sistema
apt update && apt upgrade -y

# Verificar logs de erro
grep -i error /var/log/nginx/error.log
```

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📞 Suporte

### Repositório
- **GitHub**: https://github.com/Joelferreira98/SisFin
- **Issues**: Para reportar bugs e solicitar funcionalidades
- **Wiki**: Documentação adicional
- **Releases**: Versões e changelog

### Documentação
- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **Configuração**: `.env.example`
- **Schema**: `shared/schema.ts`
- **API**: Documentação das rotas

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

## 📊 Status do Projeto

- ✅ **Funcional**: Sistema completo e operacional
- ✅ **Testado**: Ambiente de produção
- ✅ **Documentado**: Guias completos
- ✅ **Deploy Ready**: Pronto para VPS
- ✅ **PWA**: App web progressiva
- ✅ **Mobile**: Design responsivo

---

**Desenvolvido por Joel Ferreira - Sistema de Gestão Financeira**

🔗 **Repositório**: https://github.com/Joelferreira98/SisFin