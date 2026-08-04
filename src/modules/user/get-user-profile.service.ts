import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'
import { RANK_THRESHOLDS, RANKS } from './constants.ts'
import { findUserProfileById, type UserProfileRow } from './get-user-profile.repository.ts'

export type UserProfileResult = UserProfileRow & {
  rank: (typeof RANKS)[number]
  avatars_unlocked: number
}

function resolveRank(trailsCompleted: number): {
  rank: (typeof RANKS)[number]
  avatarsUnlocked: number
} {
  let current: { rank: (typeof RANKS)[number]; avatarsUnlocked: number } = {
    rank: RANKS[0],
    avatarsUnlocked: 1
  }

  RANKS.forEach((rank, index) => {
    const threshold = RANK_THRESHOLDS[index] ?? 0
    if (trailsCompleted >= threshold) {
      current = { rank, avatarsUnlocked: index + 1 }
    }
  })

  return current
}

export const service = {
  execute: async (id: string): Promise<UserProfileResult> => {
    const row = await findUserProfileById(id)
    if (!row) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'User profile not found')
    }

    const { rank, avatarsUnlocked } = resolveRank(row.trails_completed)

    return { ...row, rank, avatars_unlocked: avatarsUnlocked }
  }
}
