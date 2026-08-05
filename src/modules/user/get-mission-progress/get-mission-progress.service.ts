import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findMissionBySlug } from '../../missions/missions.repository.ts'
import {
  findQuestionProgressByMissionId,
  isMissionCompleted,
  type QuestionProgressRow
} from './get-mission-progress.repository.ts'

export type MissionProgressResult = {
  mission_id: number
  mission_slug: string
  completed: boolean
  shells_earned: number
  questions: QuestionProgressRow[]
}

export const service = {
  execute: async (userId: string, missionSlug: string): Promise<MissionProgressResult> => {
    const mission = await findMissionBySlug(missionSlug)
    if (!mission) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    const [questions, completed] = await Promise.all([
      findQuestionProgressByMissionId(mission.id, userId),
      isMissionCompleted(mission.id, userId)
    ])

    const shellsEarned = questions.reduce((sum, question) => sum + question.earned_shells, 0)

    return {
      mission_id: mission.id,
      mission_slug: mission.slug,
      completed,
      shells_earned: shellsEarned,
      questions
    }
  }
}
