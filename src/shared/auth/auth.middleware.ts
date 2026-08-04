import type { RequestHandler } from 'express'

import { env } from '../../config/env.ts'
import { dummyAuthMiddleware } from './dummy-auth.middleware.ts'

export const authMiddleware: RequestHandler = env.FIREBASE_AUTH_ENABLED
  ? (await import('./firebase-auth.middleware.ts')).firebaseAuthMiddleware
  : dummyAuthMiddleware
