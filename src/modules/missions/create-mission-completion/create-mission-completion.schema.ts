import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    params: z.object({
      slug: z.string().min(1)
    })
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      missionId: z.number(),
      completedAt: z.date()
    })
  }
}
