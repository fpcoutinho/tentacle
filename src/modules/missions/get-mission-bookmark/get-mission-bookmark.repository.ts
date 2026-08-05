import { pool } from '../../../db/client.ts'

export type BookmarkData = {
  scrollY: number
  sectionTitle: string
}

export type BookmarkRow = {
  mission_id: number
  data: BookmarkData
  created_at: Date
}

export async function findBookmark(
  userId: string,
  missionId: number
): Promise<BookmarkRow | undefined> {
  const result = await pool.query<BookmarkRow>(
    'SELECT mission_id, data, created_at FROM bookmarks WHERE user_id = $1 AND mission_id = $2',
    [userId, missionId]
  )
  return result.rows[0]
}
