import { baseDto } from '../../../shared/validation/base-dto.ts'
import { schema } from './get-mission-progress.schema.ts'
import type { MissionProgressResult } from './get-mission-progress.service.ts'

export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (result: MissionProgressResult) =>
      schema.response.body.parse({
        progress: {
          missionId: result.mission_id,
          missionSlug: result.mission_slug,
          completed: result.completed,
          shellsEarned: result.shells_earned,
          questions: result.questions.map((question) => ({
            questionId: question.question_id,
            questionSlug: question.question_slug,
            kind: question.question_kind,
            attemptCount: question.attempt_count,
            answeredCorrectly: question.answered_correctly,
            earnedShells: question.earned_shells
          }))
        }
      })
  }
}
