import { z } from 'zod'
import { baseSchema } from '../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    query: z.object({
      limit: z.coerce.number().int().min(1).max(50).default(5),
      offset: z.coerce.number().int().min(0).default(0),
      category: z.enum(['frame', 'accessory', 'color']).optional()
    })
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      items: z.array(
        z.object({
          id: z.number(),
          itemType: z.enum(['frame', 'accessory', 'color']),
          code: z.string(),
          name: z.string(),
          priceShells: z.number()
        })
      ),
      pagination: z.object({
        limit: z.number(),
        offset: z.number(),
        total: z.number()
      })
    })
  }
}
