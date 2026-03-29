import { describe, test, expect } from 'bun:test'
import {
  checkPaddleCollision,
  checkScore,
  checkWallBounce,
  moveBall,
  moveCpu,
  movePlayer,
  resetBall,
  tick,
} from './logic.js'
import { createInitialState, type PongState } from './state.js'

function createState(
  args: {
    player?: Partial<PongState['player']>
    cpu?: Partial<PongState['cpu']>
    ball?: Partial<PongState['ball']>
    playerScore?: number
    cpuScore?: number
    winner?: PongState['winner']
    isGameOver?: boolean
    gameArea?: PongState['gameArea']
    paddleSpeed?: number
    ballSpeed?: number
    maxScore?: number
  } = {}
): PongState {
  const state = createInitialState({
    gameArea: args.gameArea ?? { width: 20, height: 12 },
  })

  return {
    ...state,
    player: {
      ...state.player,
      ...args.player,
    },
    cpu: {
      ...state.cpu,
      ...args.cpu,
    },
    ball: {
      ...state.ball,
      ...args.ball,
    },
    playerScore: args.playerScore ?? state.playerScore,
    cpuScore: args.cpuScore ?? state.cpuScore,
    winner: args.winner ?? state.winner,
    isGameOver: args.isGameOver ?? state.isGameOver,
    paddleSpeed: args.paddleSpeed ?? state.paddleSpeed,
    ballSpeed: args.ballSpeed ?? state.ballSpeed,
    maxScore: args.maxScore ?? state.maxScore,
  }
}

describe('pong state defaults', () => {
  test('initial state uses faster paddle and ball speeds', () => {
    const state = createInitialState({
      gameArea: { width: 20, height: 12 },
    })

    expect(state.paddleSpeed).toBe(5)
    expect(state.ballSpeed).toBe(3.5)
  })
})

describe('pong logic paddles', () => {
  test('player paddle moves up when direction is up', () => {
    const paddle = movePlayer({
      paddle: { y: 5, height: 4 },
      direction: 'up',
      speed: 1,
      gameArea: { width: 20, height: 12 },
    })

    expect(paddle.y).toBe(4)
  })

  test('player paddle moves down when direction is down', () => {
    const paddle = movePlayer({
      paddle: { y: 5, height: 4 },
      direction: 'down',
      speed: 1,
      gameArea: { width: 20, height: 12 },
    })

    expect(paddle.y).toBe(6)
  })

  test('player paddle does not move past top wall', () => {
    const paddle = movePlayer({
      paddle: { y: 0, height: 4 },
      direction: 'up',
      speed: 2,
      gameArea: { width: 20, height: 12 },
    })

    expect(paddle.y).toBe(0)
  })

  test('player paddle does not move past bottom wall', () => {
    const paddle = movePlayer({
      paddle: { y: 8, height: 4 },
      direction: 'down',
      speed: 2,
      gameArea: { width: 20, height: 12 },
    })

    expect(paddle.y).toBe(8)
  })

  test('cpu paddle moves toward ball y position', () => {
    const paddle = moveCpu({
      paddle: { y: 1, height: 4 },
      ball: { x: 10, y: 8, velocityX: 1, velocityY: 0 },
      speed: 1,
      gameArea: { width: 20, height: 12 },
    })

    expect(paddle.y).toBe(2)
  })

  test('cpu paddle does not exceed its max speed', () => {
    const paddle = moveCpu({
      paddle: { y: 1, height: 4 },
      ball: { x: 10, y: 11, velocityX: 1, velocityY: 0 },
      speed: 2,
      gameArea: { width: 20, height: 20 },
    })

    expect(paddle.y).toBe(3)
  })

  test('cpu paddle does not move past walls', () => {
    const topPaddle = moveCpu({
      paddle: { y: 0, height: 4 },
      ball: { x: 10, y: -5, velocityX: 1, velocityY: 0 },
      speed: 2,
      gameArea: { width: 20, height: 12 },
    })
    const bottomPaddle = moveCpu({
      paddle: { y: 8, height: 4 },
      ball: { x: 10, y: 20, velocityX: 1, velocityY: 0 },
      speed: 2,
      gameArea: { width: 20, height: 12 },
    })

    expect(topPaddle.y).toBe(0)
    expect(bottomPaddle.y).toBe(8)
  })
})

