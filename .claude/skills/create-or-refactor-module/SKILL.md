---
name: create-or-refactor-module
description: Padrão de arquitetura de módulos do backend tentacle (Node/TS/Express/pg sem ORM, Zod, Biome). Use SEMPRE que for criar um endpoint novo, criar um módulo novo, ou refatorar um módulo existente neste repo — inclusive quando o pedido não usar a palavra "módulo", como em "cria o endpoint de perfil do usuário", "faz o GET de missões", "adiciona a rota de compra na loja", "precisa de um POST pra submeter resposta". Contém os templates exatos de cada camada (routes/controller/service/dto/schema/repository), as convenções de nome e export, e o porquê de cada decisão — evita ter que reler o repositório pra reconstruir o padrão.
---

# Módulos do tentacle

Padrão estabelecido ao construir `GET /api/v1/trails`. Siga-o para qualquer endpoint novo; se algo aqui não encaixar no caso concreto, diga isso explicitamente ao usuário em vez de improvisar em silêncio — o padrão é derivado de decisões discutidas, e divergir dele deve ser uma escolha consciente.

## Como usar

- No modo automático, seja direto: não invente arquivos, não amplie escopo sem pedido e não crie testes, migrations, Swagger/OpenAPI ou auxiliares não solicitados.
- **NUNCA sobrescreva arquivos compartilhados.** Ao adicionar um novo endpoint a um módulo existente, o `<módulo>.routes.ts` já existe. Faça um *append* do novo import e da nova chamada de rota ao arquivo existente. Não recrie o arquivo do zero.
- Se houver incerteza real sobre regra de negócio, contrato ou tabela, pare e avise o usuário em vez de improvisar.
- O comentário com caminho de arquivo no topo de blocos de código é opcional e serve só como auxílio no modo plan; não é exigência do modo automático.

## Estrutura de arquivos

```
src/modules/<módulo>/
  <módulo>.routes.ts            # UM por módulo — agrega todos os endpoints
  <verbo>-<recurso>.repository.ts
  <verbo>-<recurso>.schema.ts
  <verbo>-<recurso>.dto.ts
  <verbo>-<recurso>.service.ts
  <verbo>-<recurso>.controller.ts
```

O nome do arquivo é **por endpoint** (`get-trails.*`, `get-trail-detail.*`, `post-user.*`), exceto `routes.ts`, que é **por módulo**. Motivo: vários endpoints convivem na mesma pasta sem um `service.ts` gigante compartilhado, mas criar um `Router` do Express por endpoint é o inverso do propósito do `Router` (ele existe pra *agrupar*).

Endpoints de listagem devem considerar paginação por padrão (`limit`/`offset`), com teto razoável de 50 itens, caso o usuário peça. Caso ele não especifique, devolva tudo.

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
import { pool } from '../../db/client.ts'
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

// Assinatura padrão para transações: cliente opcional no último argumento
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
import { baseSchema } from '../../shared/validation/base-schema.ts'

// GET sem entrada de body
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

// GET com parâmetros de rota
export const schema = {
  request: { ...baseSchema.request, params: z.object({ slug: z.string() }) },
  response: { ...baseSchema.response, body: z.object({ /* ... */ }) }
}

// GET com Query Params de paginação (sempre use z.coerce para query)
export const schema = {
  request: {
    ...baseSchema.request,
    query: z.object({
      limit: z.coerce.number().max(50).optional(),
      offset: z.coerce.number().optional()
    })
  },
  response: { ...baseSchema.response, body: z.object({ /* ... */ }) }
}

// POST com Body
export const schema = {
  request: {
    ...baseSchema.request,
    body: z.object({
      name: z.string().min(3),
      email: z.string().email()
    }).strict()
  },
  response: { ...baseSchema.response, body: z.object({ /* ... */ }) }
}
```

### dto

```ts
import { baseDto } from '../../shared/validation/base-dto.ts'
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
import { AuthenticatedRequest } from '../../shared/types.ts' // Use quando precisar de req.user

