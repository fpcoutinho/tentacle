import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { resolveRank } from '../user.helpers.ts'
import { countTrailsCompleted } from '../user.repository.ts'
import {
  type UpdateUserProfileInput,
  type UpdateUserProfileRow,
  updateUserProfile
} from './update-user-profile.repository.ts'

export const service = {
  execute: async (id: string, input: UpdateUserProfileInput): Promise<UpdateUserProfileRow> => {
    if (input.avatarIdx !== null) {
      const trailsCompleted = await countTrailsCompleted(id)
      const { avatarsUnlocked } = resolveRank(trailsCompleted)

      if (input.avatarIdx >= avatarsUnlocked) {
        throw new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'Avatar not unlocked yet')
      }
    }

    return updateUserProfile(id, input)
  }
}
