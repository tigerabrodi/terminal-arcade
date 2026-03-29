import {
  FrameBufferRenderable,
  parseColor,
  type OptimizedBuffer,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import type { FlappyBirdState } from './state.js'

const backgroundColor = parseColor(COLORS.background)
const birdColor = parseColor(COLORS.accent)
const groundColor = parseColor(COLORS.primaryDim)
const pipeColor = parseColor(COLORS.primary)
const scoreColor = parseColor(COLORS.secondary)
const textColor = parseColor(COLORS.text)
const dangerColor = parseColor(COLORS.danger)

export function renderGame(args: {
  state: FlappyBirdState
  frameBuffer: FrameBufferRenderable
}): void {
  const { state, frameBuffer } = args
  const buffer = frameBuffer.frameBuffer

  buffer.clear(backgroundColor)

  drawScore({
    buffer,
    score: state.score,
  })
  drawBird({
    buffer,
    state,
  })
  drawPipes({
    buffer,
    state,
  })
  drawGround({
    buffer,
    state,
  })

  if (state.isGameOver) {
    drawGameOverOverlay({
      buffer,
    })
  }

  frameBuffer.requestRender()
}

function drawScore(args: { buffer: OptimizedBuffer; score: number }): void {
  const { buffer, score } = args
  const text = `Score ${score}`
  const x = Math.max(0, Math.floor((buffer.width - text.length) / 2))

  buffer.drawText(text, x, 1, scoreColor, backgroundColor)
}

function drawBird(args: {
  buffer: OptimizedBuffer
  state: FlappyBirdState
}): void {
  const { buffer, state } = args
  const x = state.birdX
  const y = 2 + Math.round(state.bird.y)
  const isWingRaised = state.tickCount % 6 < 3
  const wingY = isWingRaised ? y - 1 : y + 1
  const wingChar = isWingRaised ? '^' : 'v'

  drawCell({
    buffer,
    x,
    y,
    char: 'o',
    fg: birdColor,
  })
  drawCell({
    buffer,
    x: x - 1,
    y,
    char: '~',
    fg: birdColor,
  })
  drawCell({
    buffer,
    x: x + 1,
    y,
    char: '>',
    fg: birdColor,
  })
  drawCell({
    buffer,
    x,
    y: wingY,
    char: wingChar,
    fg: birdColor,
  })
}

function drawPipes(args: {
  buffer: OptimizedBuffer
  state: FlappyBirdState
}): void {
  const { buffer, state } = args

  for (const pipe of state.pipes) {
    for (let xOffset = 0; xOffset < state.pipeWidth; xOffset += 1) {
      const pipeX = pipe.x + xOffset

      for (let playfieldY = 0; playfieldY < pipe.gapTop; playfieldY += 1) {
        drawCell({
          buffer,
          x: pipeX,
          y: 2 + playfieldY,
          char: '|',
          fg: pipeColor,
        })
      }

      for (
        let playfieldY = pipe.gapBottom;
        playfieldY < state.gameArea.height;
        playfieldY += 1
      ) {
        drawCell({
          buffer,
          x: pipeX,
          y: 2 + playfieldY,
          char: '|',
          fg: pipeColor,
        })
      }
    }
  }
}

function drawGround(args: {
  buffer: OptimizedBuffer
  state: FlappyBirdState
}): void {
  const { buffer, state } = args
  const groundY = state.gameArea.height + 2

  for (let x = 0; x < buffer.width; x += 1) {
    const char = (x + state.tickCount) % 2 === 0 ? '=' : '-'

    drawCell({
      buffer,
      x,
      y: groundY,
      char,
      fg: groundColor,
    })
  }
}

function drawGameOverOverlay(args: { buffer: OptimizedBuffer }): void {
  const { buffer } = args

  drawCenteredText({
    buffer,
    text: 'GAME OVER',
    y: Math.max(1, Math.floor(buffer.height / 2) - 1),
    fg: dangerColor,
  })
  drawCenteredText({
    buffer,
    text: 'Press R to restart',
    y: Math.max(2, Math.floor(buffer.height / 2)),
    fg: textColor,
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

  buffer.drawText(text, x, y, fg, backgroundColor)
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

  buffer.setCell(x, y, char, fg, backgroundColor)
}
