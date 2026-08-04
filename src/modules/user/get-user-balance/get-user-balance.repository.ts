import { pool } from '../../../db/client.ts'
import { shellBalanceQuery } from '../user.repository.ts'

export type UserBalanceRow = {
  id: string
  shell_balance: number
}

export async function findUserBalanceById(id: string): Promise<UserBalanceRow | undefined> {
  const result = await pool.query<UserBalanceRow>(
    `SELECT u.id, ${shellBalanceQuery()} AS shell_balance
     FROM users u
     WHERE u.id = $1`,
    [id]
  )

  return result.rows[0]
}
