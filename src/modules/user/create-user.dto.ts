import { baseDto } from '../../shared/validation/base-dto.ts'
import type { UserRow } from './create-user.repository.ts'
import { schema } from './create-user.schema.ts'

export const dto = {
  request: {
    body: (input: unknown) => schema.request.body.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (user: UserRow) =>
      schema.response.body.parse({
        id: user.id,
        name: user.name,
        gender: user.gender,
        email: user.email,
        birthDate: user.birth_date ? user.birth_date.toISOString().slice(0, 10) : null,
        shellBalance: user.shell_balance
      })
  }
}
