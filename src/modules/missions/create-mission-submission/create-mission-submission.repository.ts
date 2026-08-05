import type { PoolClient } from 'pg'
import { pool } from '../../../db/client.ts'
import { HTTP_STATUS } from '../../../shared/constants.ts'
import { APIError } from '../../../shared/error/api-error.ts'
import { isUniqueViolation } from '../../../shared/error/db-error.ts'
import { shellBalanceQuery } from '../../user/user.repository.ts'
import { findMissionBySlug } from '../missions.repository.ts'

// Curvas de recompensa por número da tentativa (índice 0 = 1ª tentativa).
// O último valor vale para todas as tentativas seguintes.
// O primeiro valor de cada curva precisa continuar igual ao max_reward_shells
// gravado pelo seed (12 para 'main', 3 para 'extra') — não há constraint que force isso.
const REWARD_CURVE = {
  main: [12, 8, 4],
  extra: [3, 2, 1, 0]
} as const

const LEDGER_REASON = {
  main: 'mission_reward',
  extra: 'exercise_reward'
} as const

type QuestionKind = keyof typeof REWARD_CURVE

function rewardFor(kind: QuestionKind, attemptNumber: number): number {
  const curve = REWARD_CURVE[kind]
  const index = Math.min(attemptNumber - 1, curve.length - 1)
  return curve[index] ?? 0
}

export type CreateSubmissionInput = {
  userId: string
  missionSlug: string
  questionSlug: string
  answerOptionId: number
  idempotencyKey: string | null
}

export type SubmissionRow = {
  is_correct: boolean
  attempt_number: number
  earned_shells: number
  correct_option_id: number
  explanation: string
  wrong_explanation: string | null
  shell_balance: number
}

type QuestionRow = {
  id: number
  kind: string
  explanation: string
}

type ExistingSubmissionRow = {
  is_correct: boolean
  attempt_number: number
  earned_shells: number
  answer_option_id: number
}

export async function createMissionSubmission(
  input: CreateSubmissionInput
): Promise<SubmissionRow> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Serializa submissões concorrentes do mesmo usuário (duplo-clique).
    const userResult = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [
      input.userId
    ])
    if (!userResult.rows[0]) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'User profile not found')
    }

    const mission = await findMissionBySlug(input.missionSlug, client)
    if (!mission) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Mission not found')
    }

    const questionResult = await client.query<QuestionRow>(
      'SELECT id, kind, explanation FROM mission_questions WHERE slug = $1 AND mission_id = $2',
      [input.questionSlug, mission.id]
    )
    const question = questionResult.rows[0]
    if (!question) {
      throw new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Question not found for this mission')
    }

    const correctResult = await client.query<{ id: number }>(
      'SELECT id FROM mission_question_options WHERE question_id = $1 AND is_correct = true',
      [question.id]
    )
    const correctOptionId = correctResult.rows[0]?.id
    if (correctOptionId === undefined) {
      throw new APIError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'internal_error',
        'Question has no correct option'
      )
    }

    const answerResult = await client.query<{ id: number; wrong_explanation: string | null }>(
      'SELECT id, wrong_explanation FROM mission_question_options WHERE id = $1 AND question_id = $2',
      [input.answerOptionId, question.id]
    )
    const answer = answerResult.rows[0]
    if (!answer) {
      throw new APIError(
        HTTP_STATUS.NOT_FOUND,
        'not_found',
        'Answer option not found for this question'
      )
    }

    // Replay idempotente: mesma chave já gravada devolve a submissão original,
    // sem nova tentativa e sem premiar de novo.
    if (input.idempotencyKey !== null) {
      const replayResult = await client.query<ExistingSubmissionRow>(
        `SELECT is_correct, attempt_number, earned_shells, answer_option_id
         FROM user_submissions
         WHERE user_id = $1 AND idempotency_key = $2`,
        [input.userId, input.idempotencyKey]
      )
      const replay = replayResult.rows[0]
      if (replay) {
        const balance = await currentBalance(client, input.userId)
        const replayWrongExplanation = await wrongExplanationFor(
          client,
          replay.answer_option_id,
          question.id
        )

        await client.query('COMMIT')

        return {
          is_correct: replay.is_correct,
          attempt_number: replay.attempt_number,
          earned_shells: replay.earned_shells,
          correct_option_id: correctOptionId,
          explanation: question.explanation,
          wrong_explanation: replay.is_correct ? null : replayWrongExplanation,
          shell_balance: balance
        }
      }
    }

    const alreadyCorrectResult = await client.query(
      `SELECT 1 FROM user_submissions
       WHERE user_id = $1 AND question_id = $2 AND is_correct = true`,
      [input.userId, question.id]
    )
    if (alreadyCorrectResult.rows[0]) {
      throw new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'Question already answered correctly')
    }

    const attemptsResult = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM user_submissions WHERE user_id = $1 AND question_id = $2',
      [input.userId, question.id]
    )
    const attemptNumber = (attemptsResult.rows[0]?.count ?? 0) + 1

    const isCorrect = input.answerOptionId === correctOptionId
    const kind = question.kind as QuestionKind
    const earnedShells = isCorrect ? rewardFor(kind, attemptNumber) : 0

    await client.query(
      `INSERT INTO user_submissions
         (user_id, question_id, answer_option_id, attempt_number, is_correct, earned_shells, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.userId,
        question.id,
        input.answerOptionId,
        attemptNumber,
        isCorrect,
        earnedShells,
        input.idempotencyKey
      ]
    )

    const balanceBefore = await currentBalance(client, input.userId)
    let balanceAfter = balanceBefore

    if (earnedShells > 0) {
      balanceAfter = balanceBefore + earnedShells
      await client.query(
        `INSERT INTO shell_ledger (user_id, delta, reason, balance_before, balance_after)
         VALUES ($1, $2, $3, $4, $5)`,
        [input.userId, earnedShells, LEDGER_REASON[kind], balanceBefore, balanceAfter]
      )
    }

    await client.query('COMMIT')

    return {
      is_correct: isCorrect,
      attempt_number: attemptNumber,
      earned_shells: earnedShells,
      correct_option_id: correctOptionId,
      explanation: question.explanation,
      wrong_explanation: isCorrect ? null : answer.wrong_explanation,
      shell_balance: balanceAfter
    }
  } catch (error) {
    await client.query('ROLLBACK')

    if (isUniqueViolation(error)) {
      throw new APIError(
        HTTP_STATUS.CONFLICT,
        'conflict',
        'Submission already registered for this question'
      )
    }
    throw error
  } finally {
    client.release()
  }
}

async function currentBalance(client: PoolClient, userId: string): Promise<number> {
  const result = await client.query<{ shell_balance: number }>(
    `SELECT ${shellBalanceQuery()} AS shell_balance`,
    [userId]
  )
  return result.rows[0]?.shell_balance ?? 0
}

async function wrongExplanationFor(
  client: PoolClient,
  optionId: number,
  questionId: number
): Promise<string | null> {
  const result = await client.query<{ wrong_explanation: string | null }>(
    'SELECT wrong_explanation FROM mission_question_options WHERE id = $1 AND question_id = $2',
    [optionId, questionId]
  )
  return result.rows[0]?.wrong_explanation ?? null
}
