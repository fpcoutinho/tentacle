import { pool } from '../../db/client.ts'

export type TrailRow = {
  id: number
  slug: string
  title: string
  subtitle: string
  short_title: string
  order_index: number
}

export async function findTrailById(trailId: number): Promise<TrailRow | undefined> {
  const result = await pool.query<TrailRow>(
    'SELECT id, slug, title, subtitle, short_title, order_index FROM trails WHERE id = $1',
    [trailId]
  )
  return result.rows[0]
}
