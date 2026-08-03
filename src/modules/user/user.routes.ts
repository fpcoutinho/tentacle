import { Router } from 'express'
import { createUser } from './create-user.controller.ts'

export const userRouter = Router()

userRouter.post('/', createUser)
