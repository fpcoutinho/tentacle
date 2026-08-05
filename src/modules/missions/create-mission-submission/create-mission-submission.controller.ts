import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { dto } from './create-mission-submission.dto.ts'
import { service } from './create-mission-submission.service.ts'

export async function createMissionSubmission(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new APIError(HTTP_STATUS.UNAUTHORIZED, 'unauthorized', 'Missing authenticated user')
  }

  const headers = dto.request.headers(req.headers)
  const params = dto.request.params(req.params)
  const payload = dto.request.body(req.body)

  const result = await service.execute(req.user.id, {
    missionSlug: params.slug,
    questionSlug: params.questionSlug,
    answerOptionId: payload.answerOptionId,
    idempotencyKey: headers['idempotency-key'] ?? null
  })

  res.status(HTTP_STATUS.CREATED).json(dto.response.body(result))
}
