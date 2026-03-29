import {
  type FrameBufferRenderable,
  parseColor,
  type OptimizedBuffer,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import { getPieceCells, type PieceKind, type TetrisState } from './state.js'

const BACKGROUND_COLOR = parseColor(COLORS.background)
const BORDER_COLOR = parseColor(COLORS.border)
const TEXT_COLOR = parseColor(COLORS.text)
const TEXT_DIM_COLOR = parseColor(COLORS.textDim)
const DANGER_COLOR = parseColor(COLORS.danger)

const PIECE_COLORS: Record<PieceKind, ReturnType<typeof parseColor>> = {
  I: parseColor('#00d8ff'),
  O: parseColor('#ffd400'),
  T: parseColor('#b266ff'),
  S: parseColor('#33ff66'),
  Z: parseColor('#ff5555'),
  L: parseColor('#ff9933'),
  J: parseColor('#4d7cff'),
}

const CELL_TEXT = '[]'
const CELL_WIDTH = CELL_TEXT.length
const PREVIEW_GAP = 4
const PREVIEW_WIDTH = 12

export function renderTetris(args: {
  state: TetrisState
  frameBuffer: FrameBufferRenderable
}): void {
  const { state, frameBuffer } = args
  const buffer = frameBuffer.frameBuffer
  const boardPixelWidth = state.boardWidth * CELL_WIDTH + 2
  const boardPixelHeight = state.boardHeight + 2
  const totalWidth = boardPixelWidth + PREVIEW_GAP + PREVIEW_WIDTH
  const boardX = Math.max(0, Math.floor((buffer.width - totalWidth) / 2))
  const boardY = Math.max(3, Math.floor((buffer.height - boardPixelHeight) / 2))

  buffer.clear(BACKGROUND_COLOR)

  drawHeader({
    buffer,
    state,
    boardX,
    boardY,
    boardPixelWidth,
  })
  drawBoard({
    buffer,
    state,
    boardX,
    boardY,
  })
  drawNextPiece({
    buffer,
    state,
    boardX: boardX + boardPixelWidth + PREVIEW_GAP,
    boardY,
  })
  drawFooter({
    buffer,
    state,
    boardX,
    boardY,
    boardPixelHeight,
  })

  if (state.isGameOver) {
    drawGameOverOverlay({
      buffer,
    })
  }

  frameBuffer.requestRender()
}

function drawHeader(args: {
  buffer: OptimizedBuffer
  state: TetrisState
  boardX: number
  boardY: number
  boardPixelWidth: number
}): void {
  const { buffer, state, boardX, boardY, boardPixelWidth } = args
  const scoreText = `SCORE ${state.score}`
  const levelText = `LEVEL ${state.level}`
  const linesText = `LINES ${state.linesCleared}`
  const headerY = Math.max(0, boardY - 2)
  const linesY = Math.max(1, boardY - 1)
  const levelX = Math.max(boardX, boardX + boardPixelWidth - levelText.length)

  buffer.drawText(scoreText, boardX, headerY, TEXT_COLOR, BACKGROUND_COLOR)
  buffer.drawText(levelText, levelX, headerY, TEXT_COLOR, BACKGROUND_COLOR)
  buffer.drawText(linesText, boardX, linesY, TEXT_DIM_COLOR, BACKGROUND_COLOR)
}

function drawBoard(args: {
  buffer: OptimizedBuffer
  state: TetrisState
  boardX: number
  boardY: number
}): void {
  const { buffer, state, boardX, boardY } = args
  const boardPixelWidth = state.boardWidth * CELL_WIDTH + 2
  const boardPixelHeight = state.boardHeight + 2
  const visibleBoard = state.board.map((row) => [...row])

  for (const cell of state.currentPiece.cells) {
    const x = state.currentPiece.position.x + cell.x
    const y = state.currentPiece.position.y + cell.y

    if (x < 0 || x >= state.boardWidth || y < 0 || y >= state.boardHeight) {
      continue
    }

    visibleBoard[y]![x] = state.currentPiece.kind
  }

  buffer.drawText('+', boardX, boardY, BORDER_COLOR, BACKGROUND_COLOR)
  buffer.drawText(
    '+',
    boardX + boardPixelWidth - 1,
    boardY,
    BORDER_COLOR,
    BACKGROUND_COLOR
  )
  buffer.drawText(
    '+',
    boardX,
    boardY + boardPixelHeight - 1,
    BORDER_COLOR,
    BACKGROUND_COLOR
  )
  buffer.drawText(
    '+',
    boardX + boardPixelWidth - 1,
    boardY + boardPixelHeight - 1,
    BORDER_COLOR,
    BACKGROUND_COLOR
  )

  for (let x = 1; x < boardPixelWidth - 1; x += 1) {
    buffer.drawText('-', boardX + x, boardY, BORDER_COLOR, BACKGROUND_COLOR)
    buffer.drawText(
      '-',
      boardX + x,
      boardY + boardPixelHeight - 1,
      BORDER_COLOR,
      BACKGROUND_COLOR
    )
  }

  for (let y = 1; y < boardPixelHeight - 1; y += 1) {
    buffer.drawText('|', boardX, boardY + y, BORDER_COLOR, BACKGROUND_COLOR)
    buffer.drawText(
      '|',
      boardX + boardPixelWidth - 1,
      boardY + y,
      BORDER_COLOR,
      BACKGROUND_COLOR
    )
  }

  for (let y = 0; y < state.boardHeight; y += 1) {
    for (let x = 0; x < state.boardWidth; x += 1) {
      const cell = visibleBoard[y]?.[x] ?? null

      if (cell === null) {
        continue
      }

      drawCell({
        buffer,
        x: boardX + 1 + x * CELL_WIDTH,
        y: boardY + 1 + y,
        kind: cell,
      })
    }
  }
}

function drawNextPiece(args: {
  buffer: OptimizedBuffer
  state: TetrisState
  boardX: number
  boardY: number
}): void {
  const { buffer, state, boardX, boardY } = args
  const previewCells = getPieceCells({
    kind: state.nextPiece,
    rotation: 0,
  })
  const previewTitle = 'NEXT'

  buffer.drawText(previewTitle, boardX, boardY, TEXT_COLOR, BACKGROUND_COLOR)

  for (const cell of previewCells) {
    drawCell({
      buffer,
      x: boardX + cell.x * CELL_WIDTH,
      y: boardY + 2 + cell.y,
      kind: state.nextPiece,
    })
  }
}

function drawFooter(args: {
  buffer: OptimizedBuffer
  state: TetrisState
  boardX: number
  boardY: number
  boardPixelHeight: number
}): void {
  const { buffer, state, boardX, boardY, boardPixelHeight } = args
  const footerY = Math.min(buffer.height - 1, boardY + boardPixelHeight + 1)
  const footerText = state.isGameOver
    ? 'Press R to restart. ESC to menu.'
    : 'Arrows move. Up rotates. Down drops. Space drops fast.'

  if (footerY >= 0) {
    buffer.drawText(
      footerText,
      boardX,
      footerY,
      TEXT_DIM_COLOR,
      BACKGROUND_COLOR
    )
  }
}

function drawGameOverOverlay(args: { buffer: OptimizedBuffer }): void {
  const { buffer } = args
  const overlayWidth = Math.min(34, Math.max(22, buffer.width - 6))
  const overlayHeight = 5
  const overlayX = Math.max(0, Math.floor((buffer.width - overlayWidth) / 2))
  const overlayY = Math.max(0, Math.floor((buffer.height - overlayHeight) / 2))
  const title = 'GAME OVER'
  const subtitle = 'Press R to restart'
  const titleX =
    overlayX + Math.max(1, Math.floor((overlayWidth - title.length) / 2))
  const subtitleX =
    overlayX + Math.max(1, Math.floor((overlayWidth - subtitle.length) / 2))

  buffer.drawBox({
    x: overlayX,
    y: overlayY,
    width: overlayWidth,
    height: overlayHeight,
    border: true,
    borderColor: BORDER_COLOR,
    backgroundColor: BACKGROUND_COLOR,
    shouldFill: true,
  })
  buffer.drawText(title, titleX, overlayY + 1, DANGER_COLOR, BACKGROUND_COLOR)
  buffer.drawText(
    subtitle,
    subtitleX,
    overlayY + 3,
    TEXT_COLOR,
    BACKGROUND_COLOR
  )
}

function drawCell(args: {
  buffer: OptimizedBuffer
  x: number
  y: number
  kind: PieceKind
}): void {
  const { buffer, x, y, kind } = args

  if (x < 0 || x + CELL_WIDTH > buffer.width || y < 0 || y >= buffer.height) {
    return
  }

  buffer.drawText(CELL_TEXT, x, y, PIECE_COLORS[kind], BACKGROUND_COLOR)
}
