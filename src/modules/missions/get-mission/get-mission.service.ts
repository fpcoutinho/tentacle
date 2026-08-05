import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import {
  findMissionWithQuestionsBySlug,
  type MissionQuestionOptionRow
} from './get-mission.repository.ts'

export type QuestionOption = {
  id: number
  label: string
  order_index: number
}

export type MissionQuestion = {
  id: number
  slug: string
  kind: string
  prompt: string
  max_reward_shells: number
  order_index: number
  options: QuestionOption[]
}

export type MissionResult = {
  id: number
  slug: string
  title: string
  emblem: string | null
  theory: string
  has_minigame: boolean
  summary: unknown | null
  bibliography: unknown | null
  faqs: unknown | null
  order_index: number
  questions: MissionQuestion[]
}

function groupQuestions(rows: MissionQuestionOptionRow[]): MissionQuestion[] {
  const questions: MissionQuestion[] = []
  const questionById = new Map<number, MissionQuestion>()

  for (const row of rows) {
    if (row.question_id === null) continue

    let question = questionById.get(row.question_id)
    if (!question) {
      question = {
        id: row.question_id,
        slug: row.question_slug as string,
        kind: row.question_kind as string,
        prompt: row.question_prompt as string,
        max_reward_shells: row.question_max_reward_shells as number,
        order_index: row.question_order_index as number,
        options: []
      }
      questionById.set(row.question_id, question)
      questions.push(question)
    }

    if (row.option_id !== null) {
      question.options.push({
        id: row.option_id,
        label: row.option_label as string,
        order_index: row.option_order_index as number
      })
    }
  }

  return questions
}

export const service = {
  execute: async (slug: string): Promise<MissionResult> => {
    const rows = await findMissionWithQuestionsBySlug(slug)
    const first = rows[0]
    if (!first) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    return {
      id: first.mission_id,
      slug: first.mission_slug,
      title: first.mission_title,
      emblem: first.mission_emblem,
      theory: first.mission_theory,
      has_minigame: first.mission_has_minigame,
      summary: first.mission_summary,
      bibliography: first.mission_bibliography,
      faqs: first.mission_faqs,
      order_index: first.mission_order_index,
      questions: groupQuestions(rows)
    }
  }
}
