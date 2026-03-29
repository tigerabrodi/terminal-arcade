// TODO: Write tests first (TDD)
//
// Test cases to cover:
// - Player paddle moves up when direction is up
// - Player paddle moves down when direction is down
// - Player paddle does not move past top wall
// - Player paddle does not move past bottom wall
// - CPU paddle tracks ball y position
// - CPU paddle does not move past walls
// - Ball moves by velocity each tick
// - Ball bounces off top wall (velocityY inverts)
// - Ball bounces off bottom wall (velocityY inverts)
// - Ball bounces off player paddle (velocityX inverts)
// - Ball bounces off CPU paddle (velocityX inverts)
// - Ball passing left edge scores for CPU
// - Ball passing right edge scores for player
// - Ball resets to center after score
// - Game over when either player reaches maxScore
// - Game over freezes state

import { describe, test, expect } from 'bun:test'

describe('pong logic', () => {
  test.skip('player paddle moves up', () => {
    expect(true).toBe(true)
  })
})
