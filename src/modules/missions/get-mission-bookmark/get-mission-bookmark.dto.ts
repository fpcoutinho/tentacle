import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { BookmarkRow } from './get-mission-bookmark.repository.ts'
import { schema } from './get-mission-bookmark.schema.ts'

export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (row: BookmarkRow | null) =>
      schema.response.body.parse({
        bookmark:
          row === null
            ? null
            : {
                missionId: row.mission_id,
                data: {
                  scrollY: row.data.scrollY,
                  sectionTitle: row.data.sectionTitle
                },
                createdAt: row.created_at
              }
      })
  }
}
