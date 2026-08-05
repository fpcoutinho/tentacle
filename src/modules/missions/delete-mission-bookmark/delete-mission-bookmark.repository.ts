import { pool } from '../../../db/client.ts'

export async function deleteBookmark(userId: string, missionId: number): Promise<void> {
  await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND mission_id = $2', [
    userId,
    missionId
  ])
}
