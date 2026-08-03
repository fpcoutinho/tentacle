import type { Request, Response } from 'express'

import { HTTP_STATUS } from '../../shared/constants.ts'
import { dto } from './get-trails.dto.ts'
import { service } from './get-trails.service.ts'

export async function getTrails(_req: Request, res: Response): Promise<void> {
  const result = await service.execute()

  res.status(HTTP_STATUS.OK).json(dto.response.body(result))
}
