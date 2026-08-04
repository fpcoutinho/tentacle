import { findUserInventory, type InventoryItemRow } from './get-user-inventory.repository.ts'

export const service = {
  execute: async (userId: string): Promise<InventoryItemRow[]> => findUserInventory(userId)
}
