import { Router } from 'express'
import { createUser } from './create-user.controller.ts'
import { getUserBalance } from './get-user-balance.controller.ts'
import { getUserProfile } from './get-user-profile.controller.ts'
import { purchaseShopItem } from './purchase-shop-item.controller.ts'
import { updateUserProfile } from './update-user-profile.controller.ts'

export const userRouter = Router()

userRouter.post('/', createUser)
userRouter.get('/', getUserProfile)
userRouter.patch('/', updateUserProfile)
userRouter.get('/balance', getUserBalance)
userRouter.post('/inventory', purchaseShopItem)
