import {
  createPiece,
  getPieceCells,
  type Cell,
  type PieceKind,
  type TetrisInput,
  type TetrisState,
} from './state.js'

const PIECE_KIND_ORDER: Array<PieceKind> = ['I', 'O', 'T', 'S', 'Z', 'L', 'J']

const ROTATION_COUNTS: Record<PieceKind, number> = {
  I: 2,
  O: 1,
  T: 4,
  S: 2,
  Z: 2,
  L: 4,
  J: 4,
}

const SCORE_BY_LINES: Record<number, number> = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
}

export function tick(args: {
  state: TetrisState
  input: TetrisInput
  randomValue: number
}): TetrisState {
  const { state, input, randomValue } = args

  if (state.isGameOver) {
    return state
  }

  if (input.action === 'drop') {
    const droppedPiece = dropPiece({
      piece: state.currentPiece,
      board: state.board,
    })

    return lockAndContinue({
      state,
      piece: droppedPiece,
      randomValue,
    })
  }

  if (input.action === 'down') {
    const movedPiece = movePiece({
      piece: state.currentPiece,
      dx: 0,
      dy: 1,
      board: state.board,
    })

    if (movedPiece !== null) {
      return {
        ...state,
        currentPiece: movedPiece,
        tickCount: 0,
      }
    }

    return lockAndContinue({
      state,
      piece: state.currentPiece,
      randomValue,
    })
  }

  let currentPiece = state.currentPiece

  if (input.action === 'left' || input.action === 'right') {
    const movedPiece = movePiece({
      piece: currentPiece,
      dx: input.action === 'left' ? -1 : 1,
      dy: 0,
      board: state.board,
    })

    currentPiece = movedPiece ?? currentPiece
  }

  if (input.action === 'rotate') {
    const rotatedPiece = rotatePiece({
      piece: currentPiece,
      board: state.board,
    })

    currentPiece = rotatedPiece ?? currentPiece
  }

  const nextTickCount = state.tickCount + 1

  if (nextTickCount < state.ticksPerDrop) {
    return {
      ...state,
      currentPiece,
      tickCount: nextTickCount,
    }
  }

  const movedPiece = movePiece({
    piece: currentPiece,
    dx: 0,
    dy: 1,
    board: state.board,
  })

  if (movedPiece !== null) {
    return {
      ...state,
      currentPiece: movedPiece,
      tickCount: 0,
    }
  }

  return lockAndContinue({
    state: {
      ...state,
      currentPiece,
    },
    piece: currentPiece,
    randomValue,
  })
}

export function movePiece(args: {
  piece: TetrisState['currentPiece']
  dx: number
  dy: number
  board: Array<Array<Cell>>
}): TetrisState['currentPiece'] | null {
  const { piece, dx, dy, board } = args
  const movedPiece = {
    ...piece,
    position: {
      x: piece.position.x + dx,
      y: piece.position.y + dy,
    },
  }

  return isValidPosition({
    piece: movedPiece,
    board,
  })
    ? movedPiece
    : null
}

export function rotatePiece(args: {
  piece: TetrisState['currentPiece']
  board: Array<Array<Cell>>
}): TetrisState['currentPiece'] | null {
  const { piece, board } = args
  const nextRotation = (piece.rotation + 1) % ROTATION_COUNTS[piece.kind]
  const rotatedPiece = {
    ...piece,
    rotation: nextRotation,
    cells: getPieceCells({
      kind: piece.kind,
      rotation: nextRotation,
    }),
  }

  return isValidPosition({
    piece: rotatedPiece,
    board,
  })
    ? rotatedPiece
    : null
}

export function dropPiece(args: {
  piece: TetrisState['currentPiece']
  board: Array<Array<Cell>>
}): TetrisState['currentPiece'] {
  const { piece, board } = args
  let droppedPiece = piece

  while (true) {
    const movedPiece = movePiece({
      piece: droppedPiece,
      dx: 0,
      dy: 1,
      board,
    })

    if (movedPiece === null) {
      return droppedPiece
    }

    droppedPiece = movedPiece
  }
}

