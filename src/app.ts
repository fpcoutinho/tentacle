import cors from 'cors'
import express from 'express'
import { pinoHttp } from 'pino-http'

import { env } from './config/env.ts'
import { logger } from './config/logger.ts'
import { modulesRouter } from './modules/router.ts'
import { authMiddleware } from './shared/auth/auth.middleware.ts'
import { HTTP_STATUS } from './shared/constants.ts'
import { errorHandlerMiddleware } from './shared/error/error-handler.middleware.ts'

export const app = express()
app.disable('etag')

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim())

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)
app.use(pinoHttp({ logger }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ok' })
})

const v1Router = express.Router()

v1Router.use(authMiddleware)
v1Router.use(modulesRouter)

app.use('/api/v1', v1Router)

app.use(errorHandlerMiddleware)