import { HTTP_STATUS } from '../../shared/constants.ts'
import { dto } from './get-trails.dto.ts'
import { service } from './get-trails.service.ts'

// GET simples
export async function getTrails(_req: Request, res: Response): Promise<void> {
  const result = await service.execute()
  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}

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

// POST que exige usuário logado
export async function postUserSubmission(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = dto.request.body(req.body)
  const result = await service.execute(req.user.uid, payload)
  res.status(HTTP_STATUS.CREATED).json(dto.response.body(result))
}
```

### routes (por módulo)

```ts
import { Router } from 'express'
import { getTrails } from './get-trails.controller.ts'
import { getTrailDetail } from './get-trail-detail.controller.ts'

export const trailsRouter = Router()

trailsRouter.get('/', getTrails)
trailsRouter.get('/:slug', getTrailDetail)
```

**Atenção:** Este arquivo é acumulativo. Se estiver criando um novo endpoint num módulo que já existe, **não sobrescreva este arquivo**. Apenas adicione o `import` da nova controller no topo e a nova rota (ex: `trailsRouter.post('/', createTrail)`) no final.

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

- **Sempre crie os 5 arquivos.** No entanto, em `schema.ts` e `dto.ts`, só adicione as chaves (`request`, `response`, `body`, `params`, `query`) que forem estritamente usadas por aquele endpoint. O oposto (espalhar `...baseSchema` no topo pra sempre ter as 4 camadas) faria `dto.request.query(req.query)` compilar e devolver `{}` silenciosamente num endpoint que nunca declarou `query`.
- **Response: mapear em JS → parsear (não `.transform()`).** O `.map()` é tipado contra o tipo de linha do repository. Se a query mudar, vira erro de compilação. `.transform()` no schema de response faria o schema descrever o formato do banco, e não o contrato da API. `.transform()` **só** faz sentido no lado do **request** (ex: converter query string).
- **Validação vive no controller, não em middleware.** `dto.request.*(...)` na entrada, `dto.response.body(...)` na saída.
- **Validar linhas do banco (quando vale).** Não faça por padrão. Vale quando há coluna nulável. Cenário: tipo escrito à mão diz `string`, banco devolve `null`, TypeScript não percebe. Use `z.object(...).parse(result.rows[0])` no repository.
- **Endpoint com body precisa declarar o body.** `baseSchema.request.body` é `z.object({})` e o Zod remove chave não declarada. Um `POST` que chame `dto.request.body(req.body)` sem sobrescrever `body` no schema recebe `{}`, descartando o payload silenciosamente.
- **`.strict()` é o default para body.** Se houver exceção, o motivo precisa ficar explícito.
- **Autenticação não é do dto.** O `authMiddleware` roda em todas as rotas `/api/v1` e popula `req.user`. Use `AuthenticatedRequest` no controller quando precisar do UID.
- **Transações manuais precisam fechar.** Se usar `pool.connect()`, o `client.release()` deve estar garantido em `finally`.
- **Rotas hoje são todas autenticadas.** Se um endpoint precisar ser público, traga ao usuário em vez de inventar.

## Verificação

1. `npm run check` (typecheck + Biome). Se acusar formatação, `npm run check:fix`.
2. Subir e chamar de verdade:
   ```bash
   npm run dev &
   ```
   Token real do Firebase: `npx tsx plan/get-test-token.mts` (a auth é Firebase; o header `x-dev-user-id` não vale mais). Depois:
   ```bash
   curl.exe -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/<rota>
   ```
3. Confirmar o caminho de erro, não só o feliz — quebre o mapeamento de propósito (ex.: trocar um número por string no dto) e confirme **400** `validation_error` com `details` apontando o campo. Reverter depois.
4. Mate o processo do servidor após os testes para evitar zumbis:
   ```powershell
   Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

Scripts de teste descartáveis vão em `plan/` (já no `.gitignore`), não na raiz.