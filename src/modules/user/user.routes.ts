import { Router } from 'express'
import { createUser } from './create-user.controller.ts'
import { getUserProfile } from './get-user-profile.controller.ts'

export const userRouter = Router()

userRouter.post('/', createUser)
userRouter.get('/', getUserProfile)
