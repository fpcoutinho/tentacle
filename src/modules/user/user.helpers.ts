import { RANK_THRESHOLDS, RANKS } from './user.constants.ts'

export function resolveRank(trailsCompleted: number): {
  rank: (typeof RANKS)[number]
  avatarsUnlocked: number
} {
  let current: { rank: (typeof RANKS)[number]; avatarsUnlocked: number } = {
    rank: RANKS[0],
    avatarsUnlocked: 1
  }

  RANKS.forEach((rank, index) => {
    const threshold = RANK_THRESHOLDS[index] ?? 0
    if (trailsCompleted >= threshold) {
      current = { rank, avatarsUnlocked: index + 1 }
    }
  })

  return current
}
