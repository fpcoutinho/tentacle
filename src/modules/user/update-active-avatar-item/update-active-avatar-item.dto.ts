import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { ActiveAvatarItemsRow } from './update-active-avatar-item.repository.ts'
import { schema } from './update-active-avatar-item.schema.ts'

export const dto = {
  request: {
    body: (input: unknown) => schema.request.body.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (row: ActiveAvatarItemsRow) =>
      schema.response.body.parse({
        avatarIdx: row.avatar_idx,
        activeFrame: row.active_frame,
        activeAccessory: row.active_accessory,
        activeColor: row.active_color
      })
  }
}
