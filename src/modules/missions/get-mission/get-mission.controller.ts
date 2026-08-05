import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { dto } from './get-mission.dto.ts'
import { service } from './get-mission.service.ts'

export async function getMission(req: Request, res: Response): Promise<void> {
  const params = dto.request.params(req.params)
  const result = await service.execute(params.slug)

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
