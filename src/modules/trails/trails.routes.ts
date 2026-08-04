import { Router } from 'express'
import { getTrails } from './get-trails/get-trails.controller.ts'

export const trailsRouter = Router()

trailsRouter.get('/', getTrails)
