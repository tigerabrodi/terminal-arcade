// TODO: Write tests first (TDD)
//
// Test cases to cover:
// - Player stays on ground when not jumping
// - Jump sets upward velocity
// - Gravity pulls player back to ground
// - Player cannot jump while already jumping
// - Ducking changes player hitbox
// - Obstacles scroll left each tick
// - Collision detected with cactus
// - Collision avoided when jumping over cactus
// - Collision avoided when ducking under bird
// - Scroll speed increases with score
// - Obstacles removed when off screen
// - Spawn cooldown prevents overlapping obstacles

import { describe, test, expect } from 'bun:test'

describe('dino logic', () => {
  test.skip('player stays on ground when not jumping', () => {
    expect(true).toBe(true)
  })
})
