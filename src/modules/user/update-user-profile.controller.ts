import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'
import { dto } from './update-user-profile.dto.ts'
import { service } from './update-user-profile.service.ts'

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const payload = dto.request.body(req.body)
  const result = await service.execute(req.user.id, {
    name: payload.name ?? null,
    gender: payload.gender ?? null,
    birthDate: payload.birthDate ?? null,
    avatarIdx: payload.avatarIdx ?? null
  })

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
