# Sistema de Relatórios Diários - Usinas Solares

Um sistema web responsivo (mobile-first) para registrar e consolidar relatórios diários de atividades e status técnico de usinas solares.

## 🚀 Funcionalidades

### ✅ Implementadas

- **Tela Inicial**: Escolha entre Relatório Diário, Status Técnico ou Modo Rápido
- **Relatório Diário de Atividades**: 
  - Tabela editável com atividades programadas
  - Validação de horários e sobreposições
  - Geração automática de mensagem WhatsApp
- **Relatório de Status Técnico**:
  - Cards para Inversores, Strings e Trackers
  - Visão consolidada por cluster
  - Geração de WhatsApp individual e consolidado
- **Modo Rápido**: Preenche ambos os relatórios em uma única tela
- **Gerenciamento**: Visualização, filtros e exportação de dados
- **Cadastro Padrão**: Gerenciamento de Clusters, Usinas e Técnicos
- **🆕 Banco de Dados**: SQLite com API REST para persistência
- **🆕 Deploy Ready**: Preparado para publicação na Hostinger

### 📱 Mobile-First Design

- Interface otimizada para celulares (360px+)
- Botões grandes e toques fáceis
- Navegação intuitiva
- Validações suaves que não bloqueiam

### 📊 Dados Pré-configurados

**Clusters e Usinas já cadastrados:**
- **Araraquara**: Boa Esperança do Sul II/V, Araraquara III/IV, Descalvado I, Dourado III, Santa Lucia I, Rincão
- **Barretos**: Altair I, Miguelópolis
- **Nova Crixas**: Nova Crixas I/II
- **Porangatu**: Porangatu I, Novo Planalto I/II, Minaçu
- **Aracatuba**: Pompeia II, Piacatu I, Avanhandava I, Getulina II

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (versão 16 ou superior)
- Yarn (recomendado - mais seguro que npm)

### Desenvolvimento Local

1. **Instalar dependências:**
   ```bash
   # Frontend
   yarn install
   
   # Backend
   cd backend
   yarn install
   cd ..
   ```

2. **Executar em desenvolvimento:**
   ```bash
   # Opção 1: Executar ambos simultaneamente
   yarn start-all
   
   # Opção 2: Executar separadamente
   # Terminal 1: Backend
   yarn start-backend
   
   # Terminal 2: Frontend
   yarn start
   ```

