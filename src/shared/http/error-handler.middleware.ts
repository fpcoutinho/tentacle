import type { ErrorRequestHandler } from 'express'

import { logger } from '../../config/logger.ts'
import { APIError } from './api-error.ts'

export const errorHandlerMiddleware: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof APIError) {
    logger.warn({ err: error }, 'Request failed')
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message }
    })
    return
  }

  logger.error({ err: error }, 'Unhandled request error')
  res.status(500).json({
    error: { code: 'internal_error', message: 'Internal server error' }
  })
}
