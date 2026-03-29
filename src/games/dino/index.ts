import {
  BoxRenderable,
  FrameBufferRenderable,
  type CliRenderer,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import { tick } from './logic.js'
import { renderDino } from './render.js'
import { createInitialState } from './state.js'

const TICK_INTERVAL_MS = 100
const DUCK_LATCH_TICKS = 2

export function createGame(args: {
  renderer: CliRenderer
  onExit: () => void
}): { cleanup: () => void } {
  const { renderer } = args
  const gameArea = {
    width: renderer.width,
    height: renderer.height,
  }
  const container = new BoxRenderable(renderer, {
    id: 'dino-container',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  })
  const frameBuffer = new FrameBufferRenderable(renderer, {
    id: 'dino-frame-buffer',
    width: gameArea.width,
    height: gameArea.height,
  })
  let state = createInitialState({ gameArea })
  let hasPendingJump = false
  let duckTicksRemaining = 0

  container.add(frameBuffer)
  renderer.root.add(container)

  const drawState = () => {
    renderDino({
      buffer: frameBuffer.frameBuffer,
      state,
    })
    frameBuffer.requestRender()
  }
  const resetGame = () => {
    state = createInitialState({ gameArea })
    hasPendingJump = false
    duckTicksRemaining = 0
    drawState()
  }
  const handleKeypress = (key: { name: string }) => {
    if (key.name === 'r' && state.isGameOver) {
      resetGame()
      return
    }

    if (state.isGameOver) {
      return
    }

    if (key.name === 'space' || key.name === 'up') {
      hasPendingJump = true
    }

    if (key.name === 'down') {
      duckTicksRemaining = DUCK_LATCH_TICKS
    }
  }
  const interval = setInterval(() => {
    const input = {
      jump: hasPendingJump,
      duck: duckTicksRemaining > 0,
    }

    hasPendingJump = false

    if (duckTicksRemaining > 0) {
      duckTicksRemaining -= 1
    }

    state = tick({
      state,
      input,
    })
    drawState()
  }, TICK_INTERVAL_MS)

  renderer.keyInput.on('keypress', handleKeypress)
  drawState()

  return {
    cleanup: () => {
      clearInterval(interval)
      renderer.keyInput.off('keypress', handleKeypress)
      container.destroyRecursively()
    },
  }
}
