import {
  BoxRenderable,
  FrameBufferRenderable,
  type CliRenderer,
  type KeyEvent,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import { tick } from './logic.js'
import { renderGame } from './render.js'
import { createInitialState, type PongInput } from './state.js'

const PLAYFIELD_OFFSET_Y = 2
const TICK_INTERVAL_MS = 33
const PLAYER_INPUT_LATCH_TICKS = 4

function createGameArea(args: { renderer: CliRenderer }): {
  width: number
  height: number
} {
  const { renderer } = args

  return {
    width: renderer.width,
    height: Math.max(1, renderer.height - PLAYFIELD_OFFSET_Y),
  }
}

export function createGame(_args: {
  renderer: CliRenderer
  onExit: () => void
}): { cleanup: () => void } {
  const { renderer } = _args
  const gameArea = createGameArea({ renderer })
  let state = createInitialState({ gameArea })
  let pendingDirection: PongInput['direction'] = null
  let pendingDirectionTicks = 0
  let isCleanedUp = false

  const container = new BoxRenderable(renderer, {
    id: 'pong-container',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  })
  const frameBuffer = new FrameBufferRenderable(renderer, {
    id: 'pong-frame-buffer',
    width: renderer.width,
    height: renderer.height,
  })

  container.add(frameBuffer)
  renderer.root.add(container)

  function renderCurrentState() {
    renderGame({
      state,
      frameBuffer,
    })
  }

  function restartGame() {
    state = createInitialState({ gameArea })
    pendingDirection = null
    pendingDirectionTicks = 0
    renderCurrentState()
  }

  function queueDirection(args: { direction: PongInput['direction'] }) {
    const { direction } = args

    pendingDirection = direction
    pendingDirectionTicks = direction === null ? 0 : PLAYER_INPUT_LATCH_TICKS
  }

  function handleKeypress(key: KeyEvent) {
    if (isCleanedUp) {
      return
    }

    if (key.name === 'r' && state.isGameOver) {
      restartGame()
      return
    }

    if (state.isGameOver) {
      return
    }

    if (key.name === 'up') {
      queueDirection({
        direction: 'up',
      })
      return
    }

    if (key.name === 'down') {
      queueDirection({
        direction: 'down',
      })
    }
  }

  const intervalId = setInterval(() => {
    if (isCleanedUp) {
      return
    }

    const direction = pendingDirectionTicks > 0 ? pendingDirection : null

    state = tick({
      state,
      input: {
        direction,
      },
    })

    if (pendingDirectionTicks > 0) {
      pendingDirectionTicks -= 1

      if (pendingDirectionTicks === 0) {
        pendingDirection = null
      }
    }

    renderCurrentState()
  }, TICK_INTERVAL_MS)

  renderer.keyInput.on('keypress', handleKeypress)
  renderCurrentState()

  return {
    cleanup: () => {
      isCleanedUp = true
      clearInterval(intervalId)
      renderer.keyInput.off('keypress', handleKeypress)
      container.destroyRecursively()
    },
  }
}
