import { schema } from './delete-mission-completion.schema.ts'

// 204 não tem corpo, então este endpoint não declara response.
export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input)
  }
}
