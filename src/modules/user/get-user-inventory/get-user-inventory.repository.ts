import { pool } from '../../../db/client.ts'

export type InventoryItemRow = {
  id: number
  item_type: string
  code: string
  name: string
  active: boolean
}

export async function findUserInventory(userId: string): Promise<InventoryItemRow[]> {
  const result = await pool.query<InventoryItemRow>(
    `SELECT si.id, si.item_type, si.code, si.name,
       COALESCE(si.id IN (a.active_frame, a.active_accessory, a.active_color), false) AS active
     FROM user_inventory ui
     JOIN shop_items si ON si.id = ui.item_id
     LEFT JOIN user_avatar_settings a ON a.user_id = ui.user_id
     WHERE ui.user_id = $1
     ORDER BY si.item_type, si.id`,
    [userId]
  )
  return result.rows
}
