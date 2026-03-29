import type { Dimensions } from '../../shared/types.js'

export type ObstacleKind = 'cactus-small' | 'cactus-large' | 'bird'

export interface Player {
  y: number
  velocityY: number
  isJumping: boolean
  isDucking: boolean
}

export interface Obstacle {
  x: number
  kind: ObstacleKind
  width: number
  height: number
}

export interface DinoState {
  player: Player
  obstacles: Array<Obstacle>
  score: number
  isGameOver: boolean
  gameArea: Dimensions
  groundY: number
  scrollSpeed: number
  tickCount: number
  spawnCooldown: number
  spawnSequenceIndex: number
  gravity: number
  jumpStrength: number
}

export interface DinoInput {
  jump: boolean
  duck: boolean
}

export function createInitialState(args: { gameArea: Dimensions }): DinoState {
  const { gameArea } = args
  const groundY = gameArea.height - 3

  return {
    player: {
      y: groundY,
      velocityY: 0,
      isJumping: false,
      isDucking: false,
    },
    obstacles: [],
    score: 0,
    isGameOver: false,
    gameArea,
    groundY,
    scrollSpeed: 1,
    tickCount: 0,
    spawnCooldown: 0,
    spawnSequenceIndex: 0,
    gravity: 0.6,
    jumpStrength: -3,
  }
}
