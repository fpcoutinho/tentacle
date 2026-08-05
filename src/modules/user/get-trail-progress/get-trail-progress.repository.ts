import { pool } from '../../../db/client.ts'

export type LevelProgressRow = {
  level_id: number
  level_order_index: number
  total_missions: number
  missions_completed: number
}

export async function findLevelProgressByTrailId(
  trailId: number,
  userId: string
): Promise<LevelProgressRow[]> {
  const result = await pool.query<LevelProgressRow>(
    `SELECT
       l.id AS level_id,
       l.order_index AS level_order_index,
       COUNT(m.id)::int AS total_missions,
       COUNT(umc.mission_id)::int AS missions_completed
     FROM levels l
     LEFT JOIN missions m ON m.level_id = l.id
     LEFT JOIN user_mission_completions umc ON umc.mission_id = m.id AND umc.user_id = $2
     WHERE l.trail_id = $1
     GROUP BY l.id
     ORDER BY l.order_index`,
    [trailId, userId]
  )
  return result.rows
}

export async function findCompletedMissionIdsByTrailId(
  trailId: number,
  userId: string
): Promise<number[]> {
  const result = await pool.query<{ mission_id: number }>(
    `SELECT m.id AS mission_id
     FROM missions m
     JOIN levels l ON l.id = m.level_id
     JOIN user_mission_completions umc ON umc.mission_id = m.id AND umc.user_id = $2
     WHERE l.trail_id = $1`,
    [trailId, userId]
  )
  return result.rows.map((row) => row.mission_id)
}
