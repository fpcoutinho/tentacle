import express from 'express'
import { pinoHttp } from 'pino-http'

import { logger } from './config/logger.ts'
import { modulesRouter } from './modules/router.ts'
import { authMiddleware } from './shared/auth/auth.middleware.ts'
import { HTTP_STATUS } from './shared/constants.ts'
import { errorHandlerMiddleware } from './shared/http/error-handler.middleware.ts'

export const app = express()

app.use(pinoHttp({ logger }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ok' })
})

const v1Router = express.Router()

v1Router.use(authMiddleware)

v1Router.get('/me', (req, res) => {
  res.status(HTTP_STATUS.OK).json({ user: req.user })
})

v1Router.use(modulesRouter)

app.use('/api/v1', v1Router)

app.use(errorHandlerMiddleware)
