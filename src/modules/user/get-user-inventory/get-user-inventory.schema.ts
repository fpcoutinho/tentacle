import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  response: {
    ...baseSchema.response,
    body: z.object({
      items: z.array(
        z.object({
          id: z.number(),
          itemType: z.enum(['frame', 'accessory', 'color']),
          code: z.string(),
          name: z.string(),
          active: z.boolean()
        })
      )
    })
  }
}
