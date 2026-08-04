import { baseDto } from '../../../shared/validation/base-dto.ts'
import { schema } from './get-user-profile.schema.ts'
import type { UserProfileResult } from './get-user-profile.service.ts'

export const dto = {
  response: {
    ...baseDto.response,
    body: (profile: UserProfileResult) =>
      schema.response.body.parse({
        name: profile.name,
        gender: profile.gender,
        missionsCompleted: profile.missions_completed,
        totalMissions: profile.total_missions,
        rank: profile.rank,
        avatarIdx: profile.avatar_idx,
        avatarsUnlocked: profile.avatars_unlocked
      })
  }
}
