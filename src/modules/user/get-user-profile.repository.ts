import { pool } from '../../db/client.ts'

export type UserProfileRow = {
  id: string
  name: string
  gender: string | null
  shell_balance: number
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
       u.shell_balance,
       COALESCE(a.avatar_idx, 0) AS avatar_idx,
       (SELECT COUNT(*)::int FROM user_mission_completions umc WHERE umc.user_id = u.id) AS missions_completed,
       (SELECT COUNT(*)::int FROM missions) AS total_missions,
       (
         SELECT COUNT(*)::int FROM trails t
         WHERE (SELECT COUNT(*) FROM missions m WHERE m.trail_id = t.id) > 0
           AND (SELECT COUNT(*) FROM missions m WHERE m.trail_id = t.id) = (
             SELECT COUNT(*) FROM missions m
             JOIN user_mission_completions umc ON umc.mission_id = m.id AND umc.user_id = u.id
             WHERE m.trail_id = t.id
           )
       ) AS trails_completed
     FROM users u
     LEFT JOIN user_avatar_settings a ON a.user_id = u.id
     WHERE u.id = $1`,
    [id]
  )

  return result.rows[0]
}
