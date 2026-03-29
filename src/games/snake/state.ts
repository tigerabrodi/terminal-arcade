import type { Position, Dimensions } from '../../shared/types.js'

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface SnakeState {
  snake: Array<Position>
  direction: Direction
  food: Position
  score: number
  isGameOver: boolean
  gameArea: Dimensions
  tickInterval: number
}

export interface SnakeInput {
  direction: Direction | null
}

export function createInitialState(args: { gameArea: Dimensions }): SnakeState {
  const { gameArea } = args
  const centerX = Math.floor(gameArea.width / 2)
  const centerY = Math.floor(gameArea.height / 2)

  return {
    snake: [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ],
    direction: 'right',
    food: { x: centerX + 5, y: centerY },
    score: 0,
    isGameOver: false,
    gameArea,
    tickInterval: 150,
  }
}
