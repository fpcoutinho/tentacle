import type { NextFunction, Request, Response } from 'express'

import { HTTP_STATUS } from '../constants.ts'
import { APIError } from '../error/api-error.ts'
import type { AuthUser } from './auth.types.ts'

export function dummyAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authorizationHeader = req.header('authorization')
  const userId = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length)
    : undefined

  if (!userId) {
    throw new APIError(
      HTTP_STATUS.UNAUTHORIZED,
      'unauthorized',
      'Missing Authorization bearer token'
    )
  }

  const user: AuthUser = {
    id: userId,
    provider: 'dev'
  }

  req.user = user

  next()
}
