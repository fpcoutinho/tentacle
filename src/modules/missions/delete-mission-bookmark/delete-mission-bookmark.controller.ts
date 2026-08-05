import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { dto } from './delete-mission-bookmark.dto.ts'
import { service } from './delete-mission-bookmark.service.ts'

export async function deleteMissionBookmark(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const params = dto.request.params(req.params)
  await service.execute(req.user.id, params.slug)

  res.status(HTTP_STATUS.NO_CONTENT).send()
}
