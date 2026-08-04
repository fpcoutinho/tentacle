import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  response: {
    ...baseSchema.response,
    body: z.object({
      raw: z.string(),
      formatted: z.string(),
      currency: z.string()
    })
  }
}
