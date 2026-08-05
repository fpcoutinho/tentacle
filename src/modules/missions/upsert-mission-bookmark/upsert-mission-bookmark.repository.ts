import { pool } from '../../../db/client.ts'
import type {
  BookmarkData,
  BookmarkRow
} from '../get-mission-bookmark/get-mission-bookmark.repository.ts'

export async function upsertBookmark(
  userId: string,
  missionId: number,
  data: BookmarkData
): Promise<BookmarkRow> {
  const result = await pool.query<BookmarkRow>(
    `INSERT INTO bookmarks (user_id, mission_id, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, mission_id)
     DO UPDATE SET data = EXCLUDED.data
     RETURNING mission_id, data, created_at`,
    [userId, missionId, JSON.stringify(data)]
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('INSERT INTO bookmarks did not return a row')
  }
  return row
}
