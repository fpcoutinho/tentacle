import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { dto } from './get-shop-items.dto.ts'
import { service } from './get-shop-items.service.ts'

export async function getShopItems(req: Request, res: Response): Promise<void> {
  const query = dto.request.query(req.query)
  const result = await service.execute({
    limit: query.limit,
    offset: query.offset,
    category: query.category ?? null
  })

  res.status(HTTP_STATUS.OK).json(
    dto.response.body({
      ...result,
      limit: query.limit,
      offset: query.offset
    })
  )
}
