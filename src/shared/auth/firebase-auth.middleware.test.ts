import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { APIError } from '../error/api-error.ts'
import { firebaseAuthMiddleware } from './firebase-auth.middleware.ts'

const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }))

vi.mock('../../config/firebase.ts', () => ({
  firebaseAuth: { verifyIdToken }
}))

function createReq(authorizationHeader?: string): Request {
  return {
    header: (name: string) => (name === 'authorization' ? authorizationHeader : undefined)
  } as unknown as Request
}

describe('firebaseAuthMiddleware', () => {
  beforeEach(() => {
    verifyIdToken.mockReset()
  })

  it('throws unauthorized when the Authorization header is missing', async () => {
    const req = createReq()
    const next = vi.fn() as NextFunction

    await expect(firebaseAuthMiddleware(req, {} as Response, next)).rejects.toThrow(APIError)
    expect(verifyIdToken).not.toHaveBeenCalled()
  })

  it('sets req.user from the decoded token and calls next', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'firebase-uid-1', email: 'user@example.com' })
    const req = createReq('Bearer valid-token')
    const next = vi.fn() as NextFunction

    await firebaseAuthMiddleware(req, {} as Response, next)

    expect(req.user).toEqual({
      id: 'firebase-uid-1',
      provider: 'firebase',
      email: 'user@example.com'
    })
    expect(next).toHaveBeenCalledOnce()
  })

  it('omits email from req.user when the decoded token has none', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'firebase-uid-2' })
    const req = createReq('Bearer valid-token')
    const next = vi.fn() as NextFunction

    await firebaseAuthMiddleware(req, {} as Response, next)

    expect(req.user).toEqual({ id: 'firebase-uid-2', provider: 'firebase' })
  })

  it('throws unauthorized when token verification fails', async () => {
    verifyIdToken.mockRejectedValue(new Error('invalid token'))
    const req = createReq('Bearer bad-token')
    const next = vi.fn() as NextFunction

    await expect(firebaseAuthMiddleware(req, {} as Response, next)).rejects.toThrow(APIError)
    expect(next).not.toHaveBeenCalled()
  })
})
