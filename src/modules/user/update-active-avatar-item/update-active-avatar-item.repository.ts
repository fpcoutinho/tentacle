import { pool } from '../../../db/client.ts'
import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { isForeignKeyViolation } from '../../../shared/error/db-error.ts'

export type AvatarSlot = 'frame' | 'accessory' | 'color'

export type UpdateActiveAvatarItemInput = {
  userId: string
  slot: AvatarSlot
  itemId: number | null
}

export type ActiveAvatarItemsRow = {
  avatar_idx: number
  active_frame: number | null
  active_accessory: number | null
  active_color: number | null
}

const SLOT_COLUMN = {
  frame: 'active_frame',
  accessory: 'active_accessory',
  color: 'active_color'
} as const

export async function findOwnedItemType(
  userId: string,
  itemId: number
): Promise<string | undefined> {
  const result = await pool.query<{ item_type: string }>(
    `SELECT si.item_type
     FROM user_inventory ui
     JOIN shop_items si ON si.id = ui.item_id
     WHERE ui.user_id = $1 AND ui.item_id = $2`,
    [userId, itemId]
  )

  return result.rows[0]?.item_type
}

export async function updateActiveAvatarItem(
  input: UpdateActiveAvatarItemInput
): Promise<ActiveAvatarItemsRow> {
  try {
    const result = await pool.query<ActiveAvatarItemsRow>(
      `UPDATE user_avatar_settings
       SET ${SLOT_COLUMN[input.slot]} = $2
       WHERE user_id = $1
       RETURNING avatar_idx, active_frame, active_accessory, active_color`,
      [input.userId, input.itemId]
    )

    const row = result.rows[0]
    if (!row) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'User avatar settings not found')
    }

    return row
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Item not found in user inventory')
    }
    throw error
  }
}
