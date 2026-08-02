import express from 'express'

import { authMiddleware } from './shared/auth/auth.middleware.ts'
import { errorHandlerMiddleware } from './shared/http/error-handler.middleware.ts'
import { requestLoggerMiddleware } from './shared/http/request-logger.middleware.ts'

export const app = express()

app.use(requestLoggerMiddleware)
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
