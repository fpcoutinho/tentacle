---
name: create-or-refactor-module
description: Cria ou refatora módulos e endpoints no backend tentacle (Node/TS/Express/pg sem ORM, Zod). Use SEMPRE que for criar um endpoint novo, criar um módulo novo, ou refatorar um módulo existente — inclusive em pedidos como "cria o endpoint de perfil", "faz o GET de missões", "adiciona rota de compra", "precisa de um POST pra submeter". Vale também quando o pedido não usa essas palavras mas implica um endpoint novo, ex.: "adiciona um campo de bio no perfil do usuário", "quero listar os itens que o usuário já comprou", "preciso marcar uma missão como favorita".
---

# Módulos do tentacle

Padrão de referência: `src/modules/trails` (ex.: `GET /api/v1/trails`). Siga-o para qualquer endpoint novo; se algo aqui não encaixar no caso concreto, diga isso explicitamente ao usuário em vez de improvisar em silêncio — divergir do padrão deve ser uma escolha consciente, não um acidente.

## Modos de Ativação

Antes de gerar código, identifique qual dos 3 modos abaixo se aplica ao pedido do usuário:

### Modo 1: Criar um módulo novo do zero
- Crie a pasta `src/modules/<novo-modulo>/`.
- Crie o arquivo `<novo-modulo>.routes.ts` contendo a instância do `Router` e a rota inicial.
- **Registre o novo módulo:** Adicione o `import` e o `modulesRouter.use('/<novo-modulo>', novoModuloRouter)` no arquivo `src/modules/router.ts`.

### Modo 2: Adicionar feature (endpoint) em módulo existente
- **NÃO crie um novo arquivo de rotas** e **NÃO altere `src/modules/router.ts`**.
- Crie a subpasta `src/modules/<módulo>/<verbo>-<recurso>/` e dentro dela os 5 arquivos do novo endpoint (`<verbo>-<recurso>.*`). Cada endpoint tem sua própria pasta — não crie arquivos soltos na raiz do módulo.
- Faça um *append* no `<modulo>.routes.ts` existente: adicione o `import` da nova controller no topo e a nova chamada de rota (ex: `trailsRouter.post('/', createTrail)`) no final. Nunca sobrescreva as rotas existentes.

### Modo 3: Refatorar feature existente para o padrão
- Leia os arquivos atuais do endpoint.
- Compare com os templates abaixo. Ajuste a nomenclatura de arquivos (se necessário), separe as camadas corretamente (SQL no repo, regras no service, mapeamento no dto, validação no schema), e garanta que o endpoint viva em sua própria subpasta (`src/modules/<módulo>/<verbo>-<recurso>/`) — se ainda estiver solto na raiz do módulo, mova para a subpasta.
- Ao mover arquivo de endpoint para dentro de uma subpasta, ajuste a profundidade dos imports relativos: um `../../` que apontava pra `shared/`, `db/` etc. a partir da raiz do módulo vira `../../../` a partir da subpasta; imports pra `<módulo>.helpers.ts`/`<módulo>.constants.ts` (que ficam na raiz do módulo) viram `../<módulo>.helpers.ts`; imports pra outro endpoint do mesmo módulo viram `../<outro-endpoint>/<outro-endpoint>.repository.ts`.
- Garanta que o arquivo `<modulo>.routes.ts` não perca nenhuma rota durante a refatoração, e que seus imports apontem para o novo caminho com subpasta.
- Rode `npm run check:fix` ao final para garantir que os tipos e a formatação batem.

## Como usar

- No modo automático, seja direto: não invente arquivos, não amplie escopo sem pedido e não crie testes, migrations, Swagger/OpenAPI ou auxiliares não solicitados.
- Se houver incerteza real sobre regra de negócio, contrato ou tabela, pare e avise o usuário em vez de improvisar.
- O comentário com caminho de arquivo no topo de blocos de código é opcional e serve só como auxílio no modo plan; não é exigência do modo automático.

## Estrutura de arquivos

```
src/modules/<módulo>/
  <módulo>.routes.ts               # UM por módulo — agrega todos os endpoints
  <módulo>.repository.ts           # opcional, na raiz — SQL compartilhado por 2+ endpoints do módulo
  <módulo>.helpers.ts              # opcional, na raiz — código puro compartilhado por 2+ endpoints
  <módulo>.constants.ts            # opcional, na raiz — idem
  <verbo>-<recurso>/               # UMA pasta por endpoint
    <verbo>-<recurso>.repository.ts
    <verbo>-<recurso>.schema.ts
    <verbo>-<recurso>.dto.ts
    <verbo>-<recurso>.service.ts
    <verbo>-<recurso>.controller.ts
```

