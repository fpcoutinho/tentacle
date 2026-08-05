import { baseDto } from '../../../shared/validation/base-dto.ts'
import { schema } from './get-trail-progress.schema.ts'
import type { TrailProgressResult } from './get-trail-progress.service.ts'

export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (result: TrailProgressResult) =>
      schema.response.body.parse({
        progress: {
          trailId: result.trail_id,
          missionsCompleted: result.missions_completed,
          totalMissions: result.total_missions,
          percent: result.percent,
          levels: result.levels.map((level) => ({
            levelId: level.level_id,
            orderIndex: level.order_index,
            missionsCompleted: level.missions_completed,
            totalMissions: level.total_missions,
            percent: level.percent
          })),
          completedMissionIds: result.completed_mission_ids
        }
      })
  }
}
