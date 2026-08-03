---
name: create-or-refactor-module
description: Padrão de arquitetura de módulos do backend tentacle (Node/TS/Express/pg sem ORM, Zod, Biome). Use SEMPRE que for criar um endpoint novo, criar um módulo novo, ou refatorar um módulo existente neste repo — inclusive quando o pedido não usar a palavra "módulo", como em "cria o endpoint de perfil do usuário", "faz o GET de missões", "adiciona a rota de compra na loja", "precisa de um POST pra submeter resposta". Contém os templates exatos de cada camada (routes/controller/service/dto/schema/repository), as convenções de nome e export, e o porquê de cada decisão — evita ter que reler o repositório pra reconstruir o padrão.
---

# Módulos do tentacle

Padrão estabelecido ao construir `GET /api/v1/trails`. Siga-o para qualquer endpoint novo; se algo aqui não encaixar no caso concreto, diga isso explicitamente ao usuário em vez de improvisar em silêncio — o padrão é derivado de decisões discutidas, e divergir dele deve ser uma escolha consciente.

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

Endpoints com entrada simples (sem body/params/query) não precisam declarar todas as camadas de validação — ver "Só declare a camada que você usa".

## Cadeia de chamada

```
routes → controller → service → repository
              ↓
             dto → schema
```

Cada camada tem uma responsabilidade que não muda quando o módulo cresce:

- **repository** — único lugar que sabe que existe SQL/Postgres. Devolve linhas cruas (snake_case).
- **service** — regra de negócio. Sempre existe, mesmo quando hoje só repassa: quando a regra aparecer (cálculo de conchas, validação de saldo), ela já tem lugar, e fica testável sem simular HTTP.
- **dto** — mapeia snake_case→camelCase e valida contra o schema.
- **controller** — traduz HTTP↔chamada de função. Não sabe SQL, não decide regra.
- **schema** — Zod. Documenta o contrato público da API.

## Templates

### repository

```ts
import { pool } from '../../db/client.ts'

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
```

Liste as colunas explicitamente — `SELECT *` faria o retorno mudar silenciosamente quando alguém adicionasse uma coluna. Sem try/catch: erro de banco sobe para o `errorHandlerMiddleware`, que é quem sabe virar resposta HTTP.

O generic `pool.query<TrailRow>` é uma **promessa em tempo de compilação**, não verificação. O TypeScript acredita sem checar. Ver "Validar linhas do banco" abaixo para quando isso importa.

Colunas e constraints reais: `migrations/1785628418413_initial-schema.sql`.

### schema

