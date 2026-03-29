import { type OptimizedBuffer, type RGBA, parseColor } from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import { getObstacleBounds, getPlayerBounds } from './logic.js'
import type { DinoState } from './state.js'

const BACKGROUND_COLOR = parseColor(COLORS.background)
const PLAYER_COLOR = parseColor(COLORS.primary)
const OBSTACLE_COLOR = parseColor(COLORS.secondary)
const GROUND_COLOR = parseColor(COLORS.primaryDim)
const SCORE_COLOR = parseColor(COLORS.accent)
const TEXT_COLOR = parseColor(COLORS.text)
const DANGER_COLOR = parseColor(COLORS.danger)

const PLAYER_STANDING_SPRITE = ['00', '[]', '^^']
const PLAYER_DUCKING_SPRITE = ['00', '==']
const CACTUS_SMALL_SPRITE = ['|', '|']
const CACTUS_LARGE_SPRITE = ['||', '||', '||']
const BIRD_SPRITE = ['~~', '<>']

export function renderDino(args: {
  buffer: OptimizedBuffer
  state: DinoState
}): void {
  const { buffer, state } = args

  buffer.clear(BACKGROUND_COLOR)
  drawGround({
    buffer,
    state,
  })

  for (const obstacle of state.obstacles) {
    const bounds = getObstacleBounds({
      obstacle,
      groundY: state.groundY,
    })

    drawSprite({
      buffer,
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      lines: getObstacleSprite({
        kind: obstacle.kind,
      }),
      fgColor: OBSTACLE_COLOR,
      maxWidth: state.gameArea.width,
      maxHeight: state.gameArea.height,
    })
  }

  const playerBounds = getPlayerBounds({
    player: state.player,
    groundY: state.groundY,
  })

  drawSprite({
    buffer,
    x: Math.round(playerBounds.x),
    y: Math.round(playerBounds.y),
    lines: state.player.isDucking
      ? PLAYER_DUCKING_SPRITE
      : PLAYER_STANDING_SPRITE,
    fgColor: PLAYER_COLOR,
    maxWidth: state.gameArea.width,
    maxHeight: state.gameArea.height,
  })

  drawScore({
    buffer,
    state,
  })

  if (state.isGameOver) {
    drawGameOverOverlay({
      buffer,
      state,
    })
  }
}

function drawGround(args: { buffer: OptimizedBuffer; state: DinoState }): void {
  const { buffer, state } = args
  const lineY = Math.min(state.gameArea.height - 1, state.groundY + 1)

  if (lineY < 0) {
    return
  }

  buffer.drawText('-'.repeat(state.gameArea.width), 0, lineY, GROUND_COLOR)

  if (lineY + 1 < state.gameArea.height) {
    buffer.fillRect(
      0,
      lineY + 1,
      state.gameArea.width,
      state.gameArea.height - (lineY + 1),
      BACKGROUND_COLOR
    )
  }
}

function drawScore(args: { buffer: OptimizedBuffer; state: DinoState }): void {
  const { buffer, state } = args
  const scoreText = `SCORE ${state.score}`
  const scoreX = Math.max(0, state.gameArea.width - scoreText.length - 1)

  buffer.drawText(scoreText, scoreX, 1, SCORE_COLOR)
}

function drawGameOverOverlay(args: {
  buffer: OptimizedBuffer
  state: DinoState
}): void {
  const { buffer, state } = args
  const overlayWidth = Math.min(28, Math.max(18, state.gameArea.width - 4))
  const overlayHeight = 5
  const overlayX = Math.max(
    0,
    Math.floor((state.gameArea.width - overlayWidth) / 2)
  )
  const overlayY = Math.max(
    0,
    Math.floor((state.gameArea.height - overlayHeight) / 2)
  )
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
    borderColor: PLAYER_COLOR,
    backgroundColor: BACKGROUND_COLOR,
    shouldFill: true,
  })
  buffer.drawText(title, titleX, overlayY + 1, DANGER_COLOR)
  buffer.drawText(subtitle, subtitleX, overlayY + 3, TEXT_COLOR)
}

function getObstacleSprite(args: {
  kind: DinoState['obstacles'][number]['kind']
}): Array<string> {
  const { kind } = args

  switch (kind) {
    case 'cactus-small':
      return CACTUS_SMALL_SPRITE
    case 'cactus-large':
      return CACTUS_LARGE_SPRITE
    case 'bird':
      return BIRD_SPRITE
  }
}

function drawSprite(args: {
  buffer: OptimizedBuffer
  x: number
  y: number
  lines: Array<string>
  fgColor: RGBA
  maxWidth: number
  maxHeight: number
}): void {
  const { buffer, x, y, lines, fgColor, maxWidth, maxHeight } = args

  for (const [lineIndex, line] of lines.entries()) {
    const drawY = y + lineIndex

    if (drawY < 0 || drawY >= maxHeight) {
      continue
    }

    const isOffscreen = x >= maxWidth || x + line.length <= 0

    if (isOffscreen) {
      continue
    }

    const visibleStart = Math.max(0, -x)
    const visibleEnd = Math.min(line.length, maxWidth - x)
    const visibleText = line.slice(visibleStart, visibleEnd)

    if (visibleText.length === 0) {
      continue
    }

    buffer.drawText(visibleText, Math.max(0, x), drawY, fgColor)
  }
}
