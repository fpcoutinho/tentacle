import type { z } from 'zod'

export function createBaseDto<Req extends z.ZodTypeAny, Res extends z.ZodTypeAny>(schema: {
  request: Req
  response: Res
}) {
  return {
    request: {
      parse: (input: unknown): z.infer<Req> => schema.request.parse(input)
    },
    response: {
      parse: (input: unknown): z.infer<Res> => schema.response.parse(input)
    }
  }
}
