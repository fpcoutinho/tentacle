import { app } from './app.ts'
import { env } from './config/env.ts'
import { logger } from './config/logger.ts'
import { checkDatabaseConnection, pool } from './db/client.ts'

await checkDatabaseConnection()

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Server is running')
})

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down')
  server.close()
  await pool.end()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
