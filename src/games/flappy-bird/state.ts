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
  tickCount: number
  pipeSpawnInterval: number
  pipeSpeed: number
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

  return {
    bird: {
      y: Math.floor(gameArea.height / 2),
      velocity: 0,
    },
    pipes: [],
    score: 0,
    isGameOver: false,
    gameArea,
    tickCount: 0,
    pipeSpawnInterval: 30,
    pipeSpeed: 1,
    gravity: 0.4,
    flapStrength: -2.5,
  }
}
