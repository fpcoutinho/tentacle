import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { dto } from './upsert-mission-bookmark.dto.ts'
import { service } from './upsert-mission-bookmark.service.ts'

export async function upsertMissionBookmark(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const params = dto.request.params(req.params)
  const payload = dto.request.body(req.body)
  const result = await service.execute(req.user.id, params.slug, payload.data)

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
