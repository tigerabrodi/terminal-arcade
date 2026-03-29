export type GameId = 'snake' | 'flappy-bird' | 'dino' | 'pong' | 'tetris'

export type AppScreen = { kind: 'menu' } | { kind: 'playing'; gameId: GameId }

export interface GameOption {
  id: GameId
  name: string
  description: string
}

export const GAME_OPTIONS: Array<GameOption> = [
  {
    id: 'dino',
    name: 'Dino Run',
    description: 'Jump over obstacles in the desert',
  },
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    description: 'Flap through the pipes',
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat food and grow without hitting yourself',
  },
  {
    id: 'pong',
    name: 'Pong',
    description: 'Classic paddle ball against the CPU',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack and clear falling blocks',
  },
]

export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}
