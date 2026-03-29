import type { Position } from '../../shared/types.js'

export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'L' | 'J'

export interface Piece {
  kind: PieceKind
  position: Position
  rotation: number
  cells: Array<Position>
}

export type Cell = PieceKind | null

export interface TetrisState {
  board: Array<Array<Cell>>
  currentPiece: Piece
  nextPiece: PieceKind
  score: number
  linesCleared: number
  level: number
  isGameOver: boolean
  boardWidth: number
  boardHeight: number
  ticksPerDrop: number
  tickCount: number
}

export interface TetrisInput {
  action: 'left' | 'right' | 'rotate' | 'down' | 'drop' | null
}

export function createInitialState(args: {
  boardWidth?: number
  boardHeight?: number
  initialPiece?: PieceKind
  nextPiece?: PieceKind
}): TetrisState {
  const {
    boardWidth = 10,
    boardHeight = 20,
    initialPiece = 'T',
    nextPiece = 'I',
  } = args

  const board: Array<Array<Cell>> = Array.from({ length: boardHeight }, () =>
    Array.from({ length: boardWidth }, () => null)
  )

  return {
    board,
    currentPiece: createPiece({ kind: initialPiece, boardWidth }),
    nextPiece,
    score: 0,
    linesCleared: 0,
    level: 1,
    isGameOver: false,
    boardWidth,
    boardHeight,
    ticksPerDrop: 30,
    tickCount: 0,
  }
}

export function createPiece(args: {
  kind: PieceKind
  boardWidth: number
}): Piece {
  const { kind, boardWidth } = args
  const spawnX = Math.floor(boardWidth / 2) - 1

  return {
    kind,
    position: { x: spawnX, y: 0 },
    rotation: 0,
    cells: getPieceCells({ kind, rotation: 0 }),
  }
}

export function getPieceCells(args: {
  kind: PieceKind
  rotation: number
}): Array<Position> {
  const { kind, rotation } = args
  const shapes = PIECE_SHAPES[kind]
  const shape = shapes[rotation % shapes.length]

  return shape ?? shapes[0] ?? []
}

const PIECE_SHAPES: Record<PieceKind, Array<Array<Position>>> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
  ],
  O: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  ],
  T: [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  ],
}
