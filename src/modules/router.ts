import { Router } from 'express'
import { shopRouter } from './shop/shop.routes.ts'
import { trailsRouter } from './trails/trails.routes.ts'
import { userRouter } from './user/user.routes.ts'

export const modulesRouter = Router()

modulesRouter.use('/trails', trailsRouter)
modulesRouter.use('/shop', shopRouter)
modulesRouter.use('/user', userRouter)
