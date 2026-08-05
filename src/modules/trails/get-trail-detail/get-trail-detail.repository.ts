import { pool } from '../../../db/client.ts'

export type LevelMissionRow = {
  level_id: number
  level_slug: string
  level_title: string
  level_short_title: string
  level_order_index: number
  mission_id: number | null
  mission_slug: string | null
  mission_title: string | null
  mission_emblem: string | null
  mission_has_minigame: boolean | null
  mission_order_index: number | null
  mission_reward_shells: number | null
}

export async function findLevelsWithMissionsByTrailId(trailId: number): Promise<LevelMissionRow[]> {
  const result = await pool.query<LevelMissionRow>(
    `SELECT
       l.id AS level_id,
       l.slug AS level_slug,
       l.title AS level_title,
       l.short_title AS level_short_title,
       l.order_index AS level_order_index,
       m.id AS mission_id,
       m.slug AS mission_slug,
       m.title AS mission_title,
       m.emblem AS mission_emblem,
       m.has_minigame AS mission_has_minigame,
       m.order_index AS mission_order_index,
       COALESCE(
         (SELECT mq.max_reward_shells FROM mission_questions mq
          WHERE mq.mission_id = m.id AND mq.kind = 'main'),
         0
       ) AS mission_reward_shells
     FROM levels l
     LEFT JOIN missions m ON m.level_id = l.id
     WHERE l.trail_id = $1
     ORDER BY l.order_index, m.order_index`,
    [trailId]
  )
  return result.rows
}
