# Tentacle Backend (Abstractio)

Backend do projeto educacional Abstractio. API REST em Node.js com TypeScript e Express, focada em manter uma arquitetura enxuta, modular e validada.

## Stack Principal

- **Runtime:** Node.js
- **Linguagem:** TypeScript
- **Framework HTTP:** Express
- **Banco de Dados:** PostgreSQL via `pg` (sem ORM)
- **Validação:** Zod
- **Autenticação:** Firebase Admin SDK
- **Logging:** pino + pino-http
- **Ferramentas:** tsx, Biome, node-pg-migrate
- **Infra Local:** Docker Compose

## Estrutura do Repositório

```text
├── package.json
├── docker-compose.yml
├── tsconfig.json
├── biome.json
├── migrations/               # Migrações SQL
├── plan/                     # Scripts de teste descartáveis (gitignored)
├── src/
│   ├── app.ts                # Montagem do Express, middlewares globais, healthcheck
│   ├── server.ts             # Bootstrap, conexão com banco e shutdown (SIGTERM/SIGINT)
│   ├── config/
│   │   ├── env.ts            # Validação de variáveis de ambiente
│   │   ├── firebase.ts       # Configuração do Firebase Admin
│   │   └── logger.ts         # Logger pino
│   ├── db/
│   │   ├── client.ts         # Cliente PostgreSQL (pool)
│   │   ├── seed.ts           # Script de seed
│   │   └── seed-data.json    # Dados iniciais
│   ├── modules/
│   │   ├── router.ts         # Centraliza as rotas por módulo
│   │   ├── trails/           # Endpoints de trilhas e missões
│   │   ├── shop/             # Endpoints da loja
│   │   └── user/             # Endpoints de usuário
│   │       ├── user.routes.ts       # um por módulo, acumulativo
│   │       ├── user.repository.ts   # opcional: SQL compartilhado no módulo
│   │       └── get-user-profile/    # uma subpasta por endpoint (5 arquivos)
│   └── shared/
│       ├── auth/             # Autenticação e tipos (auth.middleware, firebase-auth)
│       ├── error/            # Tratamento de erros (APIError, errorHandler)
│       ├── validation/       # Schemas e DTOs base (base-schema, base-dto)
│       └── constants.ts      # Status HTTP padronizados
```

## Arquitetura e Padrões

A aplicação segue um padrão modular por domínio. O fluxo de chamadas e responsabilidades é estrito:

`routes → controller → service → repository`
`controller → dto → schema`

- **repository:** Único ponto que conhece SQL/Postgres. Devolve linhas cruas (snake_case).
- **service:** Concentra a regra de negócio. Sempre existe, mesmo que apenas repasse dados.
- **controller:** Traduz HTTP ↔ chamada de função. Não sabe SQL, não decide regra.
- **dto / schema:** Validam entrada/saída e mapeiam snake_case ↔ camelCase.

### Padrão de Arquivos por Endpoint

**INSTRUÇÃO CRÍTICA:** Para criar endpoint novo, criar módulo novo ou refatorar módulo existente, carregue a skill **`create-or-refactor-module`** e siga-a. Ela é a fonte da verdade de estrutura, templates e armadilhas — não improvise nem reconstrua o padrão de memória a partir deste resumo.

Resumo de orientação (o detalhe está na skill): cada endpoint mora na própria subpasta `src/modules/<módulo>/<verbo>-<recurso>/`, com 5 arquivos — `.controller.ts`, `.service.ts`, `.repository.ts`, `.dto.ts`, `.schema.ts`. O arquivo de rotas é único por módulo, fica na raiz do módulo e chama-se `<módulo>.routes.ts`.

## Convenções de Código

- **Exports:** `schema`, `dto`, `service` devem ser exportados em minúsculas. O `controller` exporta uma função nomeada (ex: `getTrails`). O `repository` exporta funções e tipos de linha.
- **Status HTTP:** Use sempre `HTTP_STATUS` de `src/shared/constants.ts`. Nunca use números mágicos.
- **Banco de Dados:** O banco usa `snake_case` e a API pública usa `camelCase`. O mapeamento é feito no DTO.
- **Imports:** Use apenas imports relativos diretos. **Não use barrel files** (`index.ts` agregadores).
- **Estilo Biome:** Aspas simples, sem ponto e vírgula, indentação de 2 espaços, largura 100, sem trailing comma. Rode `npm run check:fix` para normalizar.

## Autenticação

- As rotas atuais são autenticadas via middleware global em `/api/v1`.
- O middleware está em `src/shared/auth/auth.middleware.ts` (implementado via Firebase Admin em `src/shared/auth/firebase-auth.middleware.ts`).
- O token deve vir no header: `Authorization: Bearer <token>`.
- O middleware popula `req.user`, mas o tipo (`src/shared/auth/express.d.ts`) é sempre `AuthUser | undefined`, mesmo em rota autenticada. Quando o controller precisar do UID, faça a checagem inline: `if (!req.user) throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', '...')`. **Não existe e não deve ser criado um tipo `AuthenticatedRequest`** — seria garantia de compilação sem checagem real.

