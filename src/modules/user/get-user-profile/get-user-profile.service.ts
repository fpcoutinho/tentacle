import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import type { RANKS } from '../user.constants.ts'
import { resolveRank } from '../user.helpers.ts'
import { findUserProfileById, type UserProfileRow } from './get-user-profile.repository.ts'

export type UserProfileResult = UserProfileRow & {
  rank: (typeof RANKS)[number]
  level: number
  avatars_unlocked: number
}

export const service = {
  execute: async (id: string): Promise<UserProfileResult> => {
    const row = await findUserProfileById(id)
    if (!row) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'User profile not found')
    }

    const { rank, level, avatarsUnlocked } = resolveRank(row.levels_completed)

    return { ...row, rank, level, avatars_unlocked: avatarsUnlocked }
  }
}
