# Tentacle 🐙

Backend em Node.js + Express + TypeScript para o projeto educacional **Abstractio**.

O foco inicial é manter uma API enxuta, modular e tipada, utilizando PostgreSQL (sem ORM), validação de contratos com Zod e autenticação via Firebase Admin.

## Stack e Ferramentas

- **Runtime & Linguagem:** Node.js + TypeScript
- **Framework HTTP:** Express
- **Banco de Dados:** PostgreSQL com `pg` (sem ORM, queries SQL puras)
- **Validação:** Zod (Schemas e DTOs)
- **Autenticação:** Firebase Admin SDK
- **Observabilidade:** `pino` e `pino-http`
- **Dev Tooling:** `tsx` (execução local), `Biome` (lint/format), `node-pg-migrate` (migrações)
- **Infra Local:** Docker Compose para o banco de dados

## Arquitetura do Backend

A API é organizada em módulos por domínio. O fluxo de chamadas e responsabilidades de cada endpoint é estrito, seguindo a cadeia:

```text
routes → controller → service → repository
              ↓
             dto → schema
```

### Estrutura de Diretórios

```text
src/
  app.ts            # Montagem do Express, middlewares globais e healthcheck
  server.ts         # Bootstrap da aplicação, conexão com DB e shutdown (SIGTERM/SIGINT)
  config/           # env, Firebase, logger
  db/               # Cliente do PostgreSQL, seed e dados iniciais
  modules/          # Rotas e lógica por domínio
    router.ts       # Centraliza as rotas de todos os módulos sob /api/v1
    trails/         # Endpoints de trilhas e missões
    shop/           # Endpoints da loja
    user/           # Endpoints de usuário
  shared/           # Autenticação, erros, validação (base-schema/dto) e constantes
```

### Padrão de Arquivos por Endpoint

Cada endpoint novo cria **5 arquivos** dentro da pasta do seu módulo, nomeados por `<verbo>-<recurso>`. Exceção: o `<modulo>.routes.ts` é único e acumula as rotas do módulo.

- `<verbo>-<recurso>.repository.ts` — Único que sabe SQL. Devolve linhas cruas (snake_case).
- `<verbo>-<recurso>.service.ts` — Regra de negócio.
- `<verbo>-<recurso>.controller.ts` — Traduz HTTP ↔ chamada de função.
- `<verbo>-<recurso>.dto.ts` — Mapeia snake_case → camelCase e parseia o schema.
- `<verbo>-<recurso>.schema.ts` — Define o contrato público da API com Zod.

> **Nota:** O projeto usa imports relativos diretos. Não utilizamos `index.ts` (barrel files) para evitar quebras silenciosas de compilação.

## Estrutura do Banco de Dados

O modelo abaixo resume as entidades principais do backend e como elas se relacionam.

```mermaid
flowchart LR
	FA[Firebase Auth<br/>futuro provedor de identidade]

	U[Users<br/>id<br/>name<br/>gender<br/>email<br/>birth_date]

	A[User Avatar Settings<br/>user_id<br/>avatar_idx<br/>active_frame<br/>active_accessory<br/>active_color]

	T[Trails<br/>id<br/>slug<br/>title<br/>short_title<br/>order_index]

	M[Missions<br/>id<br/>trail_id<br/>slug<br/>title<br/>emblem<br/>theory<br/>has_minigame<br/>order_index<br/>summary/bibliography/faqs jsonb]

	Q[Mission Questions<br/>id<br/>mission_id<br/>slug<br/>kind main/extra<br/>prompt<br/>explanation<br/>max_reward_shells<br/>order_index]

	O[Mission Question Options<br/>id<br/>question_id<br/>label<br/>is_correct<br/>order_index<br/>wrong_explanation]

	C[User Mission Completions<br/>user_id<br/>mission_id<br/>completed_at]

	S[User Submissions<br/>id<br/>user_id<br/>question_id<br/>answer_option_id<br/>attempt_number<br/>is_correct<br/>earned_shells<br/>idempotency_key]

	L[Shell Ledger<br/>id<br/>user_id<br/>delta<br/>reason<br/>balance_before<br/>balance_after]

	I[Shop Items<br/>id<br/>item_type<br/>code<br/>name<br/>price_shells]

	UI[User Inventory<br/>id<br/>user_id<br/>item_id<br/>acquisition_reason]

	B[Bookmarks<br/>user_id<br/>mission_id<br/>data]

	FA --> U
	U --> A
	U --> C
	U --> S
	U --> L
	U --> UI
	U --> B

	T --> M
	M --> Q
	M --> C
	Q --> O
	Q --> S
	M --> B

	I --> UI
	UI --> A
```

