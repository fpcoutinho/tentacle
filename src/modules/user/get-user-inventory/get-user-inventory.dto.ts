import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { InventoryItemRow } from './get-user-inventory.repository.ts'
import { schema } from './get-user-inventory.schema.ts'

export const dto = {
  response: {
    ...baseDto.response,
    body: (items: InventoryItemRow[]) =>
      schema.response.body.parse({
        items: items.map((item) => ({
          id: item.id,
          itemType: item.item_type,
          code: item.code,
          name: item.name,
          active: item.active
        }))
      })
  }
}
