import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { findTrailById } from '../../trails/trails.repository.ts'
import {
  findCompletedMissionIdsByTrailId,
  findLevelProgressByTrailId,
  findMissionProgressByTrailId,
  type LevelProgressRow,
  type MissionProgressRow
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

export type MissionProgress = {
  mission_id: number
  mission_slug: string
  level_id: number
  completed: boolean
  shells_earned: number
  extras_completed: number
  total_extras: number
}

export type TrailProgressResult = {
  trail_id: number
  missions_completed: number
  total_missions: number
  percent: number
  levels: LevelProgress[]
  missions: MissionProgress[]
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

function toMissionProgress(row: MissionProgressRow): MissionProgress {
  return {
    mission_id: row.mission_id,
    mission_slug: row.mission_slug,
    level_id: row.level_id,
    completed: row.completed,
    shells_earned: row.shells_earned,
    extras_completed: row.extras_completed,
    total_extras: row.total_extras
  }
}

export const service = {
  execute: async (trailId: number, userId: string): Promise<TrailProgressResult> => {
    const trail = await findTrailById(trailId)
    if (!trail) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Trail not found')
    }

    const [levelRows, missionRows, completedMissionIds] = await Promise.all([
      findLevelProgressByTrailId(trailId, userId),
      findMissionProgressByTrailId(trailId, userId),
      findCompletedMissionIdsByTrailId(trailId, userId)
    ])

    const levels = levelRows.map(toLevelProgress)
    const missions = missionRows.map(toMissionProgress)
    const totalMissions = levels.reduce((sum, level) => sum + level.total_missions, 0)
    const missionsCompleted = levels.reduce((sum, level) => sum + level.missions_completed, 0)

    return {
      trail_id: trail.id,
      missions_completed: missionsCompleted,
      total_missions: totalMissions,
      percent: percentOf(missionsCompleted, totalMissions),
      levels,
      missions,
      completed_mission_ids: completedMissionIds
    }
  }
}
