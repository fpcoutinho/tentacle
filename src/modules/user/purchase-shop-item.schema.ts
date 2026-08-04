import { z } from 'zod'
import { baseSchema } from '../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    body: z
      .object({
        itemId: z.number().int().positive()
      })
      .strict()
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      inventoryId: z.number(),
      item: z.object({
        id: z.number(),
        itemType: z.enum(['frame', 'accessory', 'color']),
        code: z.string(),
        name: z.string(),
        priceShells: z.number()
      }),
      shellBalance: z.number(),
      acquiredAt: z.date()
    })
  }
}
