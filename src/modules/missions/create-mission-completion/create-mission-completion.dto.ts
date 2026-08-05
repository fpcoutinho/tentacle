import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { MissionCompletionRow } from './create-mission-completion.repository.ts'
import { schema } from './create-mission-completion.schema.ts'

export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (row: MissionCompletionRow) =>
      schema.response.body.parse({
        missionId: row.mission_id,
        completedAt: row.completed_at
      })
  }
}
