import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    body: z
      .object({
        name: z.string().min(1).optional(),
        gender: z.enum(['male', 'female', 'other']).optional(),
        avatarIdx: z.number().int().min(0).optional(),
        birthDate: z.string().date().optional()
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field must be provided'
      })
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      name: z.string(),
      gender: z.enum(['male', 'female', 'other']).nullable(),
      avatarIdx: z.number(),
      birthDate: z.string().nullable()
    })
  }
}
