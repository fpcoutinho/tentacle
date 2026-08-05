import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { dto } from './get-trail-detail.dto.ts'
import { service } from './get-trail-detail.service.ts'

export async function getTrailDetail(req: Request, res: Response): Promise<void> {
  const params = dto.request.params(req.params)
  const result = await service.execute(params.trailId)

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
