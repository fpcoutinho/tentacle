import { beforeEach, describe, expect, it, vi } from 'vitest'

import { APIError } from '../../../shared/error/api-error.ts'
import type { TrailRow } from '../trails.repository.ts'
import type { LevelMissionRow } from './get-trail-detail.repository.ts'
import { service } from './get-trail-detail.service.ts'

const { findTrailById, findLevelsWithMissionsByTrailId } = vi.hoisted(() => ({
  findTrailById: vi.fn(),
  findLevelsWithMissionsByTrailId: vi.fn()
}))

vi.mock('../trails.repository.ts', () => ({ findTrailById }))
vi.mock('./get-trail-detail.repository.ts', () => ({ findLevelsWithMissionsByTrailId }))

const trail: TrailRow = {
  id: 1,
  slug: 'ocean-basics',
  title: 'Ocean Basics',
  subtitle: 'Learn the fundamentals',
  short_title: 'Basics',
  order_index: 0
}

function levelMissionRow(overrides: Partial<LevelMissionRow>): LevelMissionRow {
  return {
    level_id: 1,
    level_slug: 'level-1',
    level_title: 'Level 1',
    level_short_title: 'L1',
    level_order_index: 0,
    mission_id: null,
    mission_slug: null,
    mission_title: null,
    mission_emblem: null,
    mission_has_minigame: null,
    mission_order_index: null,
    mission_reward_shells: null,
    ...overrides
  }
}

describe('get-trail-detail service', () => {
  beforeEach(() => {
    findTrailById.mockReset()
    findLevelsWithMissionsByTrailId.mockReset()
  })

  it('throws not_found when the trail does not exist', async () => {
    findTrailById.mockResolvedValue(undefined)

    await expect(service.execute(999)).rejects.toThrow(APIError)
    expect(findLevelsWithMissionsByTrailId).not.toHaveBeenCalled()
  })

  it('groups mission rows by level and counts total missions', async () => {
    findTrailById.mockResolvedValue(trail)
    findLevelsWithMissionsByTrailId.mockResolvedValue([
      levelMissionRow({
        mission_id: 10,
        mission_slug: 'find-nemo',
        mission_title: 'Find Nemo',
        mission_has_minigame: true,
        mission_order_index: 0,
        mission_reward_shells: 5
      }),
      levelMissionRow({
        mission_id: 11,
        mission_slug: 'find-dory',
        mission_title: 'Find Dory',
        mission_has_minigame: false,
        mission_order_index: 1,
        mission_reward_shells: null
      }),
      levelMissionRow({ level_id: 2, level_slug: 'level-2', level_title: 'Level 2' })
    ])

    const result = await service.execute(1)

    expect(result.trail).toBe(trail)
    expect(result.total_missions).toBe(2)
    expect(result.levels).toHaveLength(2)
    expect(result.levels[0]?.missions).toEqual([
      {
        id: 10,
        slug: 'find-nemo',
        title: 'Find Nemo',
        emblem: null,
        has_minigame: true,
        order_index: 0,
        reward_shells: 5
      },
      {
        id: 11,
        slug: 'find-dory',
        title: 'Find Dory',
        emblem: null,
        has_minigame: false,
        order_index: 1,
        reward_shells: 0
      }
    ])
    expect(result.levels[1]?.missions).toEqual([])
  })
})
