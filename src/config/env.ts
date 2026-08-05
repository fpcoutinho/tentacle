import 'dotenv/config'
import { z } from 'zod'

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    RUNTIME_MODE: z.enum(['standalone', 'serverless']).default('standalone'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    FIREBASE_AUTH_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    FIREBASE_PROJECT_ID: z.string().min(1).optional(),
    FIREBASE_CLIENT_EMAIL: z.email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173')
  })
  .superRefine((value, ctx) => {
    if (!value.FIREBASE_AUTH_ENABLED) {
      return
    }

    for (const field of [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ] as const) {
      if (!value[field]) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'Required when FIREBASE_AUTH_ENABLED=true'
        })
      }
    }
  })

export const env = envSchema.parse(process.env)
