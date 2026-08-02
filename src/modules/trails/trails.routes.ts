import { Router } from 'express'
import { getTrails } from './get-trails.controller.ts'

export const trailsRouter = Router()

trailsRouter.get('/', getTrails)
