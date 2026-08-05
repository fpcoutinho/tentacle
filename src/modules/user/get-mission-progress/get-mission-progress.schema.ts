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
      progress: z.object({
        missionId: z.number(),
        missionSlug: z.string(),
        completed: z.boolean(),
        shellsEarned: z.number(),
        questions: z.array(
          z.object({
            questionId: z.number(),
            questionSlug: z.string(),
            kind: z.enum(['main', 'extra']),
            attemptCount: z.number(),
            answeredCorrectly: z.boolean(),
            earnedShells: z.number()
          })
        )
      })
    })
  }
}
