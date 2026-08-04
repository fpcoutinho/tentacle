import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'
import { dto } from './get-user-profile.dto.ts'
import { service } from './get-user-profile.service.ts'

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const result = await service.execute(req.user.id)

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