Cada endpoint mora na sua própria subpasta (`<verbo>-<recurso>/`), não solto na raiz do módulo. Motivo: com módulos de 4+ endpoints, uma pasta plana com 20+ arquivos fica difícil de escanear visualmente; a subpasta por endpoint resolve isso sem juntar camadas de endpoints diferentes num `service.ts` compartilhado. Criar um `Router` do Express por endpoint continua sendo o inverso do propósito do `Router` (ele existe pra *agrupar*) — por isso `routes.ts` continua único por módulo, na raiz.

**Regra 1 — o prefixo indica o escopo.** Arquivo na raiz do módulo leva o nome do módulo (`user.repository.ts`, `user.helpers.ts`, `user.constants.ts`) — vale pro módulo inteiro. Arquivo em subpasta leva o nome do endpoint (`get-user-profile.repository.ts`) — vale só pra aquele endpoint. Sem exceção.

**Regra 2 — escada de promoção.** Dois eixos decidem onde algo mora: conhece o schema do banco (SQL, nomes de tabela/coluna) ou é puro (regra de domínio, sem tocar no banco)? E quantos endpoints consomem?

| | 1 endpoint | 2+ endpoints do módulo | 2+ módulos |
|---|---|---|---|
| **puro** | dentro da pasta do endpoint | `<módulo>.helpers.ts` / `<módulo>.constants.ts` | `src/shared/` |
| **conhece o schema** | `<endpoint>.repository.ts` | `<módulo>.repository.ts` | `src/shared/` |

Promova só quando o segundo consumidor aparecer de verdade — nunca preventivamente. O eixo é *conhecimento de schema*, não *é I/O*: uma função que monta um fragmento SQL (string → string, sem `pool.query`) ainda conta como "conhece o schema" e mora no `.repository.ts`, porque colocá-la em `helpers.ts` tiraria daquele arquivo a única propriedade que o justifica — ser puro e testável sem banco. Não crie `<módulo>.utils.ts` ao lado de `<módulo>.helpers.ts`: dentro de um módulo tudo é código de domínio por construção, então não há uma categoria "genérica" separada para justificar os dois nomes — esse slot genérico já é `src/shared/`.

Predicado de erro de banco (`isUniqueViolation`, `isForeignKeyViolation` por código PG `23505`/`23503`) não é por módulo — vive em `src/shared/error/db-error.ts` e é importado por qualquer repository que precise mapear a violação pra um `APIError`.

Endpoints de listagem só recebem `limit`/`offset` se o usuário pedir paginação; sem pedido explícito, devolva tudo. Quando pedida, use teto razoável de 50 itens.

## Cadeia de chamada

```
routes → controller → service → repository
              ↓
             dto → schema
```

Cada camada tem uma responsabilidade que não muda quando o módulo cresce:

- **repository** — único lugar que sabe que existe SQL/Postgres. Devolve linhas cruas (snake_case).
- **service** — regra de negócio. Sempre existe, mesmo quando hoje só repassa: quando a regra aparecer, ela já tem lugar.
- **dto** — mapeia snake_case→camelCase e valida contra o schema.
- **controller** — traduz HTTP↔chamada de função. Não sabe SQL, não decide regra.
- **schema** — Zod. Documenta o contrato público da API.

## Templates

### repository

```ts
import { pool } from '../../../db/client.ts'
import type { PoolClient } from 'pg'

export type TrailRow = {
  id: number
  slug: string
  title: string
  short_title: string
  order_index: number
}

export async function findAllTrails(): Promise<TrailRow[]> {
  const result = await pool.query<TrailRow>(
    'SELECT id, slug, title, short_title, order_index FROM trails ORDER BY order_index'
  )
  return result.rows
}

// Assinatura padrão para transações: cliente opcional no último argumento.
// RETURNING * não garante em tipo que a linha existe — valide com Zod quando isso importar
// (ver "Validar linhas do banco" nas Regras de Ouro); result.rows[0] cru pode ser undefined em runtime.
export async function createUser(data: UserInput, client: PoolClient | typeof pool = pool): Promise<UserRow> {
  const result = await client.query<UserRow>(
    'INSERT INTO users (email) VALUES ($1) RETURNING *',
    [data.email]
  )
  return result.rows[0]
}
```

### schema

