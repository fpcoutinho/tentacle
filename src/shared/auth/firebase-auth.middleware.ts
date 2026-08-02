import type { NextFunction, Request, Response } from 'express'

import { firebaseAuth } from '../../config/firebase.ts'
import { HTTP_STATUS } from '../constants.ts'
import { APIError } from '../error/api-error.ts'
import type { AuthUser } from './auth.types.ts'

export async function firebaseAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authorizationHeader = req.header('authorization')
  const token = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : undefined

  if (!token) {
    throw new APIError(
      HTTP_STATUS.UNAUTHORIZED,
      'unauthorized',
      'Missing Authorization bearer token'
    )
  }

  let decodedToken: Awaited<ReturnType<typeof firebaseAuth.verifyIdToken>>

  try {
    decodedToken = await firebaseAuth.verifyIdToken(token)
  } catch {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Invalid or expired token')
  }

  const user: AuthUser = {
    id: decodedToken.uid,
    provider: 'firebase',
    ...(decodedToken.email ? { email: decodedToken.email } : {})
  }

  req.user = user

  next()
}
