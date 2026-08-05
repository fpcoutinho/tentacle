import { describe, expect, it } from 'vitest'

import { isForeignKeyViolation, isUniqueViolation } from './db-error.ts'

describe('isUniqueViolation', () => {
  it('returns true for pg unique violation code', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
  })

  it('returns false for a different code', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false)
  })

  it('returns false for non-object or undefined errors', () => {
    expect(isUniqueViolation(undefined)).toBe(false)
    expect(isUniqueViolation('boom')).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
  })
})

describe('isForeignKeyViolation', () => {
  it('returns true for pg foreign key violation code', () => {
    expect(isForeignKeyViolation({ code: '23503' })).toBe(true)
  })

  it('returns false for a different code', () => {
    expect(isForeignKeyViolation({ code: '23505' })).toBe(false)
  })

  it('returns false for non-object or undefined errors', () => {
    expect(isForeignKeyViolation(undefined)).toBe(false)
    expect(isForeignKeyViolation('boom')).toBe(false)
    expect(isForeignKeyViolation(null)).toBe(false)
  })
})
