import { pool } from '../../db/client.ts'
import { HTTP_STATUS } from '../../shared/constants.ts'
import { APIError } from '../../shared/error/api-error.ts'

export type UpdateUserProfileInput = {
  name: string | null
  gender: string | null
  birthDate: string | null
  avatarIdx: number | null
}

export type UpdateUserProfileRow = {
  name: string
  gender: string | null
  birth_date: Date | null
  avatar_idx: number
}

export async function updateUserProfile(
  id: string,
  input: UpdateUserProfileInput
): Promise<UpdateUserProfileRow> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const userResult = await client.query<{
      name: string
      gender: string | null
      birth_date: Date | null
    }>(
      `UPDATE users
       SET name = COALESCE($2, name),
           gender = COALESCE($3, gender),
           birth_date = COALESCE($4, birth_date),
           updated_at = now()
       WHERE id = $1
       RETURNING name, gender, birth_date`,
      [id, input.name, input.gender, input.birthDate]
    )

    const userRow = userResult.rows[0]
    if (!userRow) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'User profile not found')
    }

    let avatarIdx = 0
    if (input.avatarIdx !== null) {
      const avatarResult = await client.query<{ avatar_idx: number }>(
        'UPDATE user_avatar_settings SET avatar_idx = $2 WHERE user_id = $1 RETURNING avatar_idx',
        [id, input.avatarIdx]
      )
      avatarIdx = avatarResult.rows[0]?.avatar_idx ?? input.avatarIdx
    } else {
      const avatarRow = await client.query<{ avatar_idx: number }>(
        'SELECT COALESCE(avatar_idx, 0) AS avatar_idx FROM user_avatar_settings WHERE user_id = $1',
        [id]
      )
      avatarIdx = avatarRow.rows[0]?.avatar_idx ?? 0
    }

    await client.query('COMMIT')

    return {
      name: userRow.name,
      gender: userRow.gender,
      birth_date: userRow.birth_date,
      avatar_idx: avatarIdx
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
