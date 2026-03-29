import type { Position } from '../../shared/types.js'
import type { Direction, SnakeInput, SnakeState } from './state.js'

export function isOppositeDirection(args: {
  current: Direction
  next: Direction
}): boolean {
  const { current, next } = args

  return (
    (current === 'up' && next === 'down') ||
    (current === 'down' && next === 'up') ||
    (current === 'left' && next === 'right') ||
    (current === 'right' && next === 'left')
  )
}

function resolveDirection(args: {
  current: Direction
  next: SnakeInput['direction']
}): Direction {
  const { current, next } = args

  if (next === null || isOppositeDirection({ current, next })) {
    return current
  }

  return next
}

export function getNextHead(args: {
  head: Position
  direction: Direction
}): Position {
  const { head, direction } = args

  switch (direction) {
    case 'up':
      return { x: head.x, y: head.y - 1 }
    case 'down':
      return { x: head.x, y: head.y + 1 }
    case 'left':
      return { x: head.x - 1, y: head.y }
    case 'right':
      return { x: head.x + 1, y: head.y }
  }
}

export function spawnFood(args: {
  state: SnakeState
  random: number
}): Position | null {
  const { state, random } = args
  const freeCells: Array<Position> = []

  for (let y = 0; y < state.gameArea.height; y += 1) {
    for (let x = 0; x < state.gameArea.width; x += 1) {
      const isOccupied = state.snake.some((segment) => {
        return segment.x === x && segment.y === y
      })

      if (!isOccupied) {
        freeCells.push({ x, y })
      }
    }
  }

  if (freeCells.length === 0) {
    return null
  }

  const clampedRandom = Math.min(Math.max(random, 0), 0.999999999999)
  const foodIndex = Math.floor(clampedRandom * freeCells.length)

  return freeCells[foodIndex]!
}

function calculateTickInterval(args: { score: number }): number {
  const { score } = args
  const speedLevel = Math.floor(score / 5)

  return Math.max(60, 150 - speedLevel * 10)
}

export function checkCollision(args: {
  state: SnakeState
  nextHead: Position
  hasEatenFood: boolean
}): boolean {
  const { state, nextHead, hasEatenFood } = args
  const isWallCollision =
    nextHead.x < 0 ||
    nextHead.x >= state.gameArea.width ||
    nextHead.y < 0 ||
    nextHead.y >= state.gameArea.height

  if (isWallCollision) {
    return true
  }

  const bodyToCheck = hasEatenFood ? state.snake : state.snake.slice(0, -1)

  return bodyToCheck.some((segment) => {
    return segment.x === nextHead.x && segment.y === nextHead.y
  })
}

export function tick(args: {
  state: SnakeState
  input: SnakeInput
  random: number
}): SnakeState {
  const { state, input, random } = args

  if (state.isGameOver) {
    return state
  }

  const nextDirection = resolveDirection({
    current: state.direction,
    next: input.direction,
  })
  const nextHead = getNextHead({
    head: state.snake[0]!,
    direction: nextDirection,
  })
  const hasEatenFood =
    nextHead.x === state.food.x && nextHead.y === state.food.y
  const hasCollision = checkCollision({
    state,
    nextHead,
    hasEatenFood,
  })

  if (hasCollision) {
    return {
      ...state,
      direction: nextDirection,
      isGameOver: true,
    }
  }

  const nextSnake = hasEatenFood
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)]
  const nextScore = hasEatenFood ? state.score + 1 : state.score
  const nextTickInterval = calculateTickInterval({ score: nextScore })

  if (hasEatenFood) {
    const foodState = {
      ...state,
      snake: nextSnake,
      direction: nextDirection,
      score: nextScore,
      tickInterval: nextTickInterval,
    }
    const nextFood = spawnFood({
      state: foodState,
      random,
    })

    return {
      ...foodState,
      food: nextFood ?? state.food,
      isGameOver: nextFood === null,
    }
  }

  return {
    ...state,
    snake: nextSnake,
    direction: nextDirection,
    tickInterval: nextTickInterval,
  }
}
