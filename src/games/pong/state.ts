import type { Dimensions } from '../../shared/types.js'

export interface Paddle {
  y: number
  height: number
}

export interface Ball {
  x: number
  y: number
  velocityX: number
  velocityY: number
}

export interface PongState {
  player: Paddle
  cpu: Paddle
  ball: Ball
  playerScore: number
  cpuScore: number
  winner: 'player' | 'cpu' | null
  isGameOver: boolean
  gameArea: Dimensions
  paddleSpeed: number
  ballSpeed: number
  maxScore: number
}

export interface PongInput {
  direction: 'up' | 'down' | null
}

export function createInitialState(args: { gameArea: Dimensions }): PongState {
  const { gameArea } = args
  const paddleHeight = Math.max(3, Math.floor(gameArea.height / 5))

  return {
    player: {
      y: Math.floor((gameArea.height - paddleHeight) / 2),
      height: paddleHeight,
    },
    cpu: {
      y: Math.floor((gameArea.height - paddleHeight) / 2),
      height: paddleHeight,
    },
    ball: {
      x: Math.floor(gameArea.width / 2),
      y: Math.floor(gameArea.height / 2),
      velocityX: 1,
      velocityY: 0.5,
    },
    playerScore: 0,
    cpuScore: 0,
    winner: null,
    isGameOver: false,
    gameArea,
    paddleSpeed: 5,
    ballSpeed: 3.5,
    maxScore: 5,
  }
}
