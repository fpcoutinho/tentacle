# Guia de Deploy Independente — Tentacle (Firebase + NeonDB + Vercel)

Este guia explica passo a passo como colocar sua própria instância do **Tentacle** no ar usando suas próprias contas no **GitHub**, **NeonDB**, **Firebase** e **Vercel**, sem depender de acesso de administrador no repositório ou nos serviços originais.

---

## Visão geral do que você vai configurar

1. **GitHub** — Seu próprio repositório com o código do `tentacle` e os workflows de CI/CD.
2. **NeonDB** — Banco PostgreSQL na nuvem (schema via migrations + carga inicial via `seed`).
3. **Firebase** — Autenticação de usuários (o backend valida os tokens gerados pelo frontend **Abstractio**).
4. **Vercel** — Hospedagem serverless da API (`api/index.ts` + `vercel.json`).
5. **Conectar o Abstractio** — Apontar o frontend para o **seu** Firebase e para a **sua** URL da Vercel.

---

## Pré-requisitos locais

- [Node.js 24+](https://nodejs.org/) (mesma versão usada no CI em `.github/workflows/deploy-vercel.yml`)
- `git` e `npm`

---

## Passo 1: Criar o seu repositório no GitHub

1. Crie um repositório novo e vazio na sua conta do GitHub (ex.: `tentacle`).
2. Clone o repositório original (ou copie o código localmente) e aponte o `origin` para o seu novo repositório:

```bash
git clone https://github.com/fpcoutinho/tentacle.git
cd tentacle
git remote set-url origin https://github.com/<seu-usuario>/tentacle.git
git push -u origin main
```

3. Instale as dependências localmente para poder rodar scripts de banco e CLI:

```bash
npm install
```

---

## Passo 2: Criar o banco de dados no NeonDB

1. Crie uma conta em [neon.tech](https://neon.tech/) e crie um novo projeto (ex.: `tentacle`).
2. No painel do projeto, copie a **Connection String** do PostgreSQL (algo no formato `postgresql://usuario:senha@ep-xxx.aws.neon.tech/neondb?sslmode=require`).
   - Guarde essa URL — ela será a sua `DATABASE_URL`.
   - Mantenha `?sslmode=require` na URL: o servidor (`src/db/client.ts`) já ativa SSL automaticamente quando não é `localhost`, mas o script de seed (`src/db/seed.ts`) repassa a `DATABASE_URL` direto para o `pg`, então o parâmetro `sslmode=require` garante a conexão segura no seed.
   - O Neon oferece string **Pooled** (`-pooler` no host) e **Direct**. A **Pooled** é recomendada para `DATABASE_URL` na Vercel (`RUNTIME_MODE=serverless`). Caso o `node-pg-migrate` alguma vez falhe com erro de *advisory lock* usando a URL *pooled*, use a URL **Direct** nas migrations (`DATABASE_URL` dos secrets do GitHub).

### Rodar as migrations e o seed inicial

O banco recém-criado vem vazio. Você precisa criar as tabelas (`migrate:up`) e popular os dados iniciais de trilhas, missões e itens da loja (`seed`).

1. Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`) e preencha **temporariamente** com:

```env
NODE_ENV=development
RUNTIME_MODE=standalone
PORT=3000
DATABASE_URL=<SUA_CONNECTION_STRING_DO_NEON>
FIREBASE_AUTH_ENABLED=false
CORS_ORIGIN=http://localhost:5173
```

> **Por que `FIREBASE_AUTH_ENABLED=false` agora?**
> O script de seed importa `src/config/env.ts`, que exige as chaves do Firebase quando `FIREBASE_AUTH_ENABLED=true`. Como ainda vamos criar o Firebase no Passo 3, deixar `false` permite rodar o seed agora sem erro. (Em produção na Vercel você vai usar `true`.)

2. Execute as migrations e o seed:

```bash
npm run migrate:up
npm run seed
```

Ao final do `npm run seed`, você deve ver a contagem das tabelas populadas (`trails`, `levels`, `missions`, `mission_questions`, `mission_question_options`, `shop_items`).

> ⚠️ **Atenção:** `npm run seed` executa `TRUNCATE ... RESTART IDENTITY CASCADE` nessas tabelas. Só rode o seed novamente se quiser resetar o conteúdo base — **não rode** em um banco de produção que já tenha dados de usuários (`user_submissions`, `user_inventory`, etc.).

> 🔒 **Limpe o `.env` após o seed:** Assim que `migrate:up` e `seed` terminarem, **apague o `.env`** (ou volte o `DATABASE_URL` para `localhost`) para evitar rodar `npm run seed` ou `npm run migrate:down` por acidente contra o banco de produção no futuro.

---

## Passo 3: Configurar o Firebase (Autenticação)

O `tentacle` usa o `firebase-admin` para validar o token JWT enviado pelo frontend (`Abstractio`). **Importante:** o `tentacle` e o `Abstractio` precisam usar o **mesmo projeto Firebase**.

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um novo projeto (ex.: `abstractio`).
2. No menu lateral, vá em **Build → Authentication** e clique em **Começar** (Get started).
3. Na aba **Sign-in method**, ative os dois provedores de login que o **Abstractio** utiliza (`src/contexts/AuthContext.tsx`):
   - **E-mail/senha** (*Email/Password*)
   - **Google**
4. Em **Authentication → Settings → Authorized domains**, lembre-se de adicionar depois o domínio onde o **Abstractio** ficará hospedado em produção.
5. Agora gere a chave de serviço para o backend (`tentacle`):
   - Clique na engrenagem ao lado de **Visão geral do projeto → Configurações do projeto**.
   - Vá na aba **Contas de serviço (Service accounts)**.
   - Clique em **Gerar nova chave privada (Generate new private key)** e salve o arquivo `.json` baixado (nunca faça commit desse arquivo!).
6. Desse `.json`, você vai usar 3 campos nas variáveis de ambiente:
   - `FIREBASE_PROJECT_ID` → valor de `"project_id"`
   - `FIREBASE_CLIENT_EMAIL` → valor de `"client_email"`
   - `FIREBASE_PRIVATE_KEY` → valor de `"private_key"`

> 💡 **Também para o Abstractio:** No mesmo menu **Configurações do projeto → Geral → Seus aplicativos**, registre um app Web (`</>`) para pegar as credenciais públicas que você vai configurar no `.env` / Vercel do **Abstractio** (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID`).

---

## Passo 4: Criar o projeto na Vercel

> **Importante sobre o `vercel.json`:**
> Este repositório tem `"git": { "deploymentEnabled": false }` no arquivo `vercel.json`. Isso significa que a Vercel **não** faz deploy automático a cada `git push` — quem controla o deploy é o **GitHub Actions** (configurado no Passo 5).

1. **Mesma conta e domínio do Abstractio (recomendado):** se o `Abstractio` já está na Vercel com o domínio `abstractio.com.br`, você pode criar o projeto do `tentacle` **na mesma conta da Vercel** e usar o subdomínio `api.abstractio.com.br` para a API (sem precisar alterar código ou criar proxy no frontend). Depois de criar o projeto nos passos abaixo, basta ir em **Settings → Domains** do `tentacle` na Vercel, adicionar `api.abstractio.com.br` e criar o registro DNS (`CNAME`) conforme a Vercel instruir (o healthcheck ficará em `https://api.abstractio.com.br/health`).
2. Se ainda não tiver conta, crie uma em [vercel.com](https://vercel.com/) (pode logar com o seu GitHub); se já tiver, use a mesma conta.
3. No terminal, na raiz do projeto `tentacle`, faça login e vincule o projeto à sua conta Vercel:

```bash
npx vercel login
npx vercel link
```

- Responda às perguntas criando um novo projeto na Vercel (ex.: `tentacle`).
- Isso criará uma pasta local `.vercel/project.json` (ignorada pelo git) contendo `orgId` e `projectId`. **Guarde esses dois valores**, você vai precisar deles no Passo 5.

4. No painel da Vercel, acesse **Seu Projeto → Settings → Environment Variables** e cadastre as variáveis abaixo para o ambiente **Production**:

| Variável | Valor | Observação |
| --- | --- | --- |
| `NODE_ENV` | `production` | Ambiente de execução |
| `RUNTIME_MODE` | `serverless` | **Obrigatório na Vercel** — limita o pool do Postgres (`max: 1`) para serverless |
| `DATABASE_URL` | `postgresql://...` | Connection string **Pooled** (`-pooler`) do NeonDB |
| `FIREBASE_AUTH_ENABLED` | `true` | Ativa validação real de tokens Firebase |
| `FIREBASE_PROJECT_ID` | `seu-project-id` | Do JSON da conta de serviço |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...iam.gserviceaccount.com` | Do JSON da conta de serviço |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | Cole o valor do `private_key` do JSON **sem aspas ao redor** (na UI da Vercel, aspas entram literalmente na string) |
| `CORS_ORIGIN` | `https://abstractio.com.br` | URL de produção do frontend (se usar `www` ou outra origem, separe por vírgula: `https://abstractio.com.br,https://www.abstractio.com.br`) |

5. Ainda na Vercel, gere um Token de acesso para o GitHub Actions:
   - Clique no seu avatar → **Account Settings → Tokens** → **Create** (ex.: nome `github-actions-tentacle`).
   - Copie e guarde esse token (`VERCEL_TOKEN`).

---

## Passo 5: Configurar os Secrets no GitHub Actions

Os workflows em `.github/workflows/` automatizam testes, migrations no NeonDB e deploy na Vercel:

- **`release` (`deploy-vercel.yml`)**: roda ao publicar uma **Release** no GitHub (ou manualmente em *Actions → release → Run workflow*). Ele valida tipos/lint/testes, aplica migrations pendentes no NeonDB (`_migrate.yml`) e faz o deploy na Vercel.
- **`migrate neon` (`migrate-neon.yml`)**: aplica migrations manualmente quando necessário.
- **`rollout` (`rollout-vercel.yml`)**: faz apenas o deploy da branch `main` na Vercel manualmente (por isso mantenha `main` como branch principal do repositório).

Para que esses workflows funcionem no seu repositório:

1. No seu repositório do GitHub, vá em **Settings → Secrets and variables → Actions → New repository secret**.
2. Adicione os 4 secrets abaixo:

| Secret | Onde encontrar |
| --- | --- |
| `DATABASE_URL` | Connection string **Direct** (sem `-pooler`) do NeonDB (Passo 2) |
| `VERCEL_TOKEN` | Token criado na Vercel (Passo 4) |
| `VERCEL_ORG_ID` | Campo `orgId` dentro do arquivo `.vercel/project.json` gerado pelo `npx vercel link` |
| `VERCEL_PROJECT_ID` | Campo `projectId` dentro do arquivo `.vercel/project.json` |

*(Opcional)* Os workflows de `migrate` e `deploy` usam `environment: production`. Se quiser exigir aprovação manual antes de rodar migrations ou deploy em produção, configure isso em **Settings → Environments → production**.

---

## Passo 6: Fazer o primeiro deploy e testar

1. No GitHub, vá em **Actions → release → Run workflow** (ou crie uma Release em **Releases → Draft a new release**, ex.: tag `v1.0.0`).
2. Acompanhe a execução dos jobs (`verify` → `migrate` → `deploy`).
   - Como você já rodou `npm run migrate:up` no Passo 2, o job `migrate` vai detectar que não há migrations pendentes e pular direto para o `deploy`.
3. Ao finalizar o job `deploy`, pegue a URL de produção no painel da Vercel (ex.: `https://tentacle-seu-usuario.vercel.app`).
4. Teste o healthcheck no navegador ou via terminal:

```bash
curl https://tentacle-seu-usuario.vercel.app/health
```

Resposta esperada:

```json
{"status":"ok"}
```

---

## Passo 7: Conectar o frontend (Abstractio)

Para que o **Abstractio** ([repositório](https://github.com/Gpcoutinho/Abstractio)) converse com o seu novo backend:

1. No painel de variáveis de ambiente do **Abstractio** (conforme o `.env.example` dele), configure:
   - `VITE_API_BASE_URL=https://api.abstractio.com.br` (ou a URL `*.vercel.app` do `tentacle`, sempre apenas a URL base, **sem** `/api/v1` e sem barra no final)
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   *(todas vindas do App Web do **mesmo projeto Firebase** criado no Passo 3)*
2. Garanta que o domínio de produção do **Abstractio** esteja exatamente igual ao valor de `CORS_ORIGIN` configurado na Vercel do `tentacle` (Passo 4) e listado em **Authorized domains** no Firebase Authentication (Passo 3).

---

## Resumo de problemas comuns

- **Erro de CORS no navegador ao chamar a API:** confira se `CORS_ORIGIN` na Vercel contém a URL exata do Abstractio (incluindo `https://` e sem `/` no final).
- **Erro `401 Unauthorized` em todas as rotas `/api/v1/*`:** verifique se o `Abstractio` está usando o **mesmo** projeto Firebase do `tentacle` e se `FIREBASE_PRIVATE_KEY` foi colada corretamente na Vercel (o código faz `.replace(/\\n/g, '\n')`, então tanto `\n` literal quanto quebra de linha real funcionam).
- **Deploy não acontece ao dar `git push`:** comportamento esperado por causa de `"git": { "deploymentEnabled": false }` no `vercel.json`. Crie uma **Release** no GitHub ou dispare o workflow `release` / `rollout` manualmente na aba **Actions**.
