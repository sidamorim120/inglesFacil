# Estado do Projeto — Inglês Fácil

Atualizado em 01/10/2026. Último commit em produção: `7ce45b7`.

## Regras de trabalho
- **Git:** commit e push só quando o Sidney mandar explicitamente. Cada push no `main` publica automaticamente no Netlify.
- **Testes:** sempre em localhost (`npm run dev` → http://localhost:5173).
  - Atenção: o `.env.local` aponta para o Supabase de produção. Testar logado em localhost grava dados reais.
  - Para testar sem tocar no banco (modo demo): `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npm run dev`

## Começar em outro computador
1. Clonar o repositório: `git clone git@github.com:sidamorim120/inglesFacil.git`
   - A chave SSH do GitHub precisa estar configurada nesse computador.
   - Sem SSH, use HTTPS: `git clone https://github.com/sidamorim120/inglesFacil.git`
2. Instalar o Node 20 ou superior e rodar `npm install`.
3. Criar o arquivo `.env.local` na raiz. Ele **não vai pelo git**; copie os valores do painel do Supabase ou do Netlify:
   ```
   VITE_APP_MODE=production
   VITE_SUPABASE_URL=https://oyqzydyunaenedqxthab.supabase.co
   VITE_SUPABASE_ANON_KEY=<chave anon do Supabase: Project Settings → API>
   VITE_DEFAULT_TIMEZONE=America/Sao_Paulo
   VITE_APP_NAME="Inglês Fácil"
   ```
4. `npm run dev` e abrir http://localhost:5173.
5. Só se for gerar áudios novos: `pip install edge-tts`.
6. A memória do Claude é por computador. No computador novo, peça ao Claude para ler este arquivo antes de começar.

## Infraestrutura
- **Banco:** Supabase (projeto `oyqzydyunaenedqxthab`), com Auth + RLS.
- **Site:** Netlify (https://inglesfacill.netlify.app), com deploy automático a cada push no `main`. As variáveis `VITE_*` estão no painel do Netlify.
- **Admins:** sid.amorim1@gmail.com e luciano.chagas.lc@gmail.com.
- **Comandos:** `npm run dev` | `npm test` | `npm run build` | `npm run lint`

## O que está pronto
- **Login e dados por usuário:** cada usuário tem login próprio pelo Supabase, e os resultados, revisões, progresso e configurações dele ficam no banco.
- **Camada de dados:** `src/services/dataService.ts` usa o Supabase em produção e o DemoStore sem chaves.
- **Progresso:** métricas reais e repetição espaçada (1 → 3 → 7 dias) em `src/services/progress/progressRules.ts`, com testes.
- **Senha:** "Esqueci a senha" envia e-mail de verdade, e existe a tela de nova senha.
- **Admin:** usuários reais, publicar, ocultar e editar atividades. As tabelas viram cartões no celular.
- **Celular:** layout testado com 375px, sem rolagem lateral.
- **Conteúdo:** 12 atividades e 24 questões (aeroporto, hotel e restaurante).
  - O seed é gerado por `node scripts/generate-seed.mjs` a partir de `src/services/storage/initialData.ts`.
  - Depois de gerar, rodar `database/seed.sql` no SQL Editor do Supabase. Ele não duplica nada.
- **Áudio com voz neural:**
  - As frases tocam a partir de MP3s em `public/audio/`, publicados com o site. A voz do navegador não é mais usada.
  - A voz é `en-US-AvaNeural` (Microsoft, americana), gerada pelo **edge-tts**, gratuito e sem chave. É o mesmo serviço do projeto comunicafacil.
  - Cada frase tem versão normal e lenta (`-slow.mp3`, -25%), usada no botão "Ouvir devagar".
  - Para gerar os áudios depois de mudar o conteúdo: `node scripts/generate-audio.mjs`. Ele gera só o que falta e remove o que sobrar.
  - Para trocar a voz: `TTS_VOICE=en-US-AndrewNeural node scripts/generate-audio.mjs`
  - O edge-tts é não oficial e pode parar. Os MP3s já gerados continuam funcionando. Se o app virar produto pago, gerar a mesma voz pelo Azure Speech oficial.
  - Uma frase sem MP3 mostra o texto como apoio e não toca voz.

## Pendências
- [ ] Rodar `database/seed.sql` de novo no Supabase, se ainda não rodou depois de 01/10. Isso remove "I have two bags" das respostas aceitas.
- [ ] Supabase → Authentication → URL Configuration: colocar `https://inglesfacill.netlify.app` em Site URL e em Redirect URLs. Sem isso, o link de redefinição de senha não volta para o site.
- [ ] Decidir se remove o aviso técnico "Lembrete no Aplicativo: … Service Worker e Web Push …" em Configurações.
- [ ] Testar no site publicado: login, uma atividade e o resultado visto em outro aparelho, Admin → Usuários e a voz.
- [ ] Selo "Powered by Netlify": vem do Netlify, não do código. Ver no painel se dá para desligar.

## Níveis de estudo (feito em 05/10, ainda sem commit)
Níveis: **Básico 1, Básico 2, Básico 3, Intermediário e Avançado**.
- **Regra:** o aluno avança sozinho. Passa de nível ao tirar nota ≥ 70% em todas as atividades publicadas do nível (vale a melhor nota). Um nível sem atividades segura o aluno até ter conteúdo.
- **Admin:** em Admin → Usuários, "Nível liberado" adianta um aluno (coluna `profiles.min_level`). O aluno não consegue mudar o próprio nível (política RLS).
- **Acesso:** o aluno vê todos os níveis. Os níveis acima do dele aparecem com cadeado. O admin vê e faz tudo.
- **Sem teste de nivelamento** por enquanto.
- **Conteúdo atual:** as 12 atividades ficaram no Básico 1.
- **Código:** a regra fica em `src/services/progress/levelRules.ts` (com testes).
- **Banco:** antes ou junto do push, rodar `database/migrate-levels-and-themes.sql` no SQL Editor do Supabase. Depois rodar o `database/seed.sql` novo. O código novo e o banco antigo não funcionam juntos, e o contrário também não.

## Conteúdo dos livros (feito em 05/10, ainda sem commit)
Fonte: os PDFs em `docs/PDF - curso`. Eles são escaneados (imagem), sem texto selecionável.
- **Connectivity 1** (Pearson), livro do aluno e 2 cópias do workbook: 10 unidades.
- **Basic Grammar in Use** (Cambridge): 113 unidades de gramática.
- **Direitos autorais:** os livros são comerciais. Eles servem só de roteiro. Todas as frases e exercícios do app são próprios.

**Temas:** as categorias agora são uma por unidade do Connectivity. A lista fica em `src/services/categories.ts`:
- Apresentações, Eventos e Lugares, Habilidades e Sentimentos, Pessoas e Família, Comida e Restaurantes;
- Tecnologia, Viagens, Compras, Saúde e Exercícios, Planos e Objetivos.
- Os temas antigos mudaram: aeroporto e hotel viraram **Viagens**, e restaurante virou **Comida e Restaurantes**.

**Estrutura (baseada em referências internacionais):**
- Níveis no Quadro Europeu (CEFR): Básico 1 = A1, Básico 2 = A2, Básico 3 = A2+, Intermediário = B1, Avançado = B2.
  - O Connectivity 1 é feito para quem já viu um pouco de inglês (A1 a A2). O Basic Grammar in Use cobre do A1 ao B1.
- Cada unidade do Connectivity tem:
  - 4 lições de 7 questões, uma por objetivo de comunicação do livro;
  - 1 revisão de 10 questões.
- Por que repetir: uma palavra precisa de 8 a 10 encontros espaçados para ser aprendida. Por isso o vocabulário volta na revisão e na fila de repetição espaçada.
- Lições curtas de 5 a 8 minutos, no estilo do Duolingo (cerca de 15 exercícios curtos por lição). O nosso exercício é maior, então 7 questões.
- Referência de carga horária (Cambridge): A2 ≈ 180–200 h e B1 ≈ 350–400 h no total. O app é um complemento de prática diária, não substitui essas horas.

**Atividades:** são 84 no total, com 558 questões, todas em `src/services/storage/initialData.ts`.

| Nível | Base | Atividades |
|---|---|---|
| Básico 1 (A1) | 12 antigas de viagem e restaurante + Connectivity U1–3 | 27 |
| Básico 2 (A2) | Connectivity U4–6 | 15 |
| Básico 3 (A2+) | Connectivity U7–10 | 20 |
| Intermediário (B1) | Basic Grammar in Use: past continuous, used to, present perfect, passiva, futuro, might/must, condicionais, discurso indireto, -ing/to, relativas, too/enough, advérbios, perguntas indiretas, so/neither, phrasal verbs, obrigações, preposições, pronomes, artigos e determinantes | 22 |
| Avançado (B2) | sem material ainda | 0 |

- Gerador do conteúdo: os textos ficam em especificações Python que geram o TypeScript. Isso foi feito só nesta sessão e ficou na pasta temporária. Para editar uma questão, mexa direto no `initialData.ts`.
- O teste `initialData.test.ts` confere todas as questões: IDs únicos, alternativa correta e se as respostas aceitas são corrigidas como certas.
- O seed e os áudios já foram regenerados.

**Para publicar:**
1. Rodar `database/migrate-levels-and-themes.sql` no Supabase.
2. Rodar `database/seed.sql`.
3. Fazer o push.

Os três passos precisam ser feitos juntos.

**Próximo:** o Sidney vai enviar mais material, principalmente para o Intermediário e o Avançado.

## Limitações conhecidas
- Uma atividade nova criada no admin nasce com uma única questão padrão; ainda não existe editor de questões.
- A gravação de voz da prática oral fica só no aparelho e não é salva no banco.
- A pasta `scratch/` (só no computador original) tem a senha do admin em texto. Nunca fazer commit dela.
