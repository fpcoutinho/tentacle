```markdown
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

**INSTRUÇÃO CRÍTICA:** Sempre que for criar um endpoint novo, refatorar um módulo existente, ou criar uma rota nova, você **DEVE** consultar e seguir rigorosamente a skill **`create-or-refactor-module`**. 

A skill contém os templates exatos de cada camada, as convenções de nome e export, as regras de ouro para evitar bugs silenciosos (como o uso do Zod e mapeamento snake_case/camelCase) e o fluxo de verificação obrigatório. Não improvise a estrutura de arquivos; use a skill como fonte da verdade.

Como referência base, os arquivos por endpoint seguem o padrão de nomenclatura:
- `<verbo>-<recurso>.controller.ts`
- `<verbo>-<recurso>.service.ts`
- `<verbo>-<recurso>.repository.ts`
- `<verbo>-<recurso>.dto.ts`
- `<verbo>-<recurso>.schema.ts`

*(Exceção: o arquivo de rotas do módulo é único e chama-se `<módulo>.routes.ts`)*. Para novos endpoints, siga o fluxo de módulo já existente em `src/modules/trails` como exemplo base.

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
- O middleware popula `req.user`. Use `AuthenticatedRequest` no controller quando precisar do UID.

## Banco de Dados e Execução

O cliente do PostgreSQL fica em `src/db/client.ts`. O projeto usa `node-pg-migrate` e o banco local pode ser iniciado via Docker Compose. O modelo de dados foca em trilhas, missões, perguntas, submissões, inventário, loja, conchas e bookmarks.

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
npm run ci
```

### Variáveis de Ambiente Esperadas

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tentacle
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=seu-client-email@seu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Tratamento de Erros

- **Erros esperados de negócio** (404, 409, etc.): Use `throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mensagem')`.
- **ZodError:** Vira 400 `validation_error` automaticamente pelo `errorHandlerMiddleware`.
- **Erros inesperados:** Viram 500 genérico, com stack no log e mensagem neutra para o cliente (nunca vaze detalhes internos).
- **Códigos padronizados:** `validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`.

## Regras Importantes para Alterações (Diretrizes para IA)

1. **Não sobrescreva arquivos compartilhados.** Ao adicionar endpoints a um módulo existente, faça *append* no `<modulo>.routes.ts` existente. Não recrie o arquivo.
2. **Não invente abstrações novas** sem necessidade explícita. Preserve o padrão existente.
3. **Escopo restrito:** Não crie testes, migrations, Swagger/OpenAPI ou auxiliares novos sem necessidade explícita. Faça mudanças pequenas e locais.
4. **Scripts de teste descartáveis** vão em `plan/` (já no `.gitignore`), nunca na raiz do projeto.
5. **Validação obrigatória:** Sempre rode `npm run check` após alterações relevantes no código.
6. **Comunicação:** Se houver dúvida sobre regra de negócio, contrato ou schema, pare e pergunte antes de improvisar.
7. **Base de referência:** Para novos endpoints, siga o fluxo de módulo já existente em `src/modules/trails` como exemplo base.
 com stack no log e mensagem neutra para o cliente.
- **Códigos padronizados:** `validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`.
