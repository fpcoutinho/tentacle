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
      bookmark: z
        .object({
          missionId: z.number(),
          data: z.object({
            scrollY: z.number(),
            sectionTitle: z.string()
          }),
          createdAt: z.date()
        })
        .nullable()
    })
  }
}
