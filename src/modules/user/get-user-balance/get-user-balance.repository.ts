import { pool } from '../../../db/client.ts'

export const SHELL_BALANCE_SQL = `
  COALESCE(
    (SELECT balance_after FROM shell_ledger sl WHERE sl.user_id = $1 ORDER BY sl.id DESC LIMIT 1),
    0
  )
`

export type UserBalanceRow = {
  id: string
  shell_balance: number
}

export async function findUserBalanceById(id: string): Promise<UserBalanceRow | undefined> {
  const result = await pool.query<UserBalanceRow>(
    `SELECT u.id, ${SHELL_BALANCE_SQL} AS shell_balance
     FROM users u
     WHERE u.id = $1`,
    [id]
  )

  return result.rows[0]
}
