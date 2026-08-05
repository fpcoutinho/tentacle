import {
  createMissionSubmission,
  type SubmissionRow
} from './create-mission-submission.repository.ts'

export type CreateSubmissionPayload = {
  missionSlug: string
  questionSlug: string
  answerOptionId: number
  idempotencyKey: string | null
}

export const service = {
  execute: async (userId: string, payload: CreateSubmissionPayload): Promise<SubmissionRow> =>
    createMissionSubmission({
      userId,
      missionSlug: payload.missionSlug,
      questionSlug: payload.questionSlug,
      answerOptionId: payload.answerOptionId,
      idempotencyKey: payload.idempotencyKey
    })
}
