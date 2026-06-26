import type { NextFunction, Request, Response } from 'express'

import type { AuthUser } from './auth.types.ts'

export function fakeAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.header('x-dev-user-id')
  const userEmail = req.header('x-dev-user-email')

  if (!userId) {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Missing x-dev-user-id header'
      }
    })

    return
  }

  const user: AuthUser = {
    id: userId,
    provider: 'dev',
    ...(userEmail ? { email: userEmail } : {})
  }

  req.user = user

  next()
}