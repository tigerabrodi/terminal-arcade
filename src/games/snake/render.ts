import {
  BoxRenderable,
  FrameBufferRenderable,
  TextRenderable,
  parseColor,
  type CliRenderer,
  type Renderable,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import type { SnakeState } from './state.js'

export const SNAKE_CELL_WIDTH = 2

const BACKGROUND = parseColor(COLORS.background)
const BORDER = parseColor(COLORS.border)
const HEAD = parseColor(COLORS.primary)
const BODY = parseColor(COLORS.primaryDim)
const FOOD = parseColor(COLORS.accent)
const DANGER = parseColor(COLORS.danger)

export function createSnakeRenderer(args: {
  renderer: CliRenderer
  state: SnakeState
}): {
  container: Renderable
  render: (args: { state: SnakeState }) => void
} {
  const { renderer, state } = args

  const container = new BoxRenderable(renderer, {
    id: 'snake-container',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    gap: 1,
  })

  const scoreText = new TextRenderable(renderer, {
    id: 'snake-score',
    content: '',
    fg: COLORS.primary,
  })

  const board = new FrameBufferRenderable(renderer, {
    id: 'snake-board',
    width: state.gameArea.width * SNAKE_CELL_WIDTH + 2,
    height: state.gameArea.height + 2,
  })

  const statusText = new TextRenderable(renderer, {
    id: 'snake-status',
    content: '',
    fg: COLORS.textDim,
  })

  container.add(scoreText)
  container.add(board)
  container.add(statusText)

  function drawBorder(args: { state: SnakeState }) {
    const { state } = args
    const boardWidth = state.gameArea.width * SNAKE_CELL_WIDTH + 2
    const boardHeight = state.gameArea.height + 2

    board.frameBuffer.drawText('+', 0, 0, BORDER, BACKGROUND)
    board.frameBuffer.drawText('+', boardWidth - 1, 0, BORDER, BACKGROUND)
    board.frameBuffer.drawText('+', 0, boardHeight - 1, BORDER, BACKGROUND)
    board.frameBuffer.drawText(
      '+',
      boardWidth - 1,
      boardHeight - 1,
      BORDER,
      BACKGROUND
    )

    for (let x = 1; x < boardWidth - 1; x += 1) {
      board.frameBuffer.drawText('-', x, 0, BORDER, BACKGROUND)
      board.frameBuffer.drawText('-', x, boardHeight - 1, BORDER, BACKGROUND)
    }

    for (let y = 1; y < boardHeight - 1; y += 1) {
      board.frameBuffer.drawText('|', 0, y, BORDER, BACKGROUND)
      board.frameBuffer.drawText('|', boardWidth - 1, y, BORDER, BACKGROUND)
    }
  }

  function drawSprite(args: {
    x: number
    y: number
    char: string
    color: typeof HEAD
  }) {
    const { x, y, char, color } = args
    board.frameBuffer.drawText(
      char.repeat(SNAKE_CELL_WIDTH),
      x * SNAKE_CELL_WIDTH + 1,
      y + 1,
      color,
      BACKGROUND
    )
  }

  function drawOverlay(args: { state: SnakeState }) {
    const { state } = args
    const message = 'GAME OVER. PRESS R TO RESTART.'
    const boardInnerWidth = state.gameArea.width * SNAKE_CELL_WIDTH
    const visibleMessage = message.slice(0, boardInnerWidth)
    const messageX =
      1 +
      Math.max(
        0,
        Math.floor((boardInnerWidth - visibleMessage.length) / 2)
      )
    const messageY = 1 + Math.floor(state.gameArea.height / 2)

    board.frameBuffer.drawText(
      visibleMessage,
      messageX,
      messageY,
      DANGER,
      BACKGROUND
    )
  }

  function render(args: { state: SnakeState }) {
    const { state } = args

    scoreText.content = `Score ${state.score}`
    statusText.content = state.isGameOver
      ? 'GAME OVER. Press R to restart. ESC to menu.'
      : 'Arrows or WASD to move. ESC to menu.'

    board.frameBuffer.clear(BACKGROUND)
    drawBorder({ state })
    drawSprite({
      x: state.food.x,
      y: state.food.y,
      char: '*',
      color: FOOD,
    })

    state.snake.forEach((segment, index) => {
      drawSprite({
        x: segment.x,
        y: segment.y,
        char: index === 0 ? '@' : 'o',
        color: index === 0 ? HEAD : BODY,
      })
    })

    if (state.isGameOver) {
      drawOverlay({ state })
    }
  }

  render({ state })

  return {
    container,
    render,
  }
}
