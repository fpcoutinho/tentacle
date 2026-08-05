import { Router } from 'express'
import { getTrailDetail } from './get-trail-detail/get-trail-detail.controller.ts'
import { getTrails } from './get-trails/get-trails.controller.ts'

export const trailsRouter = Router()

trailsRouter.get('/', getTrails)
trailsRouter.get('/detail/:trailId', getTrailDetail)
