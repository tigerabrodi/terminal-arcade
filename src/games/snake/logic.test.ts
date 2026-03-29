import { describe, test, expect } from 'bun:test'
import { spawnFood, tick } from './logic.js'
import { createInitialState, type Direction, type SnakeState } from './state.js'

function createState(args: {
  direction?: Direction
  snake?: SnakeState['snake']
  food?: SnakeState['food']
  score?: number
  gameArea?: SnakeState['gameArea']
}): SnakeState {
  const {
    direction = 'right',
    snake,
    food = { x: 8, y: 4 },
    score = 0,
    gameArea = { width: 12, height: 12 },
  } = args

  return {
    snake: snake ?? [
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ],
    direction,
    food,
    score,
    isGameOver: false,
    gameArea,
    tickInterval: 150,
  }
}

describe('snake logic movement', () => {
  test('snake moves right when facing right', () => {
    const state = createState({ direction: 'right' })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.snake).toEqual([
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
    ])
  })

  test('snake moves left when facing left', () => {
    const state = createState({
      direction: 'left',
      snake: [
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.snake).toEqual([
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 5, y: 4 },
    ])
  })

  test('snake moves up when facing up', () => {
    const state = createState({
      direction: 'up',
      snake: [
        { x: 4, y: 4 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.snake).toEqual([
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
    ])
  })

  test('snake moves down when facing down', () => {
    const state = createState({
      direction: 'down',
      snake: [
        { x: 4, y: 4 },
        { x: 4, y: 3 },
        { x: 4, y: 2 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.snake).toEqual([
      { x: 4, y: 5 },
      { x: 4, y: 4 },
      { x: 4, y: 3 },
    ])
  })

  test('snake removes its tail when it does not eat food', () => {
    const state = createState({ direction: 'right' })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.snake).toHaveLength(3)
    expect(nextState.snake.at(-1)).toEqual({ x: 3, y: 4 })
  })

  test('snake ignores opposite horizontal direction input', () => {
    const state = createState({ direction: 'right' })

    const nextState = tick({
      state,
      input: { direction: 'left' },
      random: 0,
    })

    expect(nextState.direction).toBe('right')
    expect(nextState.snake[0]).toEqual({ x: 5, y: 4 })
  })

  test('snake ignores opposite vertical direction input', () => {
    const state = createState({
      direction: 'up',
      snake: [
        { x: 4, y: 4 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: 'down' },
      random: 0,
    })

    expect(nextState.direction).toBe('up')
    expect(nextState.snake[0]).toEqual({ x: 4, y: 3 })
  })
})

describe('snake logic food and growth', () => {
  test('snake grows by one segment when it eats food', () => {
    const state = createState({
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      food: { x: 5, y: 4 },
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.snake).toEqual([
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
    ])
  })

  test('snake score increases when it eats food', () => {
    const state = createState({
      snake: [
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      food: { x: 5, y: 4 },
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.score).toBe(1)
  })

  test('snake spawns new food after eating', () => {
    const state = createState({
      snake: [
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ],
      food: { x: 2, y: 0 },
      direction: 'right',
    })

    const nextState = tick({
      state: {
        ...state,
        gameArea: { width: 4, height: 1 },
      },
      input: { direction: null },
      random: 0,
    })

    expect(nextState.food).toEqual({ x: 3, y: 0 })
  })

  test('spawnFood never places food on the snake body', () => {
    const state = createState({
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
    })

    const food = spawnFood({
      state: {
        ...state,
        gameArea: { width: 3, height: 2 },
      },
      random: 0,
    })

    expect(food).toEqual({ x: 0, y: 1 })
    expect(state.snake).not.toContainEqual(food)
  })
})

describe('snake logic collisions and speed', () => {
  test('snake sets game over when head moves beyond the left wall', () => {
    const state = createState({
      direction: 'left',
      snake: [
        { x: 0, y: 4 },
        { x: 1, y: 4 },
        { x: 2, y: 4 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.isGameOver).toBe(true)
  })

  test('snake sets game over when head moves beyond the right wall', () => {
    const state = createState({
      snake: [
        { x: 11, y: 4 },
        { x: 10, y: 4 },
        { x: 9, y: 4 },
      ],
      direction: 'right',
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.isGameOver).toBe(true)
  })

  test('snake sets game over when head moves above the top wall', () => {
    const state = createState({
      direction: 'up',
      snake: [
        { x: 4, y: 0 },
        { x: 4, y: 1 },
        { x: 4, y: 2 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.isGameOver).toBe(true)
  })

  test('snake sets game over when head moves below the bottom wall', () => {
    const state = createState({
      direction: 'down',
      snake: [
        { x: 4, y: 11 },
        { x: 4, y: 10 },
        { x: 4, y: 9 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.isGameOver).toBe(true)
  })

  test('snake sets game over when head hits its body', () => {
    const state = createState({
      direction: 'up',
      snake: [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 3 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.isGameOver).toBe(true)
  })

  test('snake can move into the old tail cell when the tail is removed that tick', () => {
    const state = createState({
      direction: 'right',
      snake: [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 1 },
      ],
      food: { x: 8, y: 8 },
      gameArea: { width: 10, height: 10 },
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.isGameOver).toBe(false)
    expect(nextState.snake).toEqual([
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ])
  })

  test('snake still dies when a reverse input is blocked and the forward move hits its body', () => {
    const state = createState({
      direction: 'right',
      snake: [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 5, y: 4 },
        { x: 4, y: 4 },
      ],
    })

    const nextState = tick({
      state,
      input: { direction: 'left' },
      random: 0,
    })

    expect(nextState.direction).toBe('right')
    expect(nextState.isGameOver).toBe(true)
  })

  test('tick interval decreases when score reaches a speed milestone', () => {
    const state = createState({
      score: 4,
      food: { x: 5, y: 4 },
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.score).toBe(5)
    expect(nextState.tickInterval).toBe(90)
  })

  test('game over freezes the snake on later ticks', () => {
    const state = createState({
      direction: 'left',
      snake: [
        { x: 0, y: 4 },
        { x: 1, y: 4 },
        { x: 2, y: 4 },
      ],
    })

    const gameOverState = tick({
      state,
      input: { direction: null },
      random: 0,
    })
    const frozenState = tick({
      state: gameOverState,
      input: { direction: 'up' },
      random: 0.75,
    })

    expect(frozenState).toEqual(gameOverState)
  })

  test('createInitialState places the first food inside a small playable board and off the snake', () => {
    const state = createInitialState({
      gameArea: { width: 4, height: 4 },
    })

    expect(state.food.x).toBeGreaterThanOrEqual(0)
    expect(state.food.x).toBeLessThan(state.gameArea.width)
    expect(state.food.y).toBeGreaterThanOrEqual(0)
    expect(state.food.y).toBeLessThan(state.gameArea.height)
    expect(state.snake).not.toContainEqual(state.food)
  })

  test('createInitialState starts with a longer snake on a normal board', () => {
    const state = createInitialState({
      gameArea: { width: 12, height: 12 },
    })

    expect(state.snake).toHaveLength(5)
  })

  test('createInitialState uses a faster starting tick interval', () => {
    const state = createInitialState({
      gameArea: { width: 12, height: 12 },
    })

    expect(state.tickInterval).toBe(100)
  })

  test('eating the final free cell ends the run when no new food cell remains', () => {
    const state = createState({
      direction: 'right',
      snake: [
        { x: 1, y: 0 },
        { x: 0, y: 0 },
      ],
      food: { x: 2, y: 0 },
      gameArea: { width: 3, height: 1 },
    })

    const nextState = tick({
      state,
      input: { direction: null },
      random: 0,
    })

    expect(nextState.snake).toEqual([
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ])
    expect(nextState.score).toBe(1)
    expect(nextState.isGameOver).toBe(true)
  })
})
