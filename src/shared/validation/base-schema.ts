import { z } from 'zod'

export const baseSchema = {
  request: z.object({
    headers: z.object({}).loose().optional(),
    params: z.object({}).loose().optional(),
    query: z.object({}).loose().optional(),
    body: z.unknown().optional()
  }),
  response: z.object({
    headers: z.object({}).loose().optional(),
    body: z.unknown().optional()
  })
}
