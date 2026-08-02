import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1)
})

export const env = envSchema.parse(process.env)
