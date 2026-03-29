import type { CliRenderer, KeyEvent } from '@opentui/core'
import { tick } from './logic.js'
import { createSnakeRenderer, SNAKE_CELL_WIDTH } from './render.js'
import { createInitialState, type Direction } from './state.js'

function getDirectionFromKey(args: { name: string }): Direction | null {
  const { name } = args

  switch (name) {
    case 'up':
    case 'w':
      return 'up'
    case 'down':
    case 's':
      return 'down'
    case 'left':
    case 'a':
      return 'left'
    case 'right':
    case 'd':
      return 'right'
    default:
      return null
  }
}

function createGameArea(args: { renderer: CliRenderer }): {
  width: number
  height: number
} {
  const { renderer } = args

  return {
    width: Math.max(4, Math.floor((renderer.width - 10) / SNAKE_CELL_WIDTH)),
    height: Math.max(4, renderer.height - 8),
  }
}

export function createGame(args: {
  renderer: CliRenderer
  onExit: () => void
}): { cleanup: () => void } {
  const { renderer } = args
  const gameArea = createGameArea({ renderer })
  let state = createInitialState({ gameArea })
  let pendingDirection: Direction | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let isCleanedUp = false

  const { container, render } = createSnakeRenderer({
    renderer,
    state,
  })

  function stopLoop() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function scheduleNextTick() {
    if (isCleanedUp || state.isGameOver) {
      return
    }

    stopLoop()
    timeoutId = setTimeout(() => {
      timeoutId = null

      if (isCleanedUp) {
        return
      }

      state = tick({
        state,
        input: { direction: pendingDirection },
        random: Math.random(),
      })
      pendingDirection = null
      render({ state })
      scheduleNextTick()
    }, state.tickInterval)
  }

  function restartGame() {
    stopLoop()
    pendingDirection = null
    state = createInitialState({ gameArea })
    render({ state })
    scheduleNextTick()
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

    const nextDirection = getDirectionFromKey({ name: key.name })

    if (nextDirection !== null) {
      pendingDirection = nextDirection
    }
  }

  renderer.root.add(container)
  renderer.keyInput.on('keypress', handleKeypress)
  render({ state })
  scheduleNextTick()

  return {
    cleanup: () => {
      isCleanedUp = true
      stopLoop()
      renderer.keyInput.off('keypress', handleKeypress)
      container.destroyRecursively()
    },
  }
}
