import { Router } from 'express'
import { getTrailsRouter } from './trails/get-trails.routes.ts'

export const modulesRouter = Router()

modulesRouter.use('/trails', getTrailsRouter)
