import { pool } from '../../db/client.ts'

export function shellBalanceQuery(userIdParam = '$1'): string {
  return `
    COALESCE(
      (SELECT balance_after FROM shell_ledger sl WHERE sl.user_id = ${userIdParam} ORDER BY sl.id DESC LIMIT 1),
      0
    )
  `
}

export function trailsCompletedQuery(userIdParam = '$1'): string {
  return `
    SELECT COUNT(*)::int AS count FROM trails t
    WHERE (SELECT COUNT(*) FROM missions m WHERE m.trail_id = t.id) > 0
      AND (SELECT COUNT(*) FROM missions m WHERE m.trail_id = t.id) = (
        SELECT COUNT(*) FROM missions m
        JOIN user_mission_completions umc ON umc.mission_id = m.id AND umc.user_id = ${userIdParam}
        WHERE m.trail_id = t.id
      )
  `
}

export async function countTrailsCompleted(id: string): Promise<number> {
  const result = await pool.query<{ count: number }>(trailsCompletedQuery(), [id])
  return result.rows[0]?.count ?? 0
}
