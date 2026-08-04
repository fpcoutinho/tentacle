import {
  type FindShopItemsInput,
  findShopItems,
  type ShopItemRow
} from './get-shop-items.repository.ts'

export const service = {
  execute: async (input: FindShopItemsInput): Promise<{ rows: ShopItemRow[]; total: number }> => {
    const rows = await findShopItems(input)
    return { rows, total: rows[0]?.total ?? 0 }
  }
}
