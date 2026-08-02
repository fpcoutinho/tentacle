import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

import { logger } from '../../config/logger.ts'
import { HTTP_STATUS } from '../constants.ts'
import { APIError } from './api-error.ts'

export const errorHandlerMiddleware: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof ZodError) {
    logger.warn({ err: error }, 'Request validation failed')
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        details: error.issues
      }
    })
    return
  }

  if (error instanceof APIError) {
    logger.warn({ err: error }, 'Request failed')
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {})
      }
    })
    return
  }

  logger.error({ err: error }, 'Unhandled request error')
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: { code: 'internal_error', message: 'Internal server error' }
  })
}
