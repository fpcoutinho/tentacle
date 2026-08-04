import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import {
  type ActiveAvatarItemsRow,
  type AvatarSlot,
  findOwnedItemType,
  updateActiveAvatarItem
} from './update-active-avatar-item.repository.ts'

export type UpdateActiveAvatarItemPayload = {
  slot: AvatarSlot
  itemId: number | null
}

export const service = {
  execute: async (
    userId: string,
    payload: UpdateActiveAvatarItemPayload
  ): Promise<ActiveAvatarItemsRow> => {
    if (payload.itemId !== null) {
      const itemType = await findOwnedItemType(userId, payload.itemId)

      if (!itemType) {
        throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Item not found in user inventory')
      }
      if (itemType !== payload.slot) {
        throw new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'Item type does not match slot')
      }
    }

    return updateActiveAvatarItem({ userId, slot: payload.slot, itemId: payload.itemId })
  }
}
