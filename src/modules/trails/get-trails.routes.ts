import { Router } from 'express'
import { getTrails } from './get-trails.controller.ts'

export const getTrailsRouter = Router()

getTrailsRouter.get('/', getTrails)
