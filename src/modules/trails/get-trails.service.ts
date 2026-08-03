import { findAllTrails, type TrailRow } from './get-trails.repository.ts'

export const service = {
  execute: async (): Promise<TrailRow[]> => findAllTrails()
}
