// TODO: Write tests first (TDD)
//
// Test cases to cover:
// - Piece moves left when action is left
// - Piece moves right when action is right
// - Piece does not move past left wall
// - Piece does not move past right wall
// - Piece moves down on soft drop
// - Piece drops to bottom on hard drop
// - Piece locks when it cannot move down further
// - New piece spawns after locking
// - Piece rotates clockwise
// - Piece does not rotate into wall or locked cells
// - Full row is cleared
// - Multiple rows cleared at once
// - Score increases on line clear (more lines = more points)
// - Level increases every 10 lines
// - Drop speed increases with level
// - Game over when new piece overlaps locked cells
// - Game over freezes state

import { describe, test, expect } from 'bun:test'

describe('tetris logic', () => {
  test.skip('piece moves left', () => {
    expect(true).toBe(true)
  })
})
