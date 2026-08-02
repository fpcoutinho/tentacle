import { z } from 'zod'
import { baseSchema } from '../../shared/validation/base-schema.ts'

export const getTrailsSchema = {
  ...baseSchema,
  response: baseSchema.response.extend({
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
  })
}
