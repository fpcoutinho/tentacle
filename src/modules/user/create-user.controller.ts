import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'
import { dto } from './create-user.dto.ts'
import { service } from './create-user.service.ts'

export async function createUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const payload = dto.request.body(req.body)
  const result = await service.execute({
    id: req.user.id,
    name: payload.name,
    gender: payload.gender ?? null,
    email: payload.email,
    birthDate: payload.birthDate ?? null
  })

  res.status(HTTP_STATUS.CREATED).json(dto.response.body(result))
}
