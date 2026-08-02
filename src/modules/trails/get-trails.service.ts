import { findAllTrails, type TrailRow } from './get-trails.repository.ts'

export const getTrailsService = {
  execute: async (): Promise<TrailRow[]> => findAllTrails()
}