3. **Acessar o sistema:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:3001/api](http://localhost:3001/api)
   - Para melhor experiência mobile, use as ferramentas de desenvolvedor (F12)

### 🚀 Deploy para Produção (Hostinger)

1. **Preparar arquivos de deploy:**
   ```bash
   ./deploy.sh
   ```

2. **Seguir instruções no arquivo:**
   ```bash
   cat deploy/README-DEPLOY.md
   ```

3. **Configurar subdomínio na Hostinger**
4. **Fazer upload dos arquivos**

## 📝 Como Usar

### 1. Relatório Diário de Atividades
1. Selecione Data, Cluster, Usina e Técnico
2. Adicione atividades com horários de início e fim
3. Configure status de alarmes críticos
4. Gere mensagem WhatsApp ou salve o relatório

### 2. Status Técnico
1. Use os mesmos filtros do relatório diário
2. Configure status de Inversores, Strings e Trackers
3. Para sistemas com problemas, adicione motivo e ação prevista
4. Gere WhatsApp individual ou consolidado por cluster

### 3. Modo Rápido
1. Ative na tela inicial
2. Preencha ambos os relatórios com filtros compartilhados
3. Use abas para alternar entre Atividades e Status Técnico
4. Salve ambos de uma vez

### 4. Gerenciamento
- Visualize todos os relatórios com filtros avançados
- Alterne entre visualização em tabela e agrupada por cluster
- Exporte dados em CSV
- Gere WhatsApp consolidado por cluster

### 5. Cadastros
- Gerencie Clusters, Usinas e Técnicos
- Exporte/Importe dados para backup
- Ative/desative itens conforme necessário

## 📱 Modelos de Mensagem WhatsApp

### Relatório Diário
```
🔆 *Relatório Diário Araraquara – 19/09/2025*
👷 Equipe: João Souza
📍 Usina: Araraquara III

🔧 *Atividades Programadas*
1) Inspeção geral – ⏰ 08:00/10:00
2) Troca de fusível – ⏰ 10:30/11:15

📌 *Observações*
-

📊 *Status Sistemas*
- Alarmes críticos: NÃO
```

### Status Técnico
```
📍 *Araraquara III* – 19/09/2025 – Araraquara
👷 Técnico: João Souza

⚡ *Inversores*: SIM

🔗 *Strings*: SIM

🔩 *Trackers*: NÃO
Motivo: Falha setor 2. Ação: Troca atuador 14h

📝 Observações: -
```

## 🔧 Tecnologias Utilizadas

### Frontend
- **React 18**: Framework principal
- **Tailwind CSS**: Estilização e responsividade
- **Lucide React**: Ícones
- **date-fns**: Manipulação de datas

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **SQLite**: Banco de dados leve e confiável
- **CORS**: Configuração de segurança

### Deploy
- **Yarn**: Gerenciador de pacotes (mais seguro que npm)
- **Concurrently**: Execução simultânea de processos
- **PM2**: Gerenciador de processos para produção

## 📂 Estrutura do Projeto

```
projeto/
├── src/                          # Frontend React
│   ├── components/               # Componentes React
│   │   ├── HomeScreen.js        # Tela inicial
│   │   ├── DailyReportScreen.js
│   │   ├── TechnicalStatusScreen.js
│   │   ├── QuickModeScreen.js
│   │   ├── ManagementScreen.js
│   │   ├── MasterDataScreen.js
│   │   └── SharedFilters.js     # Filtros compartilhados
│   ├── context/
│   │   └── DataContext.js       # Gerenciamento de estado
│   ├── services/
│   │   └── api.js               # Cliente da API
│   ├── data/
│   │   └── seedData.js          # Dados iniciais (fallback)
│   ├── utils/
│   │   └── whatsappGenerator.js # Geração de mensagens
│   ├── config/
│   │   └── environment.js       # Configurações
│   ├── App.js                   # Componente principal
│   ├── index.js                # Ponto de entrada
│   └── index.css               # Estilos globais
├── backend/                     # API Node.js
│   ├── database/
│   │   ├── database.js         # Conexão e métodos do DB
│   │   ├── schema.sql          # Estrutura das tabelas
│   │   └── seedData.sql        # Dados iniciais
│   ├── server.js               # Servidor Express
│   ├── config.js               # Configurações da API
│   └── ecosystem.config.js     # Configuração PM2
├── deploy.sh                   # Script de deploy
└── README.md                   # Documentação
```

## ✅ Recursos Implementados (V2)

- **✅ Backend API**: SQLite com API REST completa
- **✅ Persistência**: Dados salvos permanentemente no banco
- **✅ Deploy Ready**: Scripts automáticos para Hostinger
- **✅ Fallback**: Funciona offline se API não estiver disponível
- **✅ Indicadores**: Status de conexão visível na interface

## 🚀 Próximas Funcionalidades (V3)

- **Autenticação**: Login e perfis de usuário
- **Relatórios Avançados**: PDFs e dashboards
- **Notificações**: Lembretes e alertas via email
- **App Mobile**: Versão nativa para iOS/Android
- **Sincronização**: Backup automático na nuvem

## 📄 Licença

Este projeto foi desenvolvido para uso interno da empresa. Todos os direitos reservados.

## 🆘 Suporte

Para suporte técnico ou dúvidas sobre o sistema:
1. Verifique este README primeiro
2. Teste as funcionalidades no modo de desenvolvimento
3. Entre em contato com a equipe de TI

---

**Versão 1.0** - Sistema de Relatórios Diários  
Desenvolvido com ❤️ para otimizar o trabalho de campo das equipes técnicas.
