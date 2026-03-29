import { describe, expect, test } from 'bun:test'
import {
  calculateScore,
  clearLines,
  dropPiece,
  rotatePiece,
  tick,
} from './logic.js'
import {
  createInitialState,
  createPiece,
  getPieceCells,
  type Cell,
  type Piece,
  type PieceKind,
  type TetrisState,
} from './state.js'

function createBoard(args: {
  width?: number
  height?: number
  fill?: Cell
}): Array<Array<Cell>> {
  const { width = 10, height = 20, fill = null } = args

  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => fill)
  )
}

function createTestState(
  args: Partial<TetrisState> & {
    initialPiece?: PieceKind
    nextPiece?: PieceKind
  } = {}
): TetrisState {
  const {
    boardWidth = 10,
    boardHeight = 20,
    initialPiece = 'T',
    nextPiece = 'I',
    ...overrides
  } = args

  const initialState = createInitialState({
    boardWidth,
    boardHeight,
    initialPiece,
    nextPiece,
  })

  return {
    ...initialState,
    ...overrides,
    board:
      overrides.board ??
      createBoard({
        width: boardWidth,
        height: boardHeight,
      }),
  }
}

function createTestPiece(args: {
  kind: PieceKind
  x: number
  y: number
  rotation?: number
  boardWidth?: number
}): Piece {
  const { kind, x, y, rotation = 0, boardWidth = 10 } = args
  const piece = createPiece({
    kind,
    boardWidth,
  })

  return {
    ...piece,
    position: { x, y },
    rotation,
    cells: getPieceCells({
      kind,
      rotation,
    }),
  }
}

