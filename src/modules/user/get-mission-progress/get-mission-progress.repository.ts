import { pool } from '../../../db/client.ts'

export type QuestionProgressRow = {
  question_id: number
  question_slug: string
  question_kind: string
  attempt_count: number
  answered_correctly: boolean
  earned_shells: number
}

export async function findQuestionProgressByMissionId(
  missionId: number,
  userId: string
): Promise<QuestionProgressRow[]> {
  const result = await pool.query<QuestionProgressRow>(
    `SELECT
       q.id AS question_id,
       q.slug AS question_slug,
       q.kind AS question_kind,
       COALESCE(COUNT(s.id), 0)::int AS attempt_count,
       COALESCE(BOOL_OR(s.is_correct), false) AS answered_correctly,
       COALESCE(SUM(s.earned_shells) FILTER (WHERE s.is_correct), 0)::int AS earned_shells
     FROM mission_questions q
     LEFT JOIN user_submissions s ON s.question_id = q.id AND s.user_id = $2
     WHERE q.mission_id = $1
     GROUP BY q.id
     ORDER BY q.order_index`,
    [missionId, userId]
  )
  return result.rows
}

export async function isMissionCompleted(missionId: number, userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM user_mission_completions WHERE user_id = $1 AND mission_id = $2',
    [userId, missionId]
  )
  return result.rows.length > 0
}
