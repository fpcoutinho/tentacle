import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { BookmarkRow } from '../get-mission-bookmark/get-mission-bookmark.repository.ts'
import { schema } from './upsert-mission-bookmark.schema.ts'

export const dto = {
  request: {
    params: (input: unknown) => schema.request.params.parse(input),
    body: (input: unknown) => schema.request.body.parse(input)
  },
  response: {
    ...baseDto.response,
    body: (row: BookmarkRow) =>
      schema.response.body.parse({
        bookmark: {
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
