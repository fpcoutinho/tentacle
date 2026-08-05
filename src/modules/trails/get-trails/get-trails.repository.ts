import { pool } from '../../../db/client.ts'

export type TrailRow = {
  id: number
  slug: string
  title: string
  subtitle: string
  short_title: string
  order_index: number
}

export async function findAllTrails(): Promise<TrailRow[]> {
  const result = await pool.query<TrailRow>(
    'SELECT id, slug, title, subtitle, short_title, order_index FROM trails ORDER BY order_index'
  )
  return result.rows
}