describe('tetris piece movement', () => {
  test('piece moves left when action is left', () => {
    const state = createTestState({
      initialPiece: 'O',
    })

    const nextState = tick({
      state,
      input: { action: 'left' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.position.x).toBe(
      state.currentPiece.position.x - 1
    )
  })

  test('piece moves right when action is right', () => {
    const state = createTestState({
      initialPiece: 'O',
    })

    const nextState = tick({
      state,
      input: { action: 'right' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.position.x).toBe(
      state.currentPiece.position.x + 1
    )
  })

  test('piece does not move past left wall', () => {
    const state = createTestState({
      initialPiece: 'O',
      currentPiece: createTestPiece({
        kind: 'O',
        x: 0,
        y: 0,
      }),
    })

    const nextState = tick({
      state,
      input: { action: 'left' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.position.x).toBe(0)
  })

  test('piece does not move past right wall', () => {
    const state = createTestState({
      initialPiece: 'O',
      currentPiece: createTestPiece({
        kind: 'O',
        x: 8,
        y: 0,
      }),
    })

    const nextState = tick({
      state,
      input: { action: 'right' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.position.x).toBe(8)
  })

  test('piece does not move into locked cells', () => {
    const board = createBoard({})
    board[0]![3] = 'I'

    const state = createTestState({
      initialPiece: 'O',
      board,
      currentPiece: createTestPiece({
        kind: 'O',
        x: 4,
        y: 0,
      }),
    })

    const nextState = tick({
      state,
      input: { action: 'left' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.position.x).toBe(4)
  })

  test('piece moves down on soft drop action', () => {
    const state = createTestState({
      initialPiece: 'O',
    })

    const nextState = tick({
      state,
      input: { action: 'down' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.position.y).toBe(1)
    expect(nextState.tickCount).toBe(0)
  })

  test('hard drop places piece at lowest valid row', () => {
    const board = createBoard({
      width: 10,
      height: 20,
    })
    const piece = createTestPiece({
      kind: 'O',
      x: 4,
      y: 0,
    })

    const droppedPiece = dropPiece({
      piece,
      board,
    })

    expect(droppedPiece.position.y).toBe(18)
  })

  test('piece locks after hard drop', () => {
    const state = createTestState({
      initialPiece: 'O',
      nextPiece: 'L',
    })

    const nextState = tick({
      state,
      input: { action: 'drop' },
      randomValue: 0,
    })

    expect(nextState.board[18]![4]).toBe('O')
    expect(nextState.board[18]![5]).toBe('O')
    expect(nextState.board[19]![4]).toBe('O')
    expect(nextState.board[19]![5]).toBe('O')
  })
})

describe('tetris piece rotation', () => {
  test('piece rotates clockwise', () => {
    const state = createTestState({
      initialPiece: 'T',
    })

    const nextState = tick({
      state,
      input: { action: 'rotate' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.rotation).toBe(1)
    expect(nextState.currentPiece.cells).toEqual(
      getPieceCells({
        kind: 'T',
        rotation: 1,
      })
    )
  })

  test('piece does not rotate into wall', () => {
    const state = createTestState({
      initialPiece: 'I',
      currentPiece: createTestPiece({
        kind: 'I',
        x: 7,
        y: 0,
        rotation: 1,
      }),
    })

    const nextState = tick({
      state,
      input: { action: 'rotate' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.rotation).toBe(1)
  })

  test('piece does not rotate into locked cells', () => {
    const board = createBoard({})
    board[2]![5] = 'I'
    const piece = createTestPiece({
      kind: 'T',
      x: 4,
      y: 0,
      rotation: 0,
    })

    const rotatedPiece = rotatePiece({
      piece,
      board,
    })

    expect(rotatedPiece).toBeNull()
  })

  test('o piece has only one rotation', () => {
    const board = createBoard({})
    const piece = createTestPiece({
      kind: 'O',
      x: 4,
      y: 0,
    })

    const rotatedPiece = rotatePiece({
      piece,
      board,
    })

    expect(rotatedPiece).toEqual(piece)
  })
})

describe('tetris board and score', () => {
  test('full row is cleared from board', () => {
    const board = createBoard({
      width: 4,
      height: 4,
    })
    board[3] = ['I', 'O', 'T', 'S']
    board[2] = [null, 'L', null, null]

    const result = clearLines({
      board,
    })

    expect(result.linesCleared).toBe(1)
    expect(result.board[3]).toEqual([null, 'L', null, null])
    expect(result.board[0]).toEqual([null, null, null, null])
  })

  test('multiple rows cleared simultaneously', () => {
    const board = createBoard({
      width: 4,
      height: 4,
    })
    board[2] = ['I', 'O', 'T', 'S']
    board[3] = ['Z', 'L', 'J', 'O']

    const result = clearLines({
      board,
    })

    expect(result.linesCleared).toBe(2)
    expect(result.board[0]).toEqual([null, null, null, null])
    expect(result.board[1]).toEqual([null, null, null, null])
  })

  test('rows above cleared lines shift down', () => {
    const board = createBoard({
      width: 4,
      height: 4,
    })
    board[1] = [null, 'T', null, null]
    board[3] = ['I', 'O', 'T', 'S']

    const result = clearLines({
      board,
    })

    expect(result.board[2]).toEqual([null, 'T', null, null])
  })

  test('score is calculated correctly for one two three and four lines', () => {
    expect(
      calculateScore({
        linesCleared: 1,
        level: 1,
      })
    ).toBe(100)
    expect(
      calculateScore({
        linesCleared: 2,
        level: 1,
      })
    ).toBe(300)
    expect(
      calculateScore({
        linesCleared: 3,
        level: 1,
      })
    ).toBe(500)
    expect(
      calculateScore({
        linesCleared: 4,
        level: 1,
      })
    ).toBe(800)
  })

  test('score is multiplied by level', () => {
    expect(
      calculateScore({
        linesCleared: 2,
        level: 3,
      })
    ).toBe(900)
  })

  test('level increases every ten lines', () => {
    const board = createBoard({
      width: 4,
      height: 4,
    })
    board[3] = ['I', null, null, 'I']
    const state = createTestState({
      boardWidth: 4,
      boardHeight: 4,
      initialPiece: 'O',
      nextPiece: 'T',
      board,
      linesCleared: 9,
      level: 1,
      currentPiece: createTestPiece({
        kind: 'O',
        x: 1,
        y: 0,
        boardWidth: 4,
      }),
    })

    const nextState = tick({
      state,
      input: { action: 'drop' },
      randomValue: 0,
    })

    expect(nextState.linesCleared).toBe(10)
    expect(nextState.level).toBe(2)
  })

  test('ticks per drop decreases with level', () => {
    const board = createBoard({
      width: 4,
      height: 4,
    })
    board[3] = ['I', null, null, 'I']
    const state = createTestState({
      boardWidth: 4,
      boardHeight: 4,
      initialPiece: 'O',
      nextPiece: 'T',
      board,
      linesCleared: 9,
      level: 1,
      currentPiece: createTestPiece({
        kind: 'O',
        x: 1,
        y: 0,
        boardWidth: 4,
      }),
    })

    const nextState = tick({
      state,
      input: { action: 'drop' },
      randomValue: 0,
    })

    expect(nextState.ticksPerDrop).toBeLessThan(state.ticksPerDrop)
  })
})

describe('tetris spawning and game over', () => {
  test('new piece spawns after locking with the correct next piece kind', () => {
    const state = createTestState({
      initialPiece: 'O',
      nextPiece: 'L',
    })

    const nextState = tick({
      state,
      input: { action: 'drop' },
      randomValue: 0,
    })

    expect(nextState.currentPiece.kind).toBe('L')
    expect(nextState.nextPiece).toBe('I')
  })

  test('game over when new piece overlaps locked cells', () => {
    const board = createBoard({})
    board[0]![4] = 'I'

    const state = createTestState({
      initialPiece: 'O',
      nextPiece: 'O',
      board,
      currentPiece: createTestPiece({
        kind: 'O',
        x: 4,
        y: 0,
      }),
    })

    const nextState = tick({
      state,
      input: { action: 'drop' },
      randomValue: 0,
    })

    expect(nextState.isGameOver).toBe(true)
  })

  test('game over freezes state', () => {
    const state = createTestState({
      isGameOver: true,
    })

    const nextState = tick({
      state,
      input: { action: 'left' },
      randomValue: 0.5,
    })

    expect(nextState).toEqual(state)
  })

  test('piece auto drops after ticks per drop ticks with no input', () => {
    const state = createTestState({
      initialPiece: 'O',
      ticksPerDrop: 2,
      tickCount: 1,
    })

    const nextState = tick({
      state,
      input: { action: null },
      randomValue: 0,
    })

    expect(nextState.currentPiece.position.y).toBe(1)
    expect(nextState.tickCount).toBe(0)
  })
})
