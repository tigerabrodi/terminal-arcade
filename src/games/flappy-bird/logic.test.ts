import { describe, test, expect } from 'bun:test'
import { createInitialState } from './state.js'
import {
  applyGravity,
  checkCollision,
  flap,
  movePipes,
  spawnPipe,
  tick,
  updateScore,
} from './logic.js'

describe('flappy bird logic', () => {
  test('createInitialState sets Flappy Bird defaults', () => {
    const state = createInitialState({
      gameArea: { width: 50, height: 24 },
    })

    expect(state.bird.y).toBe(12)
    expect(state.bird.velocity).toBe(0)
    expect(state.birdX).toBe(10)
    expect(state.birdWidth).toBe(1)
    expect(state.birdHeight).toBe(1)
    expect(state.pipeWidth).toBe(3)
    expect(state.gapSize).toBe(6)
    expect(state.gapMargin).toBe(2)
  })

  test('applyGravity increases bird velocity and y position', () => {
    const bird = applyGravity({
      bird: { y: 8, velocity: 1.2 },
      gravity: 0.4,
    })

    expect(bird.velocity).toBeCloseTo(1.6)
    expect(bird.y).toBeCloseTo(9.6)
  })

  test('flap sets velocity to flapStrength', () => {
    const bird = flap({
      bird: { y: 8, velocity: 1.2 },
      flapStrength: -2.5,
    })

    expect(bird.y).toBe(8)
    expect(bird.velocity).toBe(-2.5)
  })

  test('tick applies flap before gravity and resets a falling bird', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const state = tick({
      state: {
        ...initialState,
        bird: {
          y: 9,
          velocity: 2,
        },
      },
      input: {
        flap: true,
      },
      randomValue: 0,
    })

    expect(state.bird.velocity).toBeCloseTo(-2.1)
    expect(state.bird.y).toBeCloseTo(6.9)
    expect(state.tickCount).toBe(1)
  })

  test('movePipes shifts every pipe left by pipeSpeed', () => {
    const pipes = movePipes({
      pipes: [
        { x: 20, gapTop: 3, gapBottom: 9, hasPassed: false },
        { x: 14, gapTop: 4, gapBottom: 10, hasPassed: true },
      ],
      speed: 2,
    })

    expect(pipes).toEqual([
      { x: 18, gapTop: 3, gapBottom: 9, hasPassed: false },
      { x: 12, gapTop: 4, gapBottom: 10, hasPassed: true },
    ])
  })

  test('spawnPipe uses the game area width and keeps the gap within bounds', () => {
    const pipe = spawnPipe({
      gameArea: { width: 40, height: 18 },
      gapMargin: 2,
      gapSize: 5,
      randomValue: 0.999,
    })

    expect(pipe.x).toBe(40)
    expect(pipe.gapTop).toBe(11)
    expect(pipe.gapBottom).toBe(16)
    expect(pipe.hasPassed).toBe(false)
  })

  test('tick spawns one pipe only when the updated tick reaches the interval', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const stateBeforeSpawn = tick({
      state: {
        ...initialState,
        tickCount: initialState.pipeSpawnInterval - 2,
      },
      input: {
        flap: false,
      },
      randomValue: 0,
    })

    const stateAtSpawn = tick({
      state: {
        ...initialState,
        tickCount: initialState.pipeSpawnInterval - 1,
      },
      input: {
        flap: false,
      },
      randomValue: 0,
    })

    expect(stateBeforeSpawn.pipes).toHaveLength(0)
    expect(stateAtSpawn.pipes).toHaveLength(1)
    expect(stateAtSpawn.pipes[0]).toEqual({
      x: 40,
      gapTop: 2,
      gapBottom: 7,
      hasPassed: false,
    })
  })

  test('tick removes pipes after they move fully off screen', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const state = tick({
      state: {
        ...initialState,
        pipes: [
          { x: -2, gapTop: 2, gapBottom: 7, hasPassed: false },
          { x: 10, gapTop: 3, gapBottom: 8, hasPassed: false },
        ],
      },
      input: {
        flap: false,
      },
      randomValue: 0,
    })

    expect(state.pipes).toEqual([
      { x: 9, gapTop: 3, gapBottom: 8, hasPassed: false },
    ])
  })

  test('updateScore increments once when a pipe fully passes the bird', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const result = updateScore({
      birdX: initialState.birdX,
      pipeWidth: initialState.pipeWidth,
      pipes: [
        { x: 7, gapTop: 2, gapBottom: 7, hasPassed: false },
        { x: 18, gapTop: 3, gapBottom: 8, hasPassed: false },
      ],
    })

    expect(result.scoreGained).toBe(1)
    expect(result.pipes).toEqual([
      { x: 7, gapTop: 2, gapBottom: 7, hasPassed: true },
      { x: 18, gapTop: 3, gapBottom: 8, hasPassed: false },
    ])
  })

  test('updateScore does not double count a pipe that already passed', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const result = updateScore({
      birdX: initialState.birdX,
      pipeWidth: initialState.pipeWidth,
      pipes: [{ x: 6, gapTop: 2, gapBottom: 7, hasPassed: true }],
    })

    expect(result.scoreGained).toBe(0)
    expect(result.pipes).toEqual([
      { x: 6, gapTop: 2, gapBottom: 7, hasPassed: true },
    ])
  })

  test('checkCollision returns true when the bird is above the pipe gap', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const hasCollision = checkCollision({
      bird: { y: 2, velocity: 0 },
      birdX: initialState.birdX,
      birdWidth: initialState.birdWidth,
      birdHeight: initialState.birdHeight,
      pipes: [{ x: 10, gapTop: 4, gapBottom: 9, hasPassed: false }],
      pipeWidth: initialState.pipeWidth,
      gameArea: initialState.gameArea,
    })

    expect(hasCollision).toBe(true)
  })

  test('checkCollision returns true when the bird is below the pipe gap', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const hasCollision = checkCollision({
      bird: { y: 10, velocity: 0 },
      birdX: initialState.birdX,
      birdWidth: initialState.birdWidth,
      birdHeight: initialState.birdHeight,
      pipes: [{ x: 10, gapTop: 4, gapBottom: 9, hasPassed: false }],
      pipeWidth: initialState.pipeWidth,
      gameArea: initialState.gameArea,
    })

    expect(hasCollision).toBe(true)
  })

  test('checkCollision returns false when the bird is inside the pipe gap', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const hasCollision = checkCollision({
      bird: { y: 5, velocity: 0 },
      birdX: initialState.birdX,
      birdWidth: initialState.birdWidth,
      birdHeight: initialState.birdHeight,
      pipes: [{ x: 10, gapTop: 4, gapBottom: 9, hasPassed: false }],
      pipeWidth: initialState.pipeWidth,
      gameArea: initialState.gameArea,
    })

    expect(hasCollision).toBe(false)
  })

  test('checkCollision returns true when the bird hits the ceiling', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const hasCollision = checkCollision({
      bird: { y: -0.1, velocity: 0 },
      birdX: initialState.birdX,
      birdWidth: initialState.birdWidth,
      birdHeight: initialState.birdHeight,
      pipes: [],
      pipeWidth: initialState.pipeWidth,
      gameArea: initialState.gameArea,
    })

    expect(hasCollision).toBe(true)
  })

  test('checkCollision returns true when the bird hits the floor', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })

    const hasCollision = checkCollision({
      bird: { y: 17.2, velocity: 0 },
      birdX: initialState.birdX,
      birdWidth: initialState.birdWidth,
      birdHeight: initialState.birdHeight,
      pipes: [],
      pipeWidth: initialState.pipeWidth,
      gameArea: initialState.gameArea,
    })

    expect(hasCollision).toBe(true)
  })

  test('tick freezes state after game over', () => {
    const initialState = createInitialState({
      gameArea: { width: 40, height: 18 },
    })
    const gameOverState = {
      ...initialState,
      isGameOver: true,
    }

    const state = tick({
      state: gameOverState,
      input: {
        flap: true,
      },
      randomValue: 0,
    })

    expect(state).toBe(gameOverState)
  })
})
