import { baseDto } from '../../shared/validation/base-dto.ts'
import type { PurchaseShopItemRow } from './purchase-shop-item.repository.ts'
import { schema } from './purchase-shop-item.schema.ts'

export const dto = {
  request: {
    body: (input: unknown) => schema.request.body.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (row: PurchaseShopItemRow) =>
      schema.response.body.parse({
        inventoryId: row.inventory_id,
        item: {
          id: row.item_id,
          itemType: row.item_type,
          code: row.code,
          name: row.name,
          priceShells: row.price_shells
        },
        shellBalance: row.shell_balance,
        acquiredAt: row.acquired_at
      })
  }
}
