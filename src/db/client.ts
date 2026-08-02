import { Pool } from 'pg'
import { env } from '../config/env.ts'
import { logger } from '../config/logger.ts'

export const pool = new Pool({ connectionString: env.DATABASE_URL })

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected error on idle database client')
  process.exit(1)
})

export async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1')
}
