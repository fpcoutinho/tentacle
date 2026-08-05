import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { SubmissionRow } from './create-mission-submission.repository.ts'
import { schema } from './create-mission-submission.schema.ts'

export const dto = {
  request: {
    headers: (input: unknown) => schema.request.headers.parse(input),
    params: (input: unknown) => schema.request.params.parse(input),
    body: (input: unknown) => schema.request.body.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (row: SubmissionRow) =>
      schema.response.body.parse({
        isCorrect: row.is_correct,
        attemptNumber: row.attempt_number,
        earnedShells: row.earned_shells,
        correctOptionId: row.correct_option_id,
        explanation: row.explanation,
        wrongExplanation: row.wrong_explanation,
        shellBalance: row.shell_balance
      })
  }
}
