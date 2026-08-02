import type { ErrorRequestHandler } from 'express'

import { logger } from '../../config/logger.ts'

export const errorHandlerMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error({ err: error }, 'Unhandled request error')

  res.status(500).json({
    error: {
      code: 'internal_server_error',
      message: 'Internal server error'
    }
  })
}
