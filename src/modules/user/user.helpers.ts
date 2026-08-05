import { RANK_THRESHOLDS, RANKS } from './user.constants.ts'

export function resolveRank(levelsCompleted: number): {
  rank: (typeof RANKS)[number]
  level: number
  avatarsUnlocked: number
} {
  let current: { rank: (typeof RANKS)[number]; level: number; avatarsUnlocked: number } = {
    rank: RANKS[0],
    level: 1,
    avatarsUnlocked: 1
  }

  RANKS.forEach((rank, index) => {
    const threshold = RANK_THRESHOLDS[index] ?? 0
    if (levelsCompleted >= threshold) {
      current = { rank, level: index + 1, avatarsUnlocked: index + 1 }
    }
  })

  return current
}