```ts
import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

// GET sem entrada de body — caso deste template (get-trails)
export const schema = {
  response: {
    ...baseSchema.response,
    body: z.object({
      trails: z.array(
        z.object({
          id: z.number(),
          slug: z.string(),
          title: z.string(),
          shortTitle: z.string(),
          orderIndex: z.number()
        })
      )
    })
  }
}
```

Variações — escolha só as chaves que o endpoint concreto usa, nunca todas de uma vez:

```ts
// GET com parâmetros de rota
request: { ...baseSchema.request, params: z.object({ slug: z.string() }) }

// GET com Query Params de paginação (sempre z.coerce; .int().min(1) evita 0/negativo/fracionado)
request: {
  ...baseSchema.request,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
    offset: z.coerce.number().int().min(0).optional()
  })
}

// POST com Body
request: {
  ...baseSchema.request,
  body: z.object({
    name: z.string().min(3),
    email: z.string().email()
  }).strict()
}
```

### dto

```ts
import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { TrailRow } from './get-trails.repository.ts'
import { schema } from './get-trails.schema.ts'

export const dto = {
  response: {
    ...baseDto.response,
    body: (trails: TrailRow[]) =>
      schema.response.body.parse({
        trails: trails.map((trail) => ({
          id: trail.id,
          slug: trail.slug,
          title: trail.title,
          shortTitle: trail.short_title,
          orderIndex: trail.order_index
        }))
      })
  }
}
```

### service

```ts
import { findAllTrails, type TrailRow } from './get-trails.repository.ts'

export const service = {
  execute: async (): Promise<TrailRow[]> => findAllTrails()
}
```

### controller

```ts
import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { dto } from './get-trails.dto.ts'
import { service } from './get-trails.service.ts'

// GET simples — caso deste template (get-trails)
export async function getTrails(_req: Request, res: Response): Promise<void> {
  const result = await service.execute()
  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
```

Variações — cada uma é um endpoint (pasta, `dto`, `service`) diferente do acima, mostradas isoladas só para ilustrar o padrão:

```ts
// GET com parâmetros tipados
export async function getUserProfile(req: Request, res: Response): Promise<void> {
  const params = dto.request.params(req.params)
  const result = await service.execute(params.slug)
  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}

// POST com body validado
export async function postUser(req: Request, res: Response): Promise<void> {
  const payload = dto.request.body(req.body)
  const result = await service.execute(payload)
  res.status(HTTP_STATUS.CREATED).json(dto.response.body(result))
}

// Endpoint que exige usuário logado: req.user vem de express.d.ts (shared/auth/express.d.ts),
// sempre opcional no tipo mesmo atrás do authMiddleware — checagem inline, sem `!`.
export async function postUserSubmission(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const payload = dto.request.body(req.body)
  const result = await service.execute(req.user.id, payload)
  res.status(HTTP_STATUS.CREATED).json(dto.response.body(result))
}
```

(A variação de `postUserSubmission` também precisa importar `APIError` de `../../../shared/error/api-error.ts`.)

### routes (por módulo)

```ts
import { Router } from 'express'
import { getTrails } from './get-trails/get-trails.controller.ts'
import { getTrailDetail } from './get-trail-detail/get-trail-detail.controller.ts'

export const trailsRouter = Router()

trailsRouter.get('/', getTrails)
trailsRouter.get('/:slug', getTrailDetail)
```

**Atenção:** Este arquivo é acumulativo (ver Modo 2). Ao adicionar endpoint a módulo existente, o novo `import` aponta para `./<verbo>-<recurso>/<verbo>-<recurso>.controller.ts`.

E registre em `src/modules/router.ts`:

```ts
modulesRouter.use('/trails', trailsRouter)
```

*(Se o módulo for totalmente novo, crie o `router.ts` e adicione o `use` aqui. Se o módulo já existir, o `router.ts` não precisa ser tocado).*

## Convenções

**Exports:** `schema`, `dto`, `service` — minúsculos, sem prefixo do endpoint. O nome do arquivo já dá o contexto. Controller exporta função nomeada (`getTrails`); repository exporta funções + tipos de linha.

**Sem barrel files** (`index.ts` agregador). Imports relativos diretos.

**Nomes em inglês** para identificadores, tabelas e colunas. Conteúdo (texto das missões) continua em português.

**Sem número mágico de status** — use `HTTP_STATUS` de `shared/constants.ts`.

**Biome:** aspas simples, sem ponto e vírgula, indent 2 espaços, largura 100, sem trailing comma. Rode `npm run check:fix`.

## Erros

