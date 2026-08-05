import { readFileSync } from 'node:fs'
import { Pool } from 'pg'
import { env } from '../config/env.ts'

type SourceExercise = {
  prompt: string
  explanation: string
  options: string[]
  correct: number
  wrong_explanations: string[] | null
}

type SourceMission = {
  slug: string
  order_index: number
  title: string
  emblem: string | null
  theory: string
  has_minigame: boolean
  summary: unknown | null
  bibliography: unknown | null
  faqs: unknown | null
  main: SourceExercise | null
  extras: Array<SourceExercise & { slug: string }>
}

type SourceLevel = {
  order_index: number
  title: string
  short_title: string
  missions: SourceMission[]
}

type SourceTrail = {
  slug: string
  title: string
  subtitle: string
  short_title: string
  order_index: number
  levels: SourceLevel[]
}

type SourceShopItem = {
  item_type: string
  code: string
  name: string
  price_shells: number
}

type SeedData = {
  trails: SourceTrail[]
  shopItems: SourceShopItem[]
}

function wrongExplanationAt(raw: string[] | null, index: number): string | null {
  if (!raw) return null
  return raw[index] || null
}

function firstRow<T>(result: { rows: T[] }): T {
  const row = result.rows[0]
  if (!row) throw new Error('Expected INSERT ... RETURNING to return a row')
  return row
}

function toJsonb(value: unknown): string | null {
  return value === null ? null : JSON.stringify(value)
}

const ACCENTS: Record<string, string> = {
  á: 'a',
  à: 'a',
  â: 'a',
  ã: 'a',
  é: 'e',
  ê: 'e',
  í: 'i',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ú: 'u',
  ç: 'c'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàâãéêíóôõúç]/g, (char) => ACCENTS[char] ?? char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const { trails, shopItems }: SeedData = JSON.parse(
  readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8')
)

async function seed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      'TRUNCATE mission_question_options, mission_questions, missions, levels, trails, shop_items RESTART IDENTITY CASCADE'
    )

    for (const item of shopItems) {
      await client.query(
        `INSERT INTO shop_items (item_type, code, name, price_shells)
         VALUES ($1, $2, $3, $4)`,
        [item.item_type, item.code, item.name, item.price_shells]
      )
    }

    for (const trail of trails) {
      const trailRow = await client.query<{ id: number }>(
        `INSERT INTO trails (slug, title, subtitle, short_title, order_index)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [trail.slug, trail.title, trail.subtitle, trail.short_title, trail.order_index]
      )
      const trailId = firstRow(trailRow).id

      for (const level of trail.levels) {
        const levelRow = await client.query<{ id: number }>(
          `INSERT INTO levels (trail_id, slug, title, short_title, order_index)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [trailId, slugify(level.short_title), level.title, level.short_title, level.order_index]
        )
        const levelId = firstRow(levelRow).id

        for (const mission of level.missions) {
          const missionRow = await client.query<{ id: number }>(
            `INSERT INTO missions (level_id, slug, title, emblem, theory, has_minigame, summary, bibliography, faqs, order_index)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [
              levelId,
              mission.slug,
              mission.title,
              mission.emblem,
              mission.theory,
              mission.has_minigame,
              toJsonb(mission.summary),
              toJsonb(mission.bibliography),
              toJsonb(mission.faqs),
              mission.order_index
            ]
          )
          const missionId = firstRow(missionRow).id

          const questions = [
            ...(mission.main
              ? [
                  {
                    slug: `${mission.slug}-main`,
                    kind: 'main' as const,
                    maxRewardShells: 12,
                    ...mission.main
                  }
                ]
              : []),
            ...mission.extras.map((e) => ({ kind: 'extra' as const, maxRewardShells: 3, ...e }))
          ]

          for (const [questionIndex, question] of questions.entries()) {
            const questionRow = await client.query<{ id: number }>(
              `INSERT INTO mission_questions (mission_id, slug, kind, prompt, explanation, max_reward_shells, order_index)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
              [
                missionId,
                question.slug,
                question.kind,
                question.prompt,
                question.explanation,
                question.maxRewardShells,
                questionIndex
              ]
            )
            const questionId = firstRow(questionRow).id

            for (const [optionIndex, label] of question.options.entries()) {
              await client.query(
                `INSERT INTO mission_question_options (question_id, label, is_correct, order_index, wrong_explanation)
               VALUES ($1, $2, $3, $4, $5)`,
                [
                  questionId,
                  label,
                  optionIndex === question.correct,
                  optionIndex,
                  wrongExplanationAt(question.wrong_explanations, optionIndex)
                ]
              )
            }
          }
        }
      }
    }

    await client.query('COMMIT')

    const counts = await client.query<{ table_name: string; count: string }>(
      `SELECT 'trails' AS table_name, count(*)::text FROM trails
       UNION ALL SELECT 'levels', count(*)::text FROM levels
       UNION ALL SELECT 'missions', count(*)::text FROM missions
       UNION ALL SELECT 'mission_questions', count(*)::text FROM mission_questions
       UNION ALL SELECT 'mission_question_options', count(*)::text FROM mission_question_options
       UNION ALL SELECT 'shop_items', count(*)::text FROM shop_items`
    )
    console.log('Seed concluído:')
    for (const row of counts.rows) {
      console.log(`  ${row.table_name}: ${row.count}`)
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
