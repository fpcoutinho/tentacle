import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../shared/constants.ts'
import { getTrailsDto } from './get-trails.dto.ts'
import { getTrailsService } from './get-trails.service.ts'

export async function getTrails(req: Request, res: Response): Promise<void> {
  getTrailsDto.request.parse({
    headers: req.headers,
    params: req.params,
    query: req.query,
    body: req.body
  })

  const result = await getTrailsService.execute()
  const body = getTrailsDto.response.parse(result)

  res.status(HTTP_STATUS.OK).json(body)
}
