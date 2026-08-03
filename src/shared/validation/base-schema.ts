import { z } from 'zod'

export const baseSchema = {
  request: {
    headers: z.object({}).loose(),
    params: z.object({}),
    query: z.object({}),
    body: z.object({})
  },
  response: {
    headers: z.object({}).loose(),
    body: z.object({})
  }
}
