import { Pool } from 'pg'
import { env } from '../config/env.ts'
import { logger } from '../config/logger.ts'

const isServerless = env.RUNTIME_MODE === 'serverless'

const isLocalDatabase =
  env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1')

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
  max: isServerless ? 1 : 10
})

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected error on idle database client')

  if (isServerless) {
    return
  }

  process.exit(1)
})

export async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1')
}
