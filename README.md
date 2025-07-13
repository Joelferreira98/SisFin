# SisFin - Sistema de Gestão Financeira

Sistema completo de gestão financeira para pequenas e médias empresas com integração WhatsApp, controle de clientes, contas a receber/pagar, vendas parceladas e muito mais.

## 🚀 Recursos Principais

### 💰 Gestão Financeira
- **Contas a Receber**: Controle completo de recebíveis com vencimentos
- **Contas a Pagar**: Gestão de pagamentos e obrigações
- **Dashboard**: Visão geral da situação financeira
- **Relatórios**: Análises detalhadas e métricas

### 👥 Gestão de Clientes
- **Cadastro Completo**: Nome, WhatsApp, CPF/CNPJ, endereço
- **Histórico**: Acompanhe todas as transações por cliente
- **Comunicação**: Integração direta com WhatsApp

### 📱 Integração WhatsApp
- **Lembretes Automáticos**: Notificações de vencimento
- **Confirmações**: Links de confirmação via WhatsApp
- **Templates**: Mensagens personalizáveis
- **Multi-instância**: Cada usuário pode ter sua própria instância

### 🛒 Vendas Parceladas
- **Confirmação Digital**: Clientes confirmam com assinatura digital
- **Aprovação Admin**: Processo de aprovação com comentários
- **Geração Automática**: Criação automática de recebíveis
- **Notificações**: Comunicação automática via WhatsApp

### 🔧 Administração
- **Gestão de Planos**: Diferentes níveis de acesso
- **Configurações**: Personalização completa do sistema
- **Usuários**: Controle de acesso e permissões
- **Relatórios**: Métricas de uso e performance

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** com **Neon Serverless**
- **Drizzle ORM** para modelagem de dados
- **TypeScript** para tipagem estática
- **Evolution API** para integração WhatsApp

### Frontend
- **React 18** com **TypeScript**
- **Vite** para build e desenvolvimento
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** para gerenciamento de estado
- **Wouter** para roteamento

### Segurança
- **Autenticação** com sessões seguras
- **Autorização** baseada em roles
- **Validação** com Zod em frontend e backend
- **Sanitização** de dados

## 📦 Instalação

### Requisitos
- Node.js 20+
- PostgreSQL 15+
- Git

### Instalação Rápida

1. **Clone o repositório**
```bash
git clone https://github.com/Joelferreira98/SisFin.git
cd SisFin
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
# Configure suas variáveis de ambiente
```

4. **Configure o banco de dados**
```bash
# Crie um banco PostgreSQL
createdb sisfindb

# Configure a DATABASE_URL no .env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sisfindb"
```

5. **Inicialize o banco**
```bash
npm run db:push
```

6. **Inicie o servidor**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

### 🚀 Instalação VPS (Automática)

Para deploy em servidor VPS com configuração completa:

```bash
# Download e execução do script completo
wget -O vps-complete-fix.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/vps-complete-fix.sh
chmod +x vps-complete-fix.sh
./vps-complete-fix.sh
```

**Recursos do script automatizado:**
- ✅ Instalação completa de Node.js 20 e PostgreSQL
- ✅ Configuração interativa de porta
- ✅ **Configuração de domínio personalizado**
- ✅ **Certificado SSL Let's Encrypt automático**
- ✅ Configuração de PM2, Nginx e firewall
- ✅ Criação de usuário administrador

### 🔐 Configuração SSL

Para adicionar SSL a uma instalação existente:

```bash
# Script para configurar SSL
wget -O setup-ssl.sh https://raw.githubusercontent.com/Joelferreira98/SisFin/main/setup-ssl.sh
chmod +x setup-ssl.sh
./setup-ssl.sh
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sisfindb"

# Sessão
SESSION_SECRET="sua-chave-secreta-aqui"

# Evolution API (WhatsApp)
EVOLUTION_API_URL="https://sua-api.com"
EVOLUTION_API_KEY="sua-chave-api"
EVOLUTION_INSTANCE_NAME="sua-instancia"

# Aplicação
NODE_ENV="development"
PORT=5000

# SSL (para resolução de problemas de certificado)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Configuração do WhatsApp

1. **Obtenha acesso à Evolution API**
   - Configure uma instância da Evolution API
   - Obtenha a URL e chave de API

2. **Configure no sistema**
   - Acesse a área administrativa
   - Configure as credenciais da Evolution API
   - Cada usuário pode criar suas próprias instâncias

## 🚀 Deploy

### Deploy Local
```bash
# Build da aplicação
npm run build

# Inicie em produção
npm start
```

### Deploy VPS/Docker
```bash
# Docker Compose
docker-compose up -d

# Ou use nosso script automatizado
./vps-complete-fix.sh
```

## 📱 Recursos Avançados

### PWA (Progressive Web App)
- **Instalação**: Pode ser instalado como app nativo
- **Offline**: Funciona sem conexão
- **Notificações**: Push notifications
- **Responsivo**: Otimizado para mobile

### Sistema de Planos
- **Plano Gratuito**: Recursos básicos
- **Planos Pagos**: Recursos avançados
- **Limitações**: Controle automático de limites
- **Upgrades**: Solicitação de mudança de plano

### Automação
- **Lembretes**: Envio automático de cobranças
- **Confirmações**: Links de confirmação automáticos
- **Relatórios**: Geração automática de relatórios
- **Backups**: Backup automático de dados

## 🔒 Segurança

### Autenticação
- **Senhas**: Hash bcrypt
- **Sessões**: Armazenamento seguro
- **Tokens**: Tokens únicos para confirmações
- **Expiração**: Sessões com expiração

### Dados
- **Validação**: Validação em todas as camadas
- **Sanitização**: Limpeza de dados de entrada
- **Encriptação**: Dados sensíveis encriptados
- **Backup**: Backup regular dos dados

## 🤝 Contribuição

### Como Contribuir
1. **Fork** o projeto
2. **Crie** uma branch (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

### Padrões de Código
- **TypeScript**: Tipagem estrita
- **ESLint**: Linting automático
- **Prettier**: Formatação consistente
- **Testes**: Testes unitários e integração

## 📞 Suporte

### Documentação
- **INSTALL.md**: Guia de instalação detalhado
- **DEPLOYMENT.md**: Guia de deploy
- **API.md**: Documentação da API

### Contato
- **Issues**: Reporte bugs no GitHub
- **Email**: suporte@sisfinapp.com
- **Discord**: [Link do Discord]

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎯 Roadmap

### Versão 2.0
- [ ] API REST pública
- [ ] Integração PIX
- [ ] Relatórios avançados
- [ ] Multi-empresa

### Versão 1.5
- [ ] Importação de dados
- [ ] Templates de email
- [ ] Integração contábil
- [ ] App mobile nativo

---

**Desenvolvido com ❤️ para pequenas e médias empresas**