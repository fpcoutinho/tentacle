import { pool } from '../../../db/client.ts'

// Deliberadamente sem is_correct e sem wrong_explanation: o gabarito nunca
// trafega para o cliente, ele só aparece na resposta de uma submissão já gravada.
export type MissionQuestionOptionRow = {
  mission_id: number
  mission_slug: string
  mission_title: string
  mission_emblem: string | null
  mission_theory: string
  mission_has_minigame: boolean
  mission_summary: unknown | null
  mission_bibliography: unknown | null
  mission_faqs: unknown | null
  mission_order_index: number
  question_id: number | null
  question_slug: string | null
  question_kind: string | null
  question_prompt: string | null
  question_max_reward_shells: number | null
  question_order_index: number | null
  option_id: number | null
  option_label: string | null
  option_order_index: number | null
}

export async function findMissionWithQuestionsBySlug(
  slug: string
): Promise<MissionQuestionOptionRow[]> {
  const result = await pool.query<MissionQuestionOptionRow>(
    `SELECT
       m.id AS mission_id,
       m.slug AS mission_slug,
       m.title AS mission_title,
       m.emblem AS mission_emblem,
       m.theory AS mission_theory,
       m.has_minigame AS mission_has_minigame,
       m.summary AS mission_summary,
       m.bibliography AS mission_bibliography,
       m.faqs AS mission_faqs,
       m.order_index AS mission_order_index,
       q.id AS question_id,
       q.slug AS question_slug,
       q.kind AS question_kind,
       q.prompt AS question_prompt,
       q.max_reward_shells AS question_max_reward_shells,
       q.order_index AS question_order_index,
       o.id AS option_id,
       o.label AS option_label,
       o.order_index AS option_order_index
     FROM missions m
     LEFT JOIN mission_questions q ON q.mission_id = m.id
     LEFT JOIN mission_question_options o ON o.question_id = q.id
     WHERE m.slug = $1
     ORDER BY q.order_index, o.order_index`,
    [slug]
  )
  return result.rows
}
