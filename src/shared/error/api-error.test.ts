import { describe, expect, it } from 'vitest'

import { APIError } from './api-error.ts'

describe('APIError', () => {
  it('populates statusCode, code, message and details', () => {
    const error = new APIError(404, 'not_found', 'Trail not found', { trailId: 1 })

    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('not_found')
    expect(error.message).toBe('Trail not found')
    expect(error.details).toEqual({ trailId: 1 })
  })

  it('leaves details undefined when not provided', () => {
    const error = new APIError(409, 'conflict', 'Already exists')

    expect(error.details).toBeUndefined()
  })

  it('is an instance of Error', () => {
    const error = new APIError(500, 'internal_error', 'Something broke')

    expect(error).toBeInstanceOf(Error)
  })
})
