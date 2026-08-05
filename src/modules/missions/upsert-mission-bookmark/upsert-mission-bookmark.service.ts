import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import type {
  BookmarkData,
  BookmarkRow
} from '../get-mission-bookmark/get-mission-bookmark.repository.ts'
import { findMissionBySlug } from '../missions.repository.ts'
import { upsertBookmark } from './upsert-mission-bookmark.repository.ts'

export const service = {
  execute: async (
    userId: string,
    missionSlug: string,
    data: BookmarkData
  ): Promise<BookmarkRow> => {
    const mission = await findMissionBySlug(missionSlug)
    if (!mission) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    return upsertBookmark(userId, mission.id, data)
  }
}
