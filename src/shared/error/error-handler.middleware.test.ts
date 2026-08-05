import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type ZodError, z } from 'zod'

import { HTTP_STATUS } from '../constants.ts'
import { APIError } from './api-error.ts'
import { errorHandlerMiddleware } from './error-handler.middleware.ts'

vi.mock('../../config/logger.ts', () => ({
  logger: { warn: vi.fn(), error: vi.fn() }
}))

function createRes(headersSent = false) {
  return {
    headersSent,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  } as unknown as Response
}

describe('errorHandlerMiddleware', () => {
  const req = {} as Request
  let next: NextFunction

  beforeEach(() => {
    next = vi.fn()
  })

  it('delegates to next when headers were already sent', () => {
    const res = createRes(true)
    const error = new Error('boom')

    errorHandlerMiddleware(error, req, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('responds with 400 validation_error for ZodError', () => {
    const res = createRes()
    let zodError: ZodError
    try {
      z.object({ name: z.string() }).parse({})
      throw new Error('expected zod parse to throw')
    } catch (error) {
      zodError = error as ZodError
    }

    errorHandlerMiddleware(zodError, req, res, next)

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        details: zodError.issues
      }
    })
  })

  it('responds with the APIError statusCode, code, message and details', () => {
    const res = createRes()
    const error = new APIError(HTTP_STATUS.CONFLICT, 'conflict', 'Already exists', { id: 1 })

    errorHandlerMiddleware(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'conflict', message: 'Already exists', details: { id: 1 } }
    })
  })

  it('omits details from the response when the APIError has none', () => {
    const res = createRes()
    const error = new APIError(HTTP_STATUS.NOT_FOUND, 'not_found', 'Trail not found')

    errorHandlerMiddleware(error, req, res, next)

    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'not_found', message: 'Trail not found' }
    })
  })

  it('responds with a generic 500 for unexpected errors without leaking internal details', () => {
    const res = createRes()
    const error = new Error('secret stack trace details')

    errorHandlerMiddleware(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'internal_error', message: 'Internal server error' }
    })
  })
})
