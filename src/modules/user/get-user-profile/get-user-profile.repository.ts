import { pool } from '../../../db/client.ts'
import { trailsCompletedQuery } from '../user.repository.ts'

export type UserProfileRow = {
  id: string
  name: string
  gender: string | null
  avatar_idx: number
  missions_completed: number
  total_missions: number
  trails_completed: number
}

export async function findUserProfileById(id: string): Promise<UserProfileRow | undefined> {
  const result = await pool.query<UserProfileRow>(
    `SELECT
       u.id,
       u.name,
       u.gender,
       COALESCE(a.avatar_idx, 0) AS avatar_idx,
       (SELECT COUNT(*)::int FROM user_mission_completions umc WHERE umc.user_id = u.id) AS missions_completed,
       (SELECT COUNT(*)::int FROM missions) AS total_missions,
       (${trailsCompletedQuery()}) AS trails_completed
     FROM users u
     LEFT JOIN user_avatar_settings a ON a.user_id = u.id
     WHERE u.id = $1`,
    [id]
  )

  return result.rows[0]
}
