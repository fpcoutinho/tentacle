import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { resolveRank } from '../user.helpers.ts'
import { countLevelsCompleted } from '../user.repository.ts'
import {
  type UpdateUserProfileInput,
  type UpdateUserProfileRow,
  updateUserProfile
} from './update-user-profile.repository.ts'

export const service = {
  execute: async (id: string, input: UpdateUserProfileInput): Promise<UpdateUserProfileRow> => {
    if (input.avatarIdx !== null) {
      const levelsCompleted = await countLevelsCompleted(id)
      const { avatarsUnlocked } = resolveRank(levelsCompleted)

      if (input.avatarIdx >= avatarsUnlocked) {
        throw new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'Avatar not unlocked yet')
      }
    }

    return updateUserProfile(id, input)
  }
}
