import {
  BoxRenderable,
  FrameBufferRenderable,
  type CliRenderer,
  type KeyEvent,
} from '@opentui/core'
import { COLORS } from '../../shared/colors.js'
import { tick } from './logic.js'
import { renderGame } from './render.js'
import { createInitialState } from './state.js'

export function createGame(args: {
  renderer: CliRenderer
  onExit: () => void
}): { cleanup: () => void } {
  const { renderer } = args
  const gameArea = {
    width: renderer.width,
    height: renderer.height - 2,
  }
  let state = createInitialState({
    gameArea,
  })
  let hasPendingFlap = false

  const container = new BoxRenderable(renderer, {
    id: 'flappy-bird-container',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  })
  const frameBuffer = new FrameBufferRenderable(renderer, {
    id: 'flappy-bird-frame-buffer',
    width: renderer.width,
    height: renderer.height,
  })

  container.add(frameBuffer)
  renderer.root.add(container)

  const renderCurrentState = () => {
    renderGame({
      state,
      frameBuffer,
    })
  }

  const intervalId = setInterval(() => {
    state = tick({
      state,
      input: {
        flap: hasPendingFlap,
      },
      randomValue: Math.random(),
    })
    hasPendingFlap = false
    renderCurrentState()
  }, 33)

  const handleKeyPress = (key: KeyEvent) => {
    if (key.name === 'space') {
      hasPendingFlap = true
      return
    }

    if (key.name === 'r' && state.isGameOver) {
      state = createInitialState({
        gameArea,
      })
      hasPendingFlap = false
      renderCurrentState()
    }
  }

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
