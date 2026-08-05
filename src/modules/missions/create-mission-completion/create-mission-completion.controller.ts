import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { dto } from './create-mission-completion.dto.ts'
import { service } from './create-mission-completion.service.ts'

// 200 (e não 201) porque o endpoint é idempotente: reenviar devolve a conclusão
// já existente, sem criar recurso novo.
export async function createMissionCompletion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const params = dto.request.params(req.params)
  const result = await service.execute(req.user.id, params.slug)

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
