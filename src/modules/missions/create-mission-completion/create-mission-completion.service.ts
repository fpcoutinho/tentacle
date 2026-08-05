import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findMissionBySlug } from '../missions.repository.ts'
import {
  completeMission,
  type MissionCompletionRow
} from './create-mission-completion.repository.ts'

// Concluir não exige ter acertado a pergunta principal: `user_mission_completions`
// existe separada de `user_submissions` justamente porque há missão sem pergunta
// principal (ex.: a missão de abertura `1-0`), que ficaria impossível de concluir.
export const service = {
  execute: async (userId: string, missionSlug: string): Promise<MissionCompletionRow> => {
    const mission = await findMissionBySlug(missionSlug)
    if (!mission) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    return completeMission(userId, mission.id)
  }
}
