import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findMissionBySlug } from '../missions.repository.ts'
import { deleteMissionCompletion } from './delete-mission-completion.repository.ts'

// Não estorna conchas: desmarcar só reverte user_mission_completions.
// Submissões e o shell_ledger continuam intactos — decisão de produto.
export const service = {
  execute: async (userId: string, missionSlug: string): Promise<void> => {
    const mission = await findMissionBySlug(missionSlug)
    if (!mission) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    await deleteMissionCompletion(userId, mission.id)
  }
}
