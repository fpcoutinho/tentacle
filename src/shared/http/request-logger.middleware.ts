import type { NextFunction, Request, Response } from 'express'

import { logger } from '../../config/logger.ts'

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'

    logger[level](
      {
        method: req.method,
        statusCode: res.statusCode,
        url: req.originalUrl
      },
      'HTTP request served'
    )
  })

  next()
}
