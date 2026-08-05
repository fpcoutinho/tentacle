import { baseDto } from '../../../shared/validation/base-dto.ts'
import type { TrailRow } from './get-trails.repository.ts'
import { schema } from './get-trails.schema.ts'

export const dto = {
  response: {
    ...baseDto.response,
    body: (trails: TrailRow[]) =>
      schema.response.body.parse({
        trails: trails.map((trail) => ({
          id: trail.id,
          slug: trail.slug,
          title: trail.title,
          subtitle: trail.subtitle,
          shortTitle: trail.short_title,
          orderIndex: trail.order_index
        }))
      })
  }
}
