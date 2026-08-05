import { Router } from 'express'
import { getTrailDetail } from './get-trail-detail/get-trail-detail.controller.ts'
import { getTrailProgress } from './get-trail-progress/get-trail-progress.controller.ts'
import { getTrails } from './get-trails/get-trails.controller.ts'

export const trailsRouter = Router()

trailsRouter.get('/', getTrails)
trailsRouter.get('/detail/:trailId', getTrailDetail)
trailsRouter.get('/progress/:trailId', getTrailProgress)
