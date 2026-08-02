import { app } from './app.ts'
import { env } from './config/env.ts'
import { checkDatabaseConnection, pool } from './db/client.ts'

await checkDatabaseConnection()

const server = app.listen(env.PORT, () => {
  console.log(
    JSON.stringify({
      message: 'Server is running',
      port: env.PORT
    })
  )
})

async function shutdown(signal: string): Promise<void> {
  console.log(JSON.stringify({ message: 'Shutting down', signal }))
  server.close()
  await pool.end()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
