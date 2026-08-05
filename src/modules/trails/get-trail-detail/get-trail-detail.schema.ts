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
      trail: z.object({
        id: z.number(),
        slug: z.string(),
        title: z.string(),
        subtitle: z.string(),
        shortTitle: z.string(),
        orderIndex: z.number(),
        totalMissions: z.number(),
        levels: z.array(
          z.object({
            id: z.number(),
            slug: z.string(),
            title: z.string(),
            shortTitle: z.string(),
            orderIndex: z.number(),
            missions: z.array(
              z.object({
                id: z.number(),
                slug: z.string(),
                title: z.string(),
                emblem: z.string().nullable(),
                hasMinigame: z.boolean(),
                orderIndex: z.number(),
                rewardShells: z.number()
              })
            )
          })
        )
      })
    })
  }
}
