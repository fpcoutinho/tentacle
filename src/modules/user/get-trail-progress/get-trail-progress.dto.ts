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
          trailTitle: result.trail_title,
          missionsCompleted: result.missions_completed,
          completedMissionIds: result.completed_mission_ids,
          totalMissions: result.total_missions,
          percent: result.percent,
          levels: result.levels.map((level) => ({
            levelId: level.level_id,
            shortTitle: level.short_title,
            orderIndex: level.order_index,
            missionsCompleted: level.missions_completed,
            totalMissions: level.total_missions,
            percent: level.percent,
            missions: result.missions
              .filter((mission) => mission.level_id === level.level_id)
              .map((mission) => ({
                missionId: mission.mission_id,
                missionSlug: mission.mission_slug,
                missionTitle: mission.mission_title,
                completed: mission.completed,
                shellsEarned: mission.shells_earned,
                extrasCompleted: mission.extras_completed,
                totalExtras: mission.total_extras
              }))
          }))
        }
      })
  }
}
