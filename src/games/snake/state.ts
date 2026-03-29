import type { Position, Dimensions } from '../../shared/types.js'

export type Direction = 'up' | 'down' | 'left' | 'right'

export const INITIAL_SNAKE_LENGTH = 5
export const INITIAL_TICK_INTERVAL = 70

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

function createInitialSnake(args: { gameArea: Dimensions }): Array<Position> {
  const { gameArea } = args
  const snakeLength = Math.max(
    1,
    Math.min(INITIAL_SNAKE_LENGTH, gameArea.width)
  )
  const centerY = Math.min(
    Math.max(Math.floor(gameArea.height / 2), 0),
    Math.max(gameArea.height - 1, 0)
  )
  const headX = Math.min(
    Math.max(gameArea.width - 1, 0),
    Math.max(snakeLength - 1, Math.floor(gameArea.width / 2))
  )

  return Array.from({ length: snakeLength }, (_value, index) => {
    return {
      x: headX - index,
      y: centerY,
    }
  })
}

function createInitialFood(args: {
  gameArea: Dimensions
  snake: Array<Position>
}): Position {
  const { gameArea, snake } = args

  for (let y = 0; y < gameArea.height; y += 1) {
    for (let x = 0; x < gameArea.width; x += 1) {
      const isOnSnake = snake.some((segment) => {
        return segment.x === x && segment.y === y
      })

      if (!isOnSnake) {
        return { x, y }
      }
    }
  }

  return snake[0] ?? { x: 0, y: 0 }
}

export function createInitialState(args: { gameArea: Dimensions }): SnakeState {
  const { gameArea } = args
  const snake = createInitialSnake({ gameArea })

  return {
    snake,
    direction: 'right',
    food: createInitialFood({ gameArea, snake }),
    score: 0,
    isGameOver: false,
    gameArea,
    tickInterval: INITIAL_TICK_INTERVAL,
  }
}
