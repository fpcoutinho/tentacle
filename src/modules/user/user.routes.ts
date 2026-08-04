import { Router } from 'express'
import { createUser } from './create-user/create-user.controller.ts'
import { getUserBalance } from './get-user-balance/get-user-balance.controller.ts'
import { getUserProfile } from './get-user-profile/get-user-profile.controller.ts'
import { purchaseShopItem } from './purchase-shop-item/purchase-shop-item.controller.ts'
import { updateActiveAvatarItem } from './update-active-avatar-item/update-active-avatar-item.controller.ts'
import { updateUserProfile } from './update-user-profile/update-user-profile.controller.ts'

export const userRouter = Router()

userRouter.post('/', createUser)
userRouter.get('/', getUserProfile)
userRouter.patch('/', updateUserProfile)
userRouter.get('/balance', getUserBalance)
userRouter.post('/inventory', purchaseShopItem)
userRouter.patch('/avatar/active', updateActiveAvatarItem)