describe('pong logic ball', () => {
  test('ball moves by velocity each tick', () => {
    const ball = moveBall({
      ball: { x: 10, y: 5, velocityX: 1, velocityY: -0.5 },
      speed: 2,
    })

    expect(ball.x).toBe(12)
    expect(ball.y).toBe(4)
  })

  test('ball bounces off top wall', () => {
    const ball = checkWallBounce({
      ball: { x: 10, y: -0.2, velocityX: -1, velocityY: -0.5 },
      gameArea: { width: 20, height: 12 },
    })

    expect(ball.y).toBe(0)
    expect(ball.velocityY).toBe(0.5)
  })

  test('ball bounces off bottom wall', () => {
    const ball = checkWallBounce({
      ball: { x: 10, y: 11.4, velocityX: 1, velocityY: 0.5 },
      gameArea: { width: 20, height: 12 },
    })

    expect(ball.y).toBe(11)
    expect(ball.velocityY).toBe(-0.5)
  })

  test('ball bounces off player paddle', () => {
    const ball = checkPaddleCollision({
      ball: { x: 2, y: 5, velocityX: -1, velocityY: 0 },
      player: { y: 3, height: 4 },
      cpu: { y: 3, height: 4 },
      gameArea: { width: 20, height: 12 },
    })

    expect(ball.velocityX).toBe(1)
    expect(ball.x).toBe(2)
  })

  test('ball bounces off cpu paddle', () => {
    const ball = checkPaddleCollision({
      ball: { x: 17, y: 5, velocityX: 1, velocityY: 0 },
      player: { y: 3, height: 4 },
      cpu: { y: 3, height: 4 },
      gameArea: { width: 20, height: 12 },
    })

    expect(ball.velocityX).toBe(-1)
    expect(ball.x).toBe(17)
  })

  test('ball angle changes based on paddle hit location', () => {
    const ball = checkPaddleCollision({
      ball: { x: 2, y: 3, velocityX: -1, velocityY: 0 },
      player: { y: 3, height: 5 },
      cpu: { y: 3, height: 5 },
      gameArea: { width: 20, height: 12 },
    })

    expect(ball.velocityX).toBe(1)
    expect(ball.velocityY).toBeLessThan(0)
  })
})

describe('pong logic scoring and game over', () => {
  test('ball passing left edge increments cpu score', () => {
    const result = checkScore({
      ball: { x: -0.1, y: 5, velocityX: -1, velocityY: 0 },
      gameArea: { width: 20, height: 12 },
    })

    expect(result).toEqual({
      playerScored: false,
      cpuScored: true,
    })
  })

  test('ball passing right edge increments player score', () => {
    const result = checkScore({
      ball: { x: 20, y: 5, velocityX: 1, velocityY: 0 },
      gameArea: { width: 20, height: 12 },
    })

    expect(result).toEqual({
      playerScored: true,
      cpuScored: false,
    })
  })

  test('ball resets to center after score', () => {
    const ball = resetBall({
      gameArea: { width: 20, height: 12 },
      direction: 'left',
    })

    expect(ball).toEqual({
      x: 10,
      y: 6,
      velocityX: -1,
      velocityY: 0,
    })
  })

  test('game over when player reaches max score', () => {
    const state = createState({
      playerScore: 4,
      maxScore: 5,
      ball: {
        x: 20,
        y: 5,
        velocityX: 1,
        velocityY: 0,
      },
    })

    const nextState = tick({
      state,
      input: {
        direction: null,
      },
    })

    expect(nextState.playerScore).toBe(5)
    expect(nextState.isGameOver).toBe(true)
    expect(nextState.winner).toBe('player')
  })

  test('game over when cpu reaches max score', () => {
    const state = createState({
      cpuScore: 4,
      maxScore: 5,
      ball: {
        x: -1,
        y: 5,
        velocityX: -1,
        velocityY: 0,
      },
    })

    const nextState = tick({
      state,
      input: {
        direction: null,
      },
    })

    expect(nextState.cpuScore).toBe(5)
    expect(nextState.isGameOver).toBe(true)
    expect(nextState.winner).toBe('cpu')
  })

  test('game over freezes state', () => {
    const state = createState({
      isGameOver: true,
      winner: 'player',
    })

    const nextState = tick({
      state,
      input: {
        direction: 'down',
      },
    })

    expect(nextState).toBe(state)
  })
})
