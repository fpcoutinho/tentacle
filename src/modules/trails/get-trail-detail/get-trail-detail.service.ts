import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findTrailById, type TrailRow } from '../trails.repository.ts'
import {
  findLevelsWithMissionsByTrailId,
  type LevelMissionRow
} from './get-trail-detail.repository.ts'

export type LevelWithMissions = {
  id: number
  slug: string
  title: string
  short_title: string
  order_index: number
  missions: Array<{
    id: number
    slug: string
    title: string
    emblem: string | null
    has_minigame: boolean
    order_index: number
    reward_shells: number
  }>
}

export type TrailDetailResult = {
  trail: TrailRow
  levels: LevelWithMissions[]
  total_missions: number
}

function groupByLevel(rows: LevelMissionRow[]): LevelWithMissions[] {
  const levels: LevelWithMissions[] = []
  const levelById = new Map<number, LevelWithMissions>()

  for (const row of rows) {
    let level = levelById.get(row.level_id)
    if (!level) {
      level = {
        id: row.level_id,
        slug: row.level_slug,
        title: row.level_title,
        short_title: row.level_short_title,
        order_index: row.level_order_index,
        missions: []
      }
      levelById.set(row.level_id, level)
      levels.push(level)
    }

    if (row.mission_id !== null) {
      level.missions.push({
        id: row.mission_id,
        slug: row.mission_slug as string,
        title: row.mission_title as string,
        emblem: row.mission_emblem,
        has_minigame: row.mission_has_minigame as boolean,
        order_index: row.mission_order_index as number,
        reward_shells: row.mission_reward_shells ?? 0
      })
    }
  }

  return levels
}

export const service = {
  execute: async (trailId: number): Promise<TrailDetailResult> => {
    const trail = await findTrailById(trailId)
    if (!trail) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Trail not found')
    }

    const rows = await findLevelsWithMissionsByTrailId(trailId)
    const levels = groupByLevel(rows)
    const totalMissions = levels.reduce((sum, level) => sum + level.missions.length, 0)

    return { trail, levels, total_missions: totalMissions }
  }
}
