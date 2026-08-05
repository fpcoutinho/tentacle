import { pool } from '../../../db/client.ts'

export type LevelProgressRow = {
  level_id: number
  level_short_title: string
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
       l.short_title AS level_short_title,
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

export type MissionProgressRow = {
  mission_id: number
  mission_slug: string
  mission_title: string
  level_id: number
  completed: boolean
  shells_earned: number
  extras_completed: number
  total_extras: number
}

// Agregado por missão pra telas que renderizam as 29 missões de uma vez
// (Trilha, Conquistas, ExerciciosPage) sem precisar de uma chamada por missão.
// Subqueries correlacionadas em vez de LEFT JOIN direto em user_submissions
// evitam fanout (uma missão tem várias perguntas, cada uma com várias tentativas).
export async function findMissionProgressByTrailId(
  trailId: number,
  userId: string
): Promise<MissionProgressRow[]> {
  const result = await pool.query<MissionProgressRow>(
    `SELECT
       m.id AS mission_id,
       m.slug AS mission_slug,
       m.title AS mission_title,
       m.level_id,
       EXISTS(
         SELECT 1 FROM user_mission_completions umc
         WHERE umc.mission_id = m.id AND umc.user_id = $2
       ) AS completed,
       COALESCE(
         (SELECT SUM(s.earned_shells) FROM user_submissions s
          JOIN mission_questions q ON q.id = s.question_id
          WHERE q.mission_id = m.id AND s.user_id = $2 AND s.is_correct),
         0
       )::int AS shells_earned,
       COALESCE(
         (SELECT COUNT(*) FROM mission_questions q
          WHERE q.mission_id = m.id AND q.kind = 'extra'
            AND EXISTS(
              SELECT 1 FROM user_submissions s
              WHERE s.question_id = q.id AND s.user_id = $2 AND s.is_correct
            )),
         0
       )::int AS extras_completed,
       (SELECT COUNT(*) FROM mission_questions q
        WHERE q.mission_id = m.id AND q.kind = 'extra')::int AS total_extras
     FROM missions m
     JOIN levels l ON l.id = m.level_id
     WHERE l.trail_id = $1
     ORDER BY l.order_index, m.order_index`,
    [trailId, userId]
  )
  return result.rows
}
