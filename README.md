# Inglês Fácil — Prática Diária para Brasileiros 🇬🇧🇧🇷

Aplicativo web responsivo desenvolvido para **adultos brasileiros iniciantes em inglês** e seus amigos, com foco em situações práticas de viagem (**Aeroporto**, **Hotel** e **Restaurante**), atividades curtas de **5 a 10 minutos por dia**, áudio claro com velocidade ajustável e escrita guiada com correções pedagógicas em português.

---

## 🖥️ Layout e Responsividade

- **No Computador (Desktop):** Menu lateral fixo (*Sidebar*) estilizado com alto contraste, navegação direta entre as seções, indicação visual de revisões pendentes, perfil ativo e atalhos de sessão.
- **No Celular (Mobile):** Header compacto com alternador rápido de perfil e **Barra de Navegação Inferior (*Bottom Navigation Bar*)** com botões ergonômicos (mínimo de 48px de área de toque) para fácil utilização com o polegar.
- **Acessibilidade e Estilo:** Cores azul oceano (`#0f4c81`) e verde esmeralda (`#0d826a`), tipografia moderna (Google Fonts *Inter* e *Outfit*), foco visível para navegação por teclado (`:focus-visible`), botões grandes e feedback sonoro discreto via Web Audio API.

---

## 🚀 Funcionalidades Entregues

### 1. Telas e Navegação
- **Login:** E-mail, senha com alternador de visibilidade (mostrar/ocultar senha), link para recuperação de acesso e atalhos rápidos de demonstração.
- **Cadastro:** Nome completo, e-mail, senha (mínimo 6 dígitos) e confirmação. **Garantia de segurança:** Cadastros públicos recebem obrigatoriamente o perfil **Aluno**.
- **Recuperação de Acesso:** Formulário documentado para envio de link seguro com token temporário de redefinição.
- **Painel do Aluno (Dashboard):**
  - Saudação personalizada pelo nome conforme o horário do dia (*Bom dia, Boa tarde, Boa noite*).
  - Card da **Atividade Recomendada do Dia** com botão grande **"Começar prática"**.
  - Meta diária de 5 a 10 minutos com barra de progresso em tempo real.
  - Card de **Revisões Pendentes** com contador de frases a reforçar.
  - Card de **Lembrete Configurado** com indicação do horário e fuso local.
  - Acesso direto aos temas de viagem (Aeroporto, Hotel e Restaurante).
- **Catálogo de 12 Atividades Iniciais:**
  - Filtros por modalidade: **Áudio & Escuta**, **Escrita & Tradução** ou **Todas**.
  - Filtros por tema: **Aeroporto (4)**, **Hotel (4)** e **Restaurante (4)**.
  - Badges de nível (Iniciante), tempo estimado e **estado de conclusão com nota real obtida**.
