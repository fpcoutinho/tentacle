import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { UpdateUserProfileRow } from './update-user-profile.repository.ts'
import { schema } from './update-user-profile.schema.ts'

export const dto = {
  request: {
    body: (input: unknown) => schema.request.body.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (profile: UpdateUserProfileRow) =>
      schema.response.body.parse({
        name: profile.name,
        gender: profile.gender,
        avatarIdx: profile.avatar_idx,
        birthDate: profile.birth_date ? profile.birth_date.toISOString().slice(0, 10) : null
      })
  }
}
