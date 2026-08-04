import { pool } from '../../../db/client.ts'
import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'

export type UserRow = {
  id: string
  name: string
  gender: string | null
  email: string
  birth_date: Date | null
  created_at: Date
  updated_at: Date
}

export type CreateUserInput = {
  id: string
  name: string
  gender: string | null
  email: string
  birthDate: string | null
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query<UserRow>(
      `INSERT INTO users (id, name, gender, email, birth_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, gender, email, birth_date, created_at, updated_at`,
      [input.id, input.name, input.gender, input.email, input.birthDate]
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('INSERT INTO users did not return a row')
    }

    await client.query('INSERT INTO user_avatar_settings (user_id) VALUES ($1)', [input.id])

    await client.query('COMMIT')

    return row
  } catch (error) {
    await client.query('ROLLBACK')

    if (isUniqueViolation(error)) {
      throw new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'User profile already exists')
    }
    throw error
  } finally {
    client.release()
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}