- **Player de Atividades Interativo:**
  - **Compreensão Auditiva (*Listening Choice*):** Botão para ouvir a frase em inglês com velocidade normal (1.0x) ou devagar (0.75x) e seleção de significado em português.
  - **Ditado (*Dictation*):** Escuta da frase e digitação em inglês com normalização de pontuação e tolerância a pequenos erros de digitação.
  - **Prática Oral (*Oral Practice*):** Reprodução da frase modelo e gravação de voz sob demanda (solicita microfone apenas ao clicar no botão). Inclui player para o aluno escutar sua própria voz, botão de exclusão imediata e esclarecimento didático sobre autopercepção da pronúncia.
  - **Completar Lacunas (*Fill in the Blanks*):** Preenchimento de palavras-chave no contexto.
  - **Organização de Palavras (*Word Reorder*):** Banco de palavras clicáveis que sobem para a área da frase e podem ser reorganizadas.
  - **Tradução (*Translation*):** Português para inglês com aceitação de contrações naturais (*I'd like* / *I would like*).
  - **Resposta a Situações (*Situational Response*):** Diálogos como pedir água sem gás ou a conta, comparando a resposta com o modelo recomendado.
  - Feedback imediato pós-submissão com explicações pedagógicas em português e tela final com nota percentual e resumo das respostas.
- **Revisão Espaçada (1, 3 e 7 dias):**
  - Frases e palavras com erro entram automaticamente na fila de revisão.
  - Acertos aumentam o intervalo (1 → 3 → 7 dias). Erros trazem de volta para 1 dia.
  - Praticar a revisão **não apaga o histórico de tentativas passadas** do aluno.
- **Meu Progresso:**
  - Métricas calculadas em tempo real com base nos dados reais do usuário: minutos praticados, atividades concluídas, taxa de acerto global e comparativo de desempenho em Áudio vs Escrita.
  - Histórico pessoal detalhado com data/hora no fuso local configurado e expansão para rever cada resposta.
- **Configurações:**
  - Edição do nome, meta diária (5, 7, 10 ou 15 min), ativação de lembretes, horário, dias da semana, fuso horário editável (`America/Sao_Paulo` por padrão) e teste da síntese de voz.
- **Painel Administrativo (Exclusivo para Administrador):**
  - Proteção de acesso: bloqueio com tela de "Acesso Restrito" se um aluno tentar acessar.
  - **Aba Usuários:** Busca por nome/e-mail, badges de papel e status, botão de ativar/desativar com **proteção estrita contra a desativação do último administrador ativo**.
  - **Aba Atividades:** Catálogo completo com botão de publicar/despublicar com um clique e modal para criar/editar atividades e questões (com versionamento imutável).

---

## 🧪 Modo Demonstração Interativo

O aplicativo conta com uma barra superior fixa que identifica de forma clara o **Modo Demonstração**:
- **Carlos Silva (Aluno):** Permite testar a experiência do estudante, resolver exercícios, acumular progresso e visualizar suas revisões.
- **Prof.ª Helena Costa (Administradora):** Permite acessar o Painel Administrativo, publicar/despublicar atividades, editar conteúdos e gerenciar usuários.
- **Visitante (Deslogado):** Permite testar as telas de Login, Cadastro público e Recuperação de Senha.
- **Botão "Restaurar Demonstração":** Reseta o armazenamento local (`localStorage`) para os dados de fábrica a qualquer momento.

---

## 🛠️ Instalação e Execução Local

### Pré-requisitos
- Node.js 18+ (recomendado Node 20 ou 24)
- npm 9+

### Passos de Execução
```bash
# 1. Instalar dependências
npm install

# 2. Executar em modo desenvolvimento
npm run dev

# 3. Executar os testes automatizados (regras de correção, segurança e repetição espaçada)
npm test

# 4. Validar build de produção
npm run build
```

---

## 🗄️ Banco de Dados e Segurança de Produção

Para conectar a um banco relacional em produção (ex: **Supabase** / **PostgreSQL**):

1. **Esquema e RLS (`database/schema.sql`):**
   - Execute o script `database/schema.sql` no SQL Editor do seu PostgreSQL/Supabase.
   - Ele cria as tabelas com tipos ENUM, vincula perfis ao `auth.users`, ativa **Row Level Security (RLS)** em todas as tabelas e adiciona o trigger `prevent_last_active_admin_removal()`.
2. **Criação Segura do Primeiro Administrador (`database/bootstrap-admin.sql`):**
   - Cadastre uma conta normalmente via aplicativo ou painel com senha forte.
   - Em seguida, execute o script `database/bootstrap-admin.sql` passando o e-mail cadastrado para promovê-lo a `admin`.
   - **Nenhuma senha em texto puro é mantida no código-fonte.**
3. **Variáveis de Ambiente:**
   - Copie `.env.example` para `.env.local` e preencha as credenciais do seu provedor.

---

## ⚠️ Limitações Atuais e Próximos Passos

1. **Síntese de Voz:** Utiliza a Web Speech API (`SpeechSynthesis`) nativa do navegador do usuário. Em navegadores ou sistemas sem voz em inglês instalada, é exibido o texto da frase como apoio visual. Para produção com vozes humanas ultra-realistas, a camada de áudio (`AudioService`) já está isolada para integração futura com ElevenLabs ou Azure Cognitive Services.
2. **Gravação de Áudio:** O microfone utiliza a `MediaRecorder` API local. Os áudios gravados ficam apenas na memória temporária do navegador do aluno para autoavaliação da fala, sem persistência remota por padrão.
3. **Notificações com Aplicativo Fechado:** Lembretes funcionam dentro do aplicativo com base no horário e fuso configurado (`America/Sao_Paulo`). O envio de notificações com a aba/app fechado requer configuração de Service Worker e servidor Web Push externo, ativado apenas após consentimento expresso do usuário.
