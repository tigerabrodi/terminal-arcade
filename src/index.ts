#!/usr/bin/env bun
import { createCliRenderer, type CliRenderer } from '@opentui/core'
import { createMenu } from './menu/index.js'
import { type AppScreen, type GameId } from './shared/types.js'
import { COLORS } from './shared/colors.js'

let currentScreen: AppScreen = { kind: 'menu' }
let currentCleanup: (() => void) | null = null

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    targetFps: 30,
    backgroundColor: COLORS.background,
  })

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
    renderer.destroy()
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason)
    renderer.destroy()
    process.exit(1)
  })

  function showMenu() {
    if (currentCleanup) {
      currentCleanup()
      currentCleanup = null
    }

    currentScreen = { kind: 'menu' }

    const { container, cleanup } = createMenu({
      renderer,
      onSelectGame: ({ gameId }) => {
        void startGame({ renderer, gameId })
      },
    })

    currentCleanup = cleanup
    renderer.root.add(container)
  }

  async function startGame(args: { renderer: CliRenderer; gameId: GameId }) {
    const { renderer, gameId } = args

    if (currentCleanup) {
      currentCleanup()
      currentCleanup = null
    }

    currentScreen = { kind: 'playing', gameId }

    // Dynamic import for each game
    // Each game module exports: createGame(args: { renderer, onExit }) => { cleanup }
    switch (gameId) {
      case 'snake': {
        const { createGame } = await import('./games/snake/index.js')
        const { cleanup } = createGame({
          renderer,
          onExit: () => showMenu(),
        })
        currentCleanup = cleanup
        break
      }
      case 'flappy-bird': {
        const { createGame } = await import('./games/flappy-bird/index.js')
        const { cleanup } = createGame({
          renderer,
          onExit: () => showMenu(),
        })
        currentCleanup = cleanup
        break
      }
      case 'dino': {
        const { createGame } = await import('./games/dino/index.js')
        const { cleanup } = createGame({
          renderer,
          onExit: () => showMenu(),
        })
        currentCleanup = cleanup
        break
      }
      case 'pong': {
        const { createGame } = await import('./games/pong/index.js')
        const { cleanup } = createGame({
          renderer,
          onExit: () => showMenu(),
        })
        currentCleanup = cleanup
        break
      }
      case 'tetris': {
        const { createGame } = await import('./games/tetris/index.js')
        const { cleanup } = createGame({
          renderer,
          onExit: () => showMenu(),
        })
        currentCleanup = cleanup
        break
      }
    }
  }

  renderer.keyInput.on('keypress', (key: { name: string }) => {
    if (key.name === 'escape') {
      if (currentScreen.kind === 'playing') {
        showMenu()
      } else {
        renderer.destroy()
        process.exit(0)
      }
    }
  })

  showMenu()
}

void main()
