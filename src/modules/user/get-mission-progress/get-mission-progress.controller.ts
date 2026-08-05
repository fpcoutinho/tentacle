import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { dto } from './get-mission-progress.dto.ts'
import { service } from './get-mission-progress.service.ts'

export async function getMissionProgress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const params = dto.request.params(req.params)
  const result = await service.execute(req.user.id, params.slug)

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
