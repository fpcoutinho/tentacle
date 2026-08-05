import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    params: z.object({
      trailId: z.coerce.number().int().positive()
    })
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      progress: z.object({
        trailId: z.number(),
        missionsCompleted: z.number(),
        totalMissions: z.number(),
        percent: z.number(),
        levels: z.array(
          z.object({
            levelId: z.number(),
            orderIndex: z.number(),
            missionsCompleted: z.number(),
            totalMissions: z.number(),
            percent: z.number()
          })
        ),
        completedMissionIds: z.array(z.number())
      })
    })
  }
}
