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
      mission: z.object({
        id: z.number(),
        slug: z.string(),
        title: z.string(),
        emblem: z.string().nullable(),
        theory: z.string(),
        hasMinigame: z.boolean(),
        summary: z.unknown().nullable(),
        bibliography: z.unknown().nullable(),
        faqs: z.unknown().nullable(),
        orderIndex: z.number(),
        questions: z.array(
          z.object({
            id: z.number(),
            slug: z.string(),
            kind: z.enum(['main', 'extra']),
            prompt: z.string(),
            maxRewardShells: z.number(),
            orderIndex: z.number(),
            options: z.array(
              z.object({
                id: z.number(),
                label: z.string(),
                orderIndex: z.number()
              })
            )
          })
        )
      })
    })
  }
}
