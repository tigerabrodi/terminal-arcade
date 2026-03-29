import type { Dimensions } from '../../shared/types.js'

export interface Bird {
  y: number
  velocity: number
}

export interface Pipe {
  x: number
  gapTop: number
  gapBottom: number
  hasPassed: boolean
}

export interface FlappyBirdState {
  bird: Bird
  pipes: Array<Pipe>
  score: number
  isGameOver: boolean
  gameArea: Dimensions
  birdX: number
  birdWidth: number
  birdHeight: number
  tickCount: number
  pipeWidth: number
  pipeSpawnInterval: number
  pipeSpeed: number
  gapSize: number
  gapMargin: number
  gravity: number
  flapStrength: number
}

export interface FlappyBirdInput {
  flap: boolean
}

export function createInitialState(args: {
  gameArea: Dimensions
}): FlappyBirdState {
  const { gameArea } = args
  const birdX = Math.min(10, Math.max(3, Math.floor(gameArea.width / 4)))
  const gapSize = Math.max(5, Math.min(8, Math.floor(gameArea.height / 4)))

  return {
    bird: {
      y: Math.floor(gameArea.height / 2),
      velocity: 0,
    },
    pipes: [],
    score: 0,
    isGameOver: false,
    gameArea,
    birdX,
    birdWidth: 1,
    birdHeight: 1,
    tickCount: 0,
    pipeWidth: 3,
    pipeSpawnInterval: 30,
    pipeSpeed: 1,
    gapSize,
    gapMargin: 2,
    gravity: 0.4,
    flapStrength: -2.5,
  }
}
