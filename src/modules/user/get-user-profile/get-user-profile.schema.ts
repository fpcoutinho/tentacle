import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'
import { RANKS } from '../constants.ts'

export const schema = {
  response: {
    ...baseSchema.response,
    body: z.object({
      name: z.string(),
      gender: z.enum(['male', 'female', 'other']).nullable(),
      missionsCompleted: z.number(),
      totalMissions: z.number(),
      rank: z.enum(RANKS),
      avatarIdx: z.number(),
      avatarsUnlocked: z.number()
    })
  }
}