## Banco de Dados e Execução

O cliente do PostgreSQL fica em `src/db/client.ts`. O projeto usa `node-pg-migrate` e o banco local pode ser iniciado via Docker Compose. O modelo de dados foca em trilhas, níveis, missões, perguntas, submissões, inventário, loja, conchas e bookmarks.

### Comandos Locais

```bash
# Instalar dependências
npm install

# Subir o banco local
docker compose up -d db

# Rodar migrações
npm run migrate:up

# Popular seed
npm run seed

# Modo desenvolvimento
npm run dev

# Validação (typecheck + Biome)
npm run check
npm run check:fix
npm run build
npm run typecheck
npm run lint
npm run typecheck-and-lint
```

### Variáveis de Ambiente Esperadas

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tentacle
FIREBASE_AUTH_ENABLED=true
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=seu-client-email@seu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Tratamento de Erros

- **Erros esperados de negócio** (404, 409, etc.): Use `throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mensagem')`.
- **ZodError:** Vira 400 `validation_error` automaticamente pelo `errorHandlerMiddleware`.
- **Erros inesperados:** Viram 500 genérico, com stack no log e mensagem neutra para o cliente (nunca vaze detalhes internos).
- **Códigos padronizados:** `validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`.

## Idempotência

- Hoje só `create-mission-submission` exige `Idempotency-Key` (header opcional, dedup por `(user_id, idempotency_key)` em `user_submissions`). Não é convenção aplicada a todo endpoint de criação — é caso a caso, pelo critério abaixo.
- **Motivo:** `user_submissions` é append-only e reenviar uma resposta errada é comportamento válido do sistema. Sem a key, um retry de rede grava uma tentativa fantasma e incrementa `attempt_number`, degradando silenciosamente a recompensa da tentativa seguinte na curva de conchas (ex: 8 → 4) sem lançar nenhum erro.
- **Regra para novos endpoints:** exigir `Idempotency-Key` sempre que um retry puder avançar um contador ou inserir linha numa tabela append-only sem constraint de unicidade que bloqueie o duplicado. No schema atual, isso vale principalmente para escritas diretas em `shell_ledger` que não passem por uma validação de estado final já protegida por `UNIQUE` (ex: `user_inventory` bloqueando recompra do mesmo item, `user_mission_completions` com `ON CONFLICT DO UPDATE`).
- **Não precisa** quando `UNIQUE`/`ON CONFLICT` já garante que reenviar o mesmo request produz o mesmo resultado — é o caso de `purchase-shop-item`, `upsert-mission-bookmark` e `create-mission-completion`.

## Regras Importantes para Alterações (Diretrizes para IA)

1. **Não sobrescreva arquivos compartilhados.** Ao adicionar endpoints a um módulo existente, faça *append* no `<modulo>.routes.ts` existente. Não recrie o arquivo.
2. **Não invente abstrações novas** sem necessidade explícita. Preserve o padrão existente.
3. **Escopo restrito:** Não crie testes, migrations, Swagger/OpenAPI ou auxiliares novos sem necessidade explícita. Faça mudanças pequenas e locais.
4. **Scripts de teste descartáveis** vão em `plan/` (já no `.gitignore`), nunca na raiz do projeto.
5. **Validação obrigatória:** Sempre rode `npm run check` após alterações relevantes no código.
6. **Comunicação:** Se houver dúvida sobre regra de negócio, contrato ou schema, pare e pergunte antes de improvisar.
7. **Base de referência:** Para novos endpoints, use `src/modules/trails` como exemplo do fluxo já consolidado.
8. **Não teste de ponta a ponta por conta própria.** `npm run check` é a verificação padrão e suficiente. Não suba `npm run dev`, não escreva script em `plan/` e não chame a API via curl a menos que o usuário peça explicitamente — isso queima tokens em algo trivial para o engenheiro.
9. **Teste nunca guia o código de produção — é o contrário.** Ao escrever ou corrigir testes, nunca altere um arquivo de produção (`controller`, `service`, `repository`, `dto`, `schema`, `shared/*` etc.) só para fazer um teste passar. O teste existe para validar o comportamento real do código; se um teste falha, o problema está no teste (setup incorreto, mock errado, expectativa errada) até prova em contrário — é o teste que deve se desdobrar para se adequar ao código, nunca o inverso.
   - **Exceção:** se a investigação revelar um bug genuíno de produção — não uma dificuldade de testar, mas um comportamento incorreto de verdade — pare e avise explicitamente antes de tocar no arquivo, explicando qual é o bug e por que a correção é necessária independente do teste. Nunca faça esse ajuste em silêncio dentro de uma tarefa de "adicionar testes".
   - **Sinais de alerta** (pare e reconsidere o teste, não o código): adicionar parâmetro/export/seam só para facilitar mock; mudar assinatura de função ou remover encapsulamento sem razão funcional; suavizar validação, try/catch ou branch de erro porque o teste não sabia lidar com ela.
