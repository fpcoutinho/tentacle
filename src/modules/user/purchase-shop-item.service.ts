import { type PurchaseShopItemRow, purchaseShopItem } from './purchase-shop-item.repository.ts'

export type PurchaseShopItemPayload = {
  itemId: number
}

export const service = {
  execute: async (userId: string, payload: PurchaseShopItemPayload): Promise<PurchaseShopItemRow> =>
    purchaseShopItem({ userId, itemId: payload.itemId })
}
