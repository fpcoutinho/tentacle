import { Pool } from 'pg'
import { env } from '../config/env.ts'

export const pool = new Pool({ connectionString: env.DATABASE_URL })

pool.on('error', (error) => {
  console.error(
    JSON.stringify({ message: 'Unexpected error on idle database client', error: error.message })
  )
  process.exit(1)
})

export async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1')
}
