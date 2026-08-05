import { baseDto } from '../../../shared/validation/base-dto.ts'
import { schema } from './get-trail-detail.schema.ts'
import type { TrailDetailResult } from './get-trail-detail.service.ts'

export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (result: TrailDetailResult) =>
      schema.response.body.parse({
        trail: {
          id: result.trail.id,
          slug: result.trail.slug,
          title: result.trail.title,
          subtitle: result.trail.subtitle,
          shortTitle: result.trail.short_title,
          orderIndex: result.trail.order_index,
          totalMissions: result.total_missions,
          levels: result.levels.map((level) => ({
            id: level.id,
            slug: level.slug,
            title: level.title,
            shortTitle: level.short_title,
            orderIndex: level.order_index,
            missions: level.missions.map((mission) => ({
              id: mission.id,
              slug: mission.slug,
              title: mission.title,
              emblem: mission.emblem,
              hasMinigame: mission.has_minigame,
              orderIndex: mission.order_index,
              rewardShells: mission.reward_shells
            }))
          }))
        }
      })
  }
}
