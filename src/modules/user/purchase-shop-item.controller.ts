import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'
import { dto } from './purchase-shop-item.dto.ts'
import { service } from './purchase-shop-item.service.ts'

export async function purchaseShopItem(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const payload = dto.request.body(req.body)
  const result = await service.execute(req.user.id, payload)

  res.status(HTTP_STATUS.CREATED).json(dto.response.body(result))
}