export function lockPiece(args: {
  piece: TetrisState['currentPiece']
  board: Array<Array<Cell>>
}): Array<Array<Cell>> {
  const { piece, board } = args
  const lockedBoard = board.map((row) => [...row])

  for (const cell of piece.cells) {
    const x = piece.position.x + cell.x
    const y = piece.position.y + cell.y
    const row = lockedBoard[y]

    if (row === undefined || row[x] === undefined) {
      continue
    }

    row[x] = piece.kind
  }

  return lockedBoard
}

export function clearLines(args: { board: Array<Array<Cell>> }): {
  board: Array<Array<Cell>>
  linesCleared: number
} {
  const { board } = args
  const remainingRows = board
    .filter((row) => row.some((cell) => cell === null))
    .map((row) => [...row])
  const linesCleared = board.length - remainingRows.length

  if (linesCleared === 0) {
    return {
      board: board.map((row) => [...row]),
      linesCleared: 0,
    }
  }

  const emptyRows = Array.from({ length: linesCleared }, () =>
    Array.from({ length: board[0]?.length ?? 0 }, () => null)
  )

  return {
    board: [...emptyRows, ...remainingRows],
    linesCleared,
  }
}

export function calculateScore(args: {
  linesCleared: number
  level: number
}): number {
  const { linesCleared, level } = args

  return (SCORE_BY_LINES[linesCleared] ?? 0) * level
}

export function checkGameOver(args: {
  piece: TetrisState['currentPiece']
  board: Array<Array<Cell>>
}): boolean {
  const { piece, board } = args

  return !isValidPosition({
    piece,
    board,
  })
}

export function isValidPosition(args: {
  piece: TetrisState['currentPiece']
  board: Array<Array<Cell>>
}): boolean {
  const { piece, board } = args
  const boardHeight = board.length
  const boardWidth = board[0]?.length ?? 0

  return piece.cells.every((cell) => {
    const x = piece.position.x + cell.x
    const y = piece.position.y + cell.y

    if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
      return false
    }

    return board[y]![x] === null
  })
}

export function getRandomPiece(args: { randomValue: number }): PieceKind {
  const { randomValue } = args
  const clampedRandom = Math.min(Math.max(randomValue, 0), 0.999999999999)
  const index = Math.floor(clampedRandom * PIECE_KIND_ORDER.length)

  return PIECE_KIND_ORDER[index]!
}

function lockAndContinue(args: {
  state: TetrisState
  piece: TetrisState['currentPiece']
  randomValue: number
}): TetrisState {
  const { state, piece, randomValue } = args
  const lockedBoard = lockPiece({
    piece,
    board: state.board,
  })
  const clearedBoard = clearLines({
    board: lockedBoard,
  })
  const nextLinesCleared = state.linesCleared + clearedBoard.linesCleared
  const nextLevel = calculateLevel({
    linesCleared: nextLinesCleared,
  })
  const nextPiece = createPiece({
    kind: state.nextPiece,
    boardWidth: state.boardWidth,
  })

  return {
    ...state,
    board: clearedBoard.board,
    currentPiece: nextPiece,
    nextPiece: getRandomPiece({
      randomValue,
    }),
    score:
      state.score +
      calculateScore({
        linesCleared: clearedBoard.linesCleared,
        level: state.level,
      }),
    linesCleared: nextLinesCleared,
    level: nextLevel,
    ticksPerDrop: calculateTicksPerDrop({
      level: nextLevel,
    }),
    tickCount: 0,
    isGameOver: checkGameOver({
      piece: nextPiece,
      board: clearedBoard.board,
    }),
  }
}

function calculateLevel(args: { linesCleared: number }): number {
  const { linesCleared } = args

  return Math.floor(linesCleared / 10) + 1
}

function calculateTicksPerDrop(args: { level: number }): number {
  const { level } = args

  return Math.max(5, 18 - (level - 1) * 2)
}
