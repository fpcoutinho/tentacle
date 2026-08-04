import { pool } from '../../db/client.ts'

export type ShopItemRow = {
  id: number
  item_type: string
  code: string
  name: string
  price_shells: number
  total: number
}

export type FindShopItemsInput = {
  limit: number
  offset: number
  category: string | null
}

export async function findShopItems(input: FindShopItemsInput): Promise<ShopItemRow[]> {
  const result = await pool.query<ShopItemRow>(
    `SELECT id, item_type, code, name, price_shells, COUNT(*) OVER()::int AS total
     FROM shop_items
     WHERE ($1::text IS NULL OR item_type = $1)
     ORDER BY item_type, id
     LIMIT $2 OFFSET $3`,
    [input.category, input.limit, input.offset]
  )

  return result.rows
}