```ts
import { z } from 'zod'
import { baseSchema } from '../../shared/validation/base-schema.ts'

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

Com entrada (`GET /trails/:slug`):

```ts
export const schema = {
  request: { ...baseSchema.request, params: z.object({ slug: z.string() }) },
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

import { HTTP_STATUS } from '../../shared/constants.ts'
import { dto } from './get-trails.dto.ts'
import { service } from './get-trails.service.ts'

export async function getTrails(_req: Request, res: Response): Promise<void> {
  const result = await service.execute()

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
```

Com entrada:

```ts
export async function getTrailDetail(req: Request, res: Response): Promise<void> {
  const params = dto.request.params(req.params)   // tipado: { slug: string }
  const result = await service.execute(params.slug)

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
```

Sem try/catch: Express 5 encaminha rejeição de handler `async` automaticamente para o error handler.

### routes (por módulo)

```ts
import { Router } from 'express'
import { getTrails } from './get-trails.controller.ts'
import { getTrailDetail } from './get-trail-detail.controller.ts'

export const trailsRouter = Router()

trailsRouter.get('/', getTrails)
trailsRouter.get('/:slug', getTrailDetail)
```

E registre em `src/modules/router.ts`:

```ts
modulesRouter.use('/trails', trailsRouter)
```

## Convenções

**Exports:** `schema`, `dto`, `service` — minúsculos, sem prefixo do endpoint. O nome do arquivo já dá o contexto (`import { dto } from './get-trails.dto.ts'`). Minúsculo porque PascalCase em JS/TS sinaliza classe ou tipo, e estes são objetos planos. Controller exporta função nomeada (`getTrails`); repository exporta funções + tipos de linha.

**Sem barrel files** (`index.ts` agregador). Tentativa anterior de encurtar imports com alias (`#shared/http`) exigia `imports` condicional no `package.json` + `--conditions` no `tsx` + `customConditions` no `tsconfig`, e falhava silenciosamente em produção (funcionava com `tsx`, quebrava com `tsc` compilado). Imports relativos diretos.

**Nomes em inglês** para identificadores, tabelas e colunas. Conteúdo (texto das missões) continua em português.

**Sem número mágico de status** — use `HTTP_STATUS` de `shared/constants.ts`.

**Biome:** aspas simples, sem ponto e vírgula, indent 2 espaços, largura 100, sem trailing comma. Rode `npm run check:fix` — arquivo novo costuma nascer com CRLF neste ambiente Windows e o Biome normaliza.

## Erros

- **Erro esperado** (404, 409, 400 de negócio): `throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')`. Opcionalmente um 4º argumento `details`.
- **ZodError**: virar 400 `validation_error` é automático — o `errorHandlerMiddleware` já trata.
- **Qualquer outro erro**: vira 500 genérico, com stack no log e mensagem neutra pro cliente (nunca vaza detalhe interno).

Códigos padronizados: `validation_error`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `internal_error`.

## Decisões e porquês

### Só declare a camada que você usa

`get-trails` não declara `request` — o endpoint não valida entrada, então a chave não existe no objeto. Se algum controller tentar `dto.request.params(...)`, o TypeScript erra **em tempo de compilação**.

O oposto (espalhar `...baseSchema` no topo pra sempre ter as 4 camadas) faria `dto.request.query(req.query)` compilar e devolver `{}` silenciosamente num endpoint que nunca declarou `query`. Você *acharia* que validou. Esse silêncio é o mesmo problema que o padrão existe pra eliminar.

### Response: mapear em JS → parsear (não `.transform()`)

Dois motivos:

1. `.transform()` roda **depois** do parse, então o schema descreveria a *entrada* do transform — o formato do banco — em vez do contrato da API. O `schema.ts` deve responder "o que essa API devolve?" sem precisar ler dto/service/repository.
2. O `.map()` é tipado contra o tipo de linha do repository. Se a query mudar e `short_title` sumir do `TrailRow`, o mapeamento vira erro de compilação. Com `.transform()`, o tipo de entrada viria de um schema Zod declarado à parte — uma segunda declaração do mesmo formato, livre pra divergir sem ninguém notar.

`.transform()` **é** a ferramenta certa do lado do **request**, onde o schema legitimamente descreve o dado cru que chega (query string é sempre texto) e o transform converte pro que o service espera.

Contraste útil: num BFF, o dado vem de um backend que você não controla, então a fronteira crítica é a entrada e faz sentido o schema descrever o upstream. Aqui o banco é nosso (migrations no mesmo repo) e a fronteira crítica é a **saída**, que os clientes consomem.

### Validação vive no controller, não em middleware de rota

`dto.request.*(...)` na entrada, `dto.response.body(...)` na saída. Um middleware de validação separado existiu e foi removido: ele duplicava o caminho de erro e forçava o controller a não usar o valor validado.

### Validar linhas do banco (quando vale)

**Não faça por padrão.** Para uma query cujas colunas são todas `NOT NULL`, um `.parse()` no repository não pega nada que possa realisticamente acontecer — renome de coluna já estoura no Postgres, e mudança de tipo exigiria migration deliberada.

**Vale quando há coluna nulável** (`missions.emblem`, `missions.summary`/`bibliography`/`faqs`, `users.gender`). Cenário concreto: o tipo escrito à mão diz `string`, o banco devolve `null`, o TypeScript não percebe (o generic é só promessa), e o `null` viaja até estourar longe da origem. Nesse caso:

```ts
const missionRowSchema = z.object({ emblem: z.string().nullable(), /* ... */ })
export type MissionRow = z.infer<typeof missionRowSchema>

export async function findMission(slug: string): Promise<MissionRow> {
  const result = await pool.query('SELECT ... WHERE slug = $1', [slug])
  return missionRowSchema.parse(result.rows[0])
}
```

Declarar o schema **sem** parsear não protege nada — é só outra forma de escrever o tipo. O ganho vem do `.parse()`.

## Armadilhas

**Endpoint com body precisa declarar o body.** `baseSchema.request.body` é `z.object({})` e o Zod remove chave não declarada — um `POST` que chame `dto.request.body(req.body)` sem sobrescrever `body` no schema recebe `{}`, descartando o payload silenciosamente.

**Autenticação não é responsabilidade do dto.** O `authMiddleware` roda em todas as rotas `/api/v1` e popula `req.user`. Colocar um header obrigatório em `baseSchema.request.headers` só teria efeito onde algum controller chamasse `dto.request.headers(...)` — garantia global pertence ao middleware.

**Uma decisão que ainda não foi tomada:** rotas hoje são todas autenticadas (não existe separação público/privado). Se um endpoint precisar ser público, isso é uma decisão nova — traga ao usuário em vez de inventar.

## Verificação

1. `npm run check` (typecheck + Biome). Se acusar formatação, `npm run check:fix`.
2. Subir e chamar de verdade:
   ```bash
   npm run dev
   ```
   Token real do Firebase: `npx tsx plan/get-test-token.mts` (a auth é Firebase; o header `x-dev-user-id` não vale mais). Depois:
   ```bash
   curl.exe -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/<rota>
   ```
3. Confirmar o caminho de erro, não só o feliz — quebre o mapeamento de propósito (ex.: trocar um número por string no dto) e confirme **400** `validation_error` com `details` apontando o campo. Reverter depois.

Cuidado com processo zumbi: se a porta 3000 estiver ocupada por um `tsx watch` de teste anterior, requisições vão pro processo velho e o resultado engana. Antes de testar:
```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Scripts de teste descartáveis vão em `plan/` (já no `.gitignore`), não na raiz.
