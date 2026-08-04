import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    body: z
      .object({
        slot: z.enum(['frame', 'accessory', 'color']),
        itemId: z.number().int().positive().nullable()
      })
      .strict()
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      avatarIdx: z.number(),
      activeFrame: z.number().nullable(),
      activeAccessory: z.number().nullable(),
      activeColor: z.number().nullable()
    })
  }
}
