import express from 'express'
import { pinoHttp } from 'pino-http'

import { logger } from './config/logger.ts'
import { authMiddleware } from './shared/auth/auth.middleware.ts'
import { errorHandlerMiddleware } from './shared/http/error-handler.middleware.ts'

export const app = express()

app.use(pinoHttp({ logger }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok'
  })
})

const v1Router = express.Router()

v1Router.use(authMiddleware)

v1Router.get('/me', (req, res) => {
  res.status(200).json({
    user: req.user
  })
})

app.use('/api/v1', v1Router)

app.use(errorHandlerMiddleware)
