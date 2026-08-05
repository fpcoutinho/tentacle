import { z } from 'zod'
import { baseSchema } from '../../../shared/validation/base-schema.ts'

export const schema = {
  request: {
    ...baseSchema.request,
    // .loose() preserva os demais headers da requisição; só o Idempotency-Key é lido.
    headers: z
      .object({
        'idempotency-key': z.string().min(1).max(255).optional()
      })
      .loose(),
    params: z.object({
      slug: z.string().min(1),
      questionSlug: z.string().min(1)
    }),
    body: z
      .object({
        answerOptionId: z.number().int().positive()
      })
      .strict()
  },
  response: {
    ...baseSchema.response,
    body: z.object({
      isCorrect: z.boolean(),
      attemptNumber: z.number(),
      earnedShells: z.number(),
      correctOptionId: z.number(),
      explanation: z.string(),
      wrongExplanation: z.string().nullable(),
      shellBalance: z.number()
    })
  }
}
