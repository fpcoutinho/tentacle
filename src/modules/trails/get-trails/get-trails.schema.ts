import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  response: {
    ...baseSchema.response,
    body: z.object({
      trails: z.array(
        z.object({
          id: z.number(),
          slug: z.string(),
          title: z.string(),
          shortTitle: z.string(),
          orderIndex: z.number()
        })
      )
    })
  }
}
