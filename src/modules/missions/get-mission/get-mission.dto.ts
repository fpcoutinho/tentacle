import { baseDto } from '../../../shared/validation/base-dto.ts'
import { schema } from './get-mission.schema.ts'
import type { MissionResult } from './get-mission.service.ts'

export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (mission: MissionResult) =>
      schema.response.body.parse({
        mission: {
          id: mission.id,
          slug: mission.slug,
          title: mission.title,
          emblem: mission.emblem,
          theory: mission.theory,
          hasMinigame: mission.has_minigame,
          summary: mission.summary,
          bibliography: mission.bibliography,
          faqs: mission.faqs,
          orderIndex: mission.order_index,
          questions: mission.questions.map((question) => ({
            id: question.id,
            slug: question.slug,
            kind: question.kind,
            prompt: question.prompt,
            maxRewardShells: question.max_reward_shells,
            orderIndex: question.order_index,
            options: question.options.map((option) => ({
              id: option.id,
              label: option.label,
              orderIndex: option.order_index
            }))
          }))
        }
      })
  }
}
