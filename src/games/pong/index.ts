import type { CliRenderer } from '@opentui/core'

// TODO: Wire input -> logic -> render
// This is the glue that connects keyboard input, game logic, and rendering

export function createGame(_args: {
  renderer: CliRenderer
  onExit: () => void
}): { cleanup: () => void } {
  // Placeholder - will be implemented
  return {
    cleanup: () => {
      // Remove renderables, clear intervals, remove listeners
    },
  }
}
