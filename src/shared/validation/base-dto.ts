import { baseSchema } from './base-schema.ts'

export const baseDto = {
  request: {
    headers: (input: unknown = {}) => baseSchema.request.headers.parse(input),
    params: (input: unknown = {}) => baseSchema.request.params.parse(input),
    query: (input: unknown = {}) => baseSchema.request.query.parse(input),
    body: (input: unknown = {}) => baseSchema.request.body.parse(input)
  },
  response: {
    headers: (input: unknown = {}) => baseSchema.response.headers.parse(input),
    body: (input: unknown = {}) => baseSchema.response.body.parse(input)
  }
}
