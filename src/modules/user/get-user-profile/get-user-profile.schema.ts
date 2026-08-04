import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'
import { RANKS } from '../user.constants.ts'

export const schema = {
  response: {
    ...baseSchema.response,
    body: z.object({
      name: z.string(),
      gender: z.enum(['male', 'female', 'other']).nullable(),
      missionsCompleted: z.number(),
      totalMissions: z.number(),
      rank: z.object({
        level: z.number(),
        patent: z.enum(RANKS)
      }),
      avatarIdx: z.number(),
      avatarsUnlocked: z.number(),
      activeFrame: z.number().nullable(),
      activeAccessory: z.number().nullable(),
      activeColor: z.number().nullable()
    })
  }
}
