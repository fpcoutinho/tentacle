import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TrailRow } from './get-trails.repository.ts'
import { service } from './get-trails.service.ts'

const { findAllTrails } = vi.hoisted(() => ({ findAllTrails: vi.fn() }))

vi.mock('./get-trails.repository.ts', () => ({ findAllTrails }))

describe('get-trails service', () => {
  beforeEach(() => {
    findAllTrails.mockReset()
  })

  it('returns the trails from the repository as-is', async () => {
    const trails: TrailRow[] = [
      {
        id: 1,
        slug: 'ocean-basics',
        title: 'Ocean Basics',
        subtitle: 'Learn the fundamentals',
        short_title: 'Basics',
        order_index: 0
      }
    ]
    findAllTrails.mockResolvedValue(trails)

    const result = await service.execute()

    expect(result).toBe(trails)
    expect(findAllTrails).toHaveBeenCalledOnce()
  })
})
