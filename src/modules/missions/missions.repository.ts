import type { PoolClient } from 'pg'
import { pool } from '../../db/client.ts'

export type MissionRow = {
  id: number
  slug: string
  title: string
  emblem: string | null
  has_minigame: boolean
  order_index: number
}

export async function findMissionBySlug(
  slug: string,
  client: PoolClient | typeof pool = pool
): Promise<MissionRow | undefined> {
  const result = await client.query<MissionRow>(
    'SELECT id, slug, title, emblem, has_minigame, order_index FROM missions WHERE slug = $1',
    [slug]
  )
  return result.rows[0]
}
