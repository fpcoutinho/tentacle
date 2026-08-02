import { createBaseDto } from '../../shared/http/base-dto.ts'
import type { TrailRow } from './get-trails.repository.ts'
import { getTrailsSchema } from './get-trails.schema.ts'

const baseDto = createBaseDto(getTrailsSchema)

export const getTrailsDto = {
  ...baseDto,
  response: {
    parse: (trails: TrailRow[]) => {
      const { body } = baseDto.response.parse({
        body: {
          trails: trails.map((trail) => ({
            id: trail.id,
            slug: trail.slug,
            title: trail.title,
            shortTitle: trail.short_title,
            orderIndex: trail.order_index
          }))
        }
      })

      return body
    }
  }
}
