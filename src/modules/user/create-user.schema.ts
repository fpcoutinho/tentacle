import { z } from 'zod'
import { baseSchema } from '../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    body: z
      .object({
        name: z.string().min(1),
        gender: z.enum(['male', 'female', 'other']).nullable().optional(),
        email: z.email(),
        birthDate: z.iso.date().nullable().optional()
      })
      .strict()
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      id: z.string(),
      name: z.string(),
      gender: z.enum(['male', 'female', 'other']).nullable(),
      email: z.string(),
      birthDate: z.string().nullable()
    })
  }
}