- **Erro esperado** (404, 409, 400 de negócio): `throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')`.
- **ZodError**: virar 400 `validation_error` é automático.
- **Qualquer outro erro**: vira 500 genérico, com stack no log e mensagem neutra pro cliente.

Códigos padronizados: `validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`.

## Regras de Ouro e Armadilhas

- **Sempre crie os 5 arquivos, mesmo quando o endpoint é trivial hoje.** O `service.ts` pode só repassar pro repository no início — mas quando a regra de negócio aparecer (ela sempre aparece), já existe um lugar certo pra ela em vez de forçar o controller ou o repository a acumular responsabilidade que não é sua. O custo de um arquivo fino agora é menor que o de decidir, sob pressão, onde colar a lógica depois. Dito isso, em `schema.ts` e `dto.ts`, só adicione as chaves (`request`, `response`, `body`, `params`, `query`) que forem estritamente usadas por aquele endpoint. O oposto (espalhar `...baseSchema` no topo pra sempre ter as 4 camadas) faria `dto.request.query(req.query)` compilar e devolver `{}` silenciosamente num endpoint que nunca declarou `query`.
- **Response: mapear em JS → parsear (não `.transform()`).** O `.map()` é tipado contra o tipo de linha do repository. Se a query mudar, vira erro de compilação. `.transform()` no schema de response faria o schema descrever o formato do banco, e não o contrato da API. `.transform()` **só** faz sentido no lado do **request** (ex: converter query string).
- **Validação vive no controller, não em middleware.** `dto.request.*(...)` na entrada, `dto.response.body(...)` na saída.
- **Validar linhas do banco (quando vale).** Não faça por padrão. Vale quando há coluna nulável. Cenário: tipo escrito à mão diz `string`, banco devolve `null`, TypeScript não percebe. Use `z.object(...).parse(result.rows[0])` no repository.
- **Endpoint com body precisa declarar o body.** `baseSchema.request.body` é `z.object({})` e o Zod remove chave não declarada. Um `POST` que chame `dto.request.body(req.body)` sem sobrescrever `body` no schema recebe `{}`, descartando o payload silenciosamente.
- **`.strict()` é o default para body.** Se houver exceção, o motivo precisa ficar explícito.
- **Autenticação não é do dto.** O `authMiddleware` roda em todas as rotas `/api/v1` e popula `req.user` — mas o tipo (`shared/auth/express.d.ts`) é sempre `AuthUser | undefined`, mesmo em rota autenticada, porque a augmentation vale pra qualquer `Request`. Quando o controller precisar do UID, checagem inline: `if (!req.user) throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', '...')`. Não existe (e não crie) um tipo `AuthenticatedRequest` — seria uma promessa só de compilação sem checagem real, na mesma categoria de tipar `pool.query<TrailRow>()` e assumir que a linha sempre existe sem validar.
- **Transações manuais precisam fechar.** Se usar `pool.connect()`, o `client.release()` deve estar garantido em `finally`.
- **Rotas hoje são todas autenticadas.** Se um endpoint precisar ser público, traga ao usuário em vez de inventar.
- **Fragmento SQL compartilhado é função, não const.** Uma const como `` const FOO_SQL = `... WHERE user_id = $1` `` esconde a suposição de que o parâmetro é sempre `$1`; funciona só até um segundo `pool.query` que precise de outro índice antes. Escreva como `function fooSql(userIdParam = '$1'): string`, com o índice interpolado. O argumento passado é sempre um literal escrito no código (`'$2'`), nunca vindo do request — igual à regra de mapa de coluna constante (ver `SLOT_COLUMN` em `update-active-avatar-item.repository.ts`).

## Verificação

**Padrão, sempre:** `npm run check` (typecheck + Biome). Se acusar formatação, `npm run check:fix`. Isso é suficiente para encerrar a tarefa — não suba o servidor nem chame a rota por conta própria (gasta tokens em algo trivial pro engenheiro validar).

**Só se o usuário pedir explicitamente** para testar de ponta a ponta:

1. Subir: `npm run dev &`. Token real do Firebase: `npx tsx plan/get-test-token.mts` (o header `x-dev-user-id` não vale mais).
2. Chamar: `curl.exe -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/<rota>`.
3. Checar também o caminho de erro — quebre o mapeamento de propósito (ex.: trocar um número por string no dto), confirme **400** `validation_error` com `details` apontando o campo, e reverta a quebra.
4. Matar o processo ao final para evitar zumbi:
   ```powershell
   Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

Scripts de teste descartáveis vão em `plan/` (já no `.gitignore`), não na raiz.