import {
  BoxRenderable,
  FrameBufferRenderable,
  type CliRenderer,
  type KeyEvent,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import { tick } from './logic.js'
import { renderTetris } from './render.js'
import { createInitialState, type TetrisInput } from './state.js'

const TICK_INTERVAL_MS = 33

function getActionFromKey(args: { key: KeyEvent }): TetrisInput['action'] {
  const { key } = args

  switch (key.name) {
    case 'left':
      return 'left'
    case 'right':
      return 'right'
    case 'up':
      return 'rotate'
    case 'down':
      return 'down'
    case 'space':
      return 'drop'
    default:
      return null
  }
}

export function createGame(args: {
  renderer: CliRenderer
  onExit: () => void
}): { cleanup: () => void } {
  const { renderer } = args
  const container = new BoxRenderable(renderer, {
    id: 'tetris-container',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  })
  const frameBuffer = new FrameBufferRenderable(renderer, {
    id: 'tetris-frame-buffer',
    width: renderer.width,
    height: renderer.height,
  })
  let state = createInitialState({})
  let pendingAction: TetrisInput['action'] = null

  container.add(frameBuffer)
  renderer.root.add(container)

  function renderCurrentState() {
    renderTetris({
      state,
      frameBuffer,
    })
  }

  function restartGame() {
    state = createInitialState({})
    pendingAction = null
    renderCurrentState()
  }

  function handleKeyPress(key: KeyEvent) {
    if (key.name === 'r' && state.isGameOver) {
      restartGame()
      return
    }

    if (state.isGameOver) {
      return
    }

    pendingAction = getActionFromKey({
      key,
    })
  }

  const intervalId = setInterval(() => {
    state = tick({
      state,
      input: { action: pendingAction },
      randomValue: Math.random(),
    })
    pendingAction = null
    renderCurrentState()
  }, TICK_INTERVAL_MS)

  renderer.keyInput.on('keypress', handleKeyPress)
  renderCurrentState()

  return {
    cleanup: () => {
      clearInterval(intervalId)
      renderer.keyInput.off('keypress', handleKeyPress)
      container.destroyRecursively()
    },
  }
}
