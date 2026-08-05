import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findMissionBySlug } from '../missions.repository.ts'
import { type BookmarkRow, findBookmark } from './get-mission-bookmark.repository.ts'

// Devolve null (com 200) quando não há bookmark: "não marcado" é estado normal
// no front, não erro — 404 forçaria tratamento de exceção para o caso comum.
export const service = {
  execute: async (userId: string, missionSlug: string): Promise<BookmarkRow | null> => {
    const mission = await findMissionBySlug(missionSlug)
    if (!mission) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    return (await findBookmark(userId, mission.id)) ?? null
  }
}
