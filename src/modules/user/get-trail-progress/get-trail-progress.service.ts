import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findTrailById } from '../../trails/trails.repository.ts'
import {
  findCompletedMissionIdsByTrailId,
  findLevelProgressByTrailId,
  type LevelProgressRow
} from './get-trail-progress.repository.ts'

function percentOf(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export type LevelProgress = {
  level_id: number
  order_index: number
  missions_completed: number
  total_missions: number
  percent: number
}

export type TrailProgressResult = {
  trail_id: number
  missions_completed: number
  total_missions: number
  percent: number
  levels: LevelProgress[]
  completed_mission_ids: number[]
}

function toLevelProgress(row: LevelProgressRow): LevelProgress {
  return {
    level_id: row.level_id,
    order_index: row.level_order_index,
    missions_completed: row.missions_completed,
    total_missions: row.total_missions,
    percent: percentOf(row.missions_completed, row.total_missions)
  }
}

export const service = {
  execute: async (trailId: number, userId: string): Promise<TrailProgressResult> => {
    const trail = await findTrailById(trailId)
    if (!trail) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Trail not found')
    }

    const [levelRows, completedMissionIds] = await Promise.all([
      findLevelProgressByTrailId(trailId, userId),
      findCompletedMissionIdsByTrailId(trailId, userId)
    ])

    const levels = levelRows.map(toLevelProgress)
    const totalMissions = levels.reduce((sum, level) => sum + level.total_missions, 0)
    const missionsCompleted = levels.reduce((sum, level) => sum + level.missions_completed, 0)

    return {
      trail_id: trail.id,
      missions_completed: missionsCompleted,
      total_missions: totalMissions,
      percent: percentOf(missionsCompleted, totalMissions),
      levels,
      completed_mission_ids: completedMissionIds
    }
  }
}
