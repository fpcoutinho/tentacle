import pino, { type LoggerOptions } from 'pino'

import { env } from './env.ts'

const loggerOptions: LoggerOptions =
  env.NODE_ENV === 'development'
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard'
          }
        }
      }
    : {
        level: 'info'
      }

export const logger = pino(loggerOptions)
