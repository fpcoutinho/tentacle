import { pool } from '../../../db/client.ts'

export async function deleteMissionCompletion(userId: string, missionId: number): Promise<void> {
  await pool.query('DELETE FROM user_mission_completions WHERE user_id = $1 AND mission_id = $2', [
    userId,
    missionId
  ])
}