### Leitura rápida do modelo

- **`users`**: Guarda o perfil base. `email` é obrigatório e único; `birth_date` é opcional. Não guarda saldo de conchas — não há `shell_balance` na tabela; o saldo é sempre derivado ao vivo do `shell_ledger` (última linha, `balance_after`), nunca cacheado, pra evitar divergência entre esse valor e o histórico.
- **`user_avatar_settings`**: Concentra o visual ativo do usuário — `active_frame`/`active_accessory`/`active_color` referenciam `user_inventory`, garantindo que só é possível equipar item já possuído.
- **`trails` e `missions`**: Organizam o conteúdo pedagógico. `missions` carrega `summary`/`bibliography`/`faqs` como JSONB por serem conteúdo esparso (só ~3 das 29 missões usam cada um). Não guarda `icon` nem HTML de minigame — são decisão de apresentação, responsabilidade do front.
- **`mission_questions`** (principal ou extra, via `kind`) e **`mission_question_options`**: Armazenam a estrutura das questões. `order_index` é obrigatório porque o front valida a resposta certa pelo índice da opção, não pelo texto. `max_reward_shells` vive na pergunta, porque a principal e os extras têm curvas de recompensa diferentes.
- **`user_mission_completions`**: Registra a conclusão de uma missão separadamente das submissões (necessário porque uma missão pode ser concluída sem pergunta principal).
- **`user_submissions`**: Log de cada tentativa (uma linha por tentativa, certa ou errada). `attempt_number` decide a recompensa.
- **`shell_ledger`**: Histórico financeiro e fonte de verdade das movimentações.
- **`shop_items` e `user_inventory`**: Representam a loja e os itens desbloqueados.
- **`bookmarks`**: Salva o ponto de retomada do usuário em uma missão.

> Modelo fechado na Fase 2.1.5, validado linha a linha contra o frontend (`Abstractio`).

## Como rodar localmente

### 1) Instalar dependências

```bash
npm install
```

### 2) Subir o PostgreSQL

```bash
docker compose up -d db
```

### 3) Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz com as variáveis abaixo:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tentacle
FIREBASE_AUTH_ENABLED=true
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=seu-client-email@seu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`FIREBASE_AUTH_ENABLED=false` desliga a validação real do Firebase e troca o middleware de autenticação pelo dummy auth ([dummy-auth.middleware.ts](src/shared/auth/dummy-auth.middleware.ts)), que autentica no mesmo formato do Firebase (`Authorization: Bearer <valor>`), mas usa o valor do token diretamente como `id` do usuário, sem validar nada — útil para testar localmente sem precisar de credenciais Firebase. Nesse modo, as variáveis `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` ficam opcionais.

### 4) Rodar as migrações e popular o banco

```bash
npm run migrate:up
npm run seed
```

### 5) Iniciar o servidor

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3000`. O healthcheck está em `/health` e as rotas da API sob `/api/v1`.

## Comandos úteis

| Comando               | Descrição                                                                 |
| --------------------- | ------------------------------------------------------------------------- |
| `npm run dev`         | Inicia o servidor em modo de desenvolvimento (hot-reload com `tsx`).      |
| `npm run build`       | Compila o projeto TypeScript para JavaScript (gera a pasta `dist/`).      |
| `npm run typecheck`   | Verifica os tipos do TypeScript sem emitir arquivos.                      |
| `npm run lint`        | Roda o Biome para checar problemas de código.                             |
| `npm run check`       | Roda `typecheck` + `lint` simultaneamente.                                |
| `npm run check:fix`   | Roda o Biome aplicando correções automáticas de formatação e imports.     |
| `npm run ci`          | Comando otimizado para rodar em pipelines de CI (verificações estritas).  |
| `npm run migrate:up`  | Aplica as migrações pendentes no banco de dados.                          |
| `npm run seed`        | Popula o banco de dados com os dados iniciais (`src/db/seed-data.json`).  |
