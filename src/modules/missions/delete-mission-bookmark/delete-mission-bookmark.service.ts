import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findMissionBySlug } from '../missions.repository.ts'
import { deleteBookmark } from './delete-mission-bookmark.repository.ts'

// Idempotente: apagar bookmark inexistente responde 204 do mesmo jeito.
export const service = {
  execute: async (userId: string, missionSlug: string): Promise<void> => {
    const mission = await findMissionBySlug(missionSlug)
    if (!mission) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    await deleteBookmark(userId, mission.id)
  }
}
