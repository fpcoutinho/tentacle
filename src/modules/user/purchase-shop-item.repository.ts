import { pool } from '../../db/client.ts'
import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'
import { SHELL_BALANCE_SQL } from './get-user-balance.repository.ts'

export type PurchaseShopItemInput = {
  userId: string
  itemId: number
}

export type PurchaseShopItemRow = {
  inventory_id: number
  item_id: number
  item_type: string
  code: string
  name: string
  price_shells: number
  shell_balance: number
  acquired_at: Date
}

type ShopItemRow = {
  id: number
  item_type: string
  code: string
  name: string
  price_shells: number
}

export async function purchaseShopItem(input: PurchaseShopItemInput): Promise<PurchaseShopItemRow> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const userResult = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [
      input.userId
    ])
    if (!userResult.rows[0]) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'User profile not found')
    }

    const itemResult = await client.query<ShopItemRow>(
      'SELECT id, item_type, code, name, price_shells FROM shop_items WHERE id = $1',
      [input.itemId]
    )
    const item = itemResult.rows[0]
    if (!item) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Shop item not found')
    }

    const balanceResult = await client.query<{ shell_balance: number }>(
      `SELECT ${SHELL_BALANCE_SQL} AS shell_balance`,
      [input.userId]
    )
    const balance = balanceResult.rows[0]?.shell_balance ?? 0

    if (balance < item.price_shells) {
      throw new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'Insufficient shell balance')
    }

    const inventoryResult = await client.query<{ id: number; created_at: Date }>(
      `INSERT INTO user_inventory (user_id, item_id, acquisition_reason)
       VALUES ($1, $2, 'purchase')
       RETURNING id, created_at`,
      [input.userId, item.id]
    )
    const inventoryRow = inventoryResult.rows[0]
    if (!inventoryRow) {
      throw new Error('INSERT INTO user_inventory did not return a row')
    }

    const newBalance = balance - item.price_shells

    if (item.price_shells > 0) {
      await client.query(
        `INSERT INTO shell_ledger (user_id, delta, reason, balance_before, balance_after)
         VALUES ($1, $2, 'purchase', $3, $4)`,
        [input.userId, -item.price_shells, balance, newBalance]
      )
    }

    await client.query('COMMIT')

    return {
      inventory_id: inventoryRow.id,
      item_id: item.id,
      item_type: item.item_type,
      code: item.code,
      name: item.name,
      price_shells: item.price_shells,
      shell_balance: newBalance,
      acquired_at: inventoryRow.created_at
    }
  } catch (error) {
    await client.query('ROLLBACK')

    if (isUniqueViolation(error)) {
      throw new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'Item already owned')
    }
    throw error
  } finally {
    client.release()
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}
