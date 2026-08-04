import { Router } from 'express'
import { getShopItems } from './get-shop-items/get-shop-items.controller.ts'

export const shopRouter = Router()

shopRouter.get('/items', getShopItems)
