import { pool } from '../../../db/client.ts'

export type MissionCompletionRow = {
  mission_id: number
  completed_at: Date
}

// Upsert idempotente: reenviar a conclusão não muda completed_at nem falha.
// O DO UPDATE (no-op) existe só para o RETURNING devolver a linha nos dois casos —
// ON CONFLICT DO NOTHING não retorna nada quando a linha já existe.
export async function completeMission(
  userId: string,
  missionId: number
): Promise<MissionCompletionRow> {
  const result = await pool.query<MissionCompletionRow>(
    `INSERT INTO user_mission_completions (user_id, mission_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, mission_id)
     DO UPDATE SET completed_at = user_mission_completions.completed_at
     RETURNING mission_id, completed_at`,
    [userId, missionId]
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('INSERT INTO user_mission_completions did not return a row')
  }
  return row
}
