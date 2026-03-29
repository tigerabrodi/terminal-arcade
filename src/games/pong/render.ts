import {
  FrameBufferRenderable,
  parseColor,
  type OptimizedBuffer,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import type { PongState } from './state.js'

const PLAYFIELD_OFFSET_Y = 2
const BACKGROUND_COLOR = parseColor(COLORS.background)
const PLAYER_COLOR = parseColor(COLORS.primary)
const CPU_COLOR = parseColor(COLORS.secondary)
const BALL_COLOR = parseColor(COLORS.accent)
const TEXT_COLOR = parseColor(COLORS.text)
const DANGER_COLOR = parseColor(COLORS.danger)
const CENTER_LINE_COLOR = parseColor(COLORS.textDim)

export function renderGame(args: {
  state: PongState
  frameBuffer: FrameBufferRenderable
}): void {
  const { state, frameBuffer } = args
  const buffer = frameBuffer.frameBuffer

  buffer.clear(BACKGROUND_COLOR)

  drawScore({
    buffer,
    state,
  })
  drawCenterLine({
    buffer,
    state,
  })
  drawPaddle({
    buffer,
    x: 1,
    paddle: state.player,
    color: PLAYER_COLOR,
  })
  drawPaddle({
    buffer,
    x: state.gameArea.width - 2,
    paddle: state.cpu,
    color: CPU_COLOR,
  })
  drawBall({
    buffer,
    state,
  })

  if (state.isGameOver) {
    drawGameOverOverlay({
      buffer,
      state,
    })
  }

  frameBuffer.requestRender()
}

function drawScore(args: { buffer: OptimizedBuffer; state: PongState }): void {
  const { buffer, state } = args
  const text = `YOU ${state.playerScore}   CPU ${state.cpuScore}`
  const x = Math.max(0, Math.floor((buffer.width - text.length) / 2))

  buffer.drawText(text, x, 0, TEXT_COLOR, BACKGROUND_COLOR)
}

function drawCenterLine(args: {
  buffer: OptimizedBuffer
  state: PongState
}): void {
  const { buffer, state } = args
  const centerX = Math.floor(state.gameArea.width / 2)

  for (let y = 0; y < state.gameArea.height; y += 1) {
    if (y % 2 !== 0) {
      continue
    }

    drawCell({
      buffer,
      x: centerX,
      y: PLAYFIELD_OFFSET_Y + y,
      char: '|',
      fg: CENTER_LINE_COLOR,
    })
  }
}

function drawPaddle(args: {
  buffer: OptimizedBuffer
  x: number
  paddle: PongState['player']
  color: ReturnType<typeof parseColor>
}): void {
  const { buffer, x, paddle, color } = args

  for (let offset = 0; offset < paddle.height; offset += 1) {
    drawCell({
      buffer,
      x,
      y: PLAYFIELD_OFFSET_Y + Math.round(paddle.y) + offset,
      char: '|',
      fg: color,
    })
  }
}

function drawBall(args: { buffer: OptimizedBuffer; state: PongState }): void {
  const { buffer, state } = args

  drawCell({
    buffer,
    x: Math.round(state.ball.x),
    y: PLAYFIELD_OFFSET_Y + Math.round(state.ball.y),
    char: 'O',
    fg: BALL_COLOR,
  })
}

function drawGameOverOverlay(args: {
  buffer: OptimizedBuffer
  state: PongState
}): void {
  const { buffer, state } = args
  const title = state.winner === 'player' ? 'YOU WIN' : 'YOU LOSE'
  const subtitle = 'Press R to restart'
  const overlayWidth = Math.min(28, Math.max(20, subtitle.length + 4))
  const overlayHeight = 5
  const overlayX = Math.max(0, Math.floor((buffer.width - overlayWidth) / 2))
  const overlayY = Math.max(1, Math.floor((buffer.height - overlayHeight) / 2))

  buffer.drawBox({
    x: overlayX,
    y: overlayY,
    width: overlayWidth,
    height: overlayHeight,
    border: true,
    borderColor: PLAYER_COLOR,
    backgroundColor: BACKGROUND_COLOR,
    shouldFill: true,
  })
  drawCenteredText({
    buffer,
    text: title,
    y: overlayY + 1,
    fg: state.winner === 'player' ? PLAYER_COLOR : DANGER_COLOR,
  })
  drawCenteredText({
    buffer,
    text: subtitle,
    y: overlayY + 3,
    fg: TEXT_COLOR,
  })
}

function drawCenteredText(args: {
  buffer: OptimizedBuffer
  text: string
  y: number
  fg: ReturnType<typeof parseColor>
}): void {
  const { buffer, text, y, fg } = args
  const x = Math.max(0, Math.floor((buffer.width - text.length) / 2))

  buffer.drawText(text, x, y, fg, BACKGROUND_COLOR)
}

function drawCell(args: {
  buffer: OptimizedBuffer
  x: number
  y: number
  char: string
  fg: ReturnType<typeof parseColor>
}): void {
  const { buffer, x, y, char, fg } = args

  if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height) {
    return
  }

  buffer.setCell(x, y, char, fg, BACKGROUND_COLOR)
}
