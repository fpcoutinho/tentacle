import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { ShopItemRow } from './get-shop-items.repository.ts'
import { schema } from './get-shop-items.schema.ts'

export type ShopItemsResult = {
  rows: ShopItemRow[]
  total: number
  limit: number
  offset: number
}

export const dto = {
  request: {
    query: (input: unknown) => schema.request.query.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (result: ShopItemsResult) =>
      schema.response.body.parse({
        items: result.rows.map((row) => ({
          id: row.id,
          itemType: row.item_type,
          code: row.code,
          name: row.name,
          priceShells: row.price_shells
        })),
        pagination: {
          limit: result.limit,
          offset: result.offset,
          total: result.total
        }
      })
  }
}
