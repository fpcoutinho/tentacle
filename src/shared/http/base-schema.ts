import { z } from 'zod'

export const baseRequestSchema = z.object({
  headers: z.object({}).loose().optional(),
  params: z.object({}).loose().optional(),
  query: z.object({}).loose().optional(),
  body: z.unknown().optional()
})

export const baseResponseSchema = z.object({
  headers: z.object({}).loose().optional(),
  body: z.unknown().optional()
})
