import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

import { APIError } from './api-error.ts'

export function validateRequest(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body
    })

    if (!result.success) {
      throw new APIError(400, 'validation_error', 'Request validation failed', result.error.issues)
    }

    next()
  }
}
