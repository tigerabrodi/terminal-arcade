# Development Plan

## Overview

Terminal Arcade: three retro games (Dino Run, Flappy Bird, Snake) in a terminal UI. Built with Bun + OpenTUI. Users run `bunx terminal-arcade` and pick a game from a menu.

## Phase 1: Scaffold (DONE)

- Project config (package.json, tsconfig, eslint, prettier)
- Folder structure with game stubs
- Shared types and colors
- Menu with ASCIIFont title + Select picker
- Entry point with routing (menu <-> game)

## Phase 2: Game Implementation (Parallel)

Three agents work independently, one per game. Each agent follows strict TDD: write tests, see them fail, implement logic, see them pass. Then build the rendering and wiring.

---

### Agent A: Dino Run

**Scope:** `src/games/dino/`

**Files to implement:**

- `state.ts` - already scaffolded with types and `createInitialState`
- `logic.ts` - all pure game logic
- `logic.test.ts` - all tests for logic
- `render.ts` - draw DinoState to FrameBuffer
- `index.ts` - wire keyboard input, game loop, rendering

**Game mechanics:**

- Player character on a ground baseline at `groundY`
- Spacebar/Up arrow = jump (set `velocityY` to `jumpStrength`)
- Down arrow = duck (changes hitbox, avoids flying obstacles)
- Gravity pulls player back to ground each tick
- Cannot jump while already in the air
- Obstacles scroll from right to left at `scrollSpeed`
- Three obstacle types: `cactus-small` (1 wide, 2 tall), `cactus-large` (2 wide, 3 tall), `bird` (flies at duck height)
- Collision = game over. Hitbox-based: compare player bounds vs obstacle bounds
- Score increments every tick. Every 100 points, `scrollSpeed` increases
- Spawn cooldown prevents obstacles from appearing too close together
- Obstacles removed when they scroll past the left edge

**Test cases to write:**

1. Player stays on ground when not jumping
2. Jump sets upward velocity, `isJumping` becomes true
3. Gravity applies each tick, pulls player back to groundY
4. Player cannot jump while already jumping (velocity != 0 or y != groundY)
5. Landing on ground resets `isJumping` and velocity
6. Duck sets `isDucking` to true, changes effective hitbox height
7. Obstacles move left by `scrollSpeed` each tick
8. Collision detected when player overlaps cactus
9. No collision when player jumps over cactus
10. No collision when player ducks under bird
11. Collision when player stands into bird
12. Speed increases at score milestones (every 100)
13. Obstacles off-screen (x < 0) are removed
14. Spawn cooldown prevents back-to-back obstacles
15. Game over flag set on collision, state frozen after

**Rendering approach:**

- FrameBuffer sized to terminal
- Ground line drawn across bottom
- Player drawn as 2-3 character block (standing or ducking sprite)
- Obstacles drawn as block shapes
- Score displayed top-right as text
- "GAME OVER - press R to restart" overlay on death

**Controls:**

- Space / Up arrow: jump
- Down arrow: duck
- R: restart after game over
- ESC: back to menu (handled by parent)

---

### Agent B: Flappy Bird

**Scope:** `src/games/flappy-bird/`

**Files to implement:**

- `state.ts` - already scaffolded with types and `createInitialState`
- `logic.ts` - all pure game logic
- `logic.test.ts` - all tests for logic
- `render.ts` - draw FlappyBirdState to FrameBuffer
- `index.ts` - wire keyboard input, game loop, rendering

**Game mechanics:**

- Bird is on the left side of screen (fixed x, around column 10)
- Bird has `y` position and `velocity`
- Each tick: `velocity += gravity`, `y += velocity` (gravity pulls down)
- Spacebar = flap: sets `velocity` to `flapStrength` (negative = upward)
- Pipes spawn from right edge at regular intervals (`pipeSpawnInterval` ticks)
- Each pipe has `x`, `gapTop`, `gapBottom` defining the passable gap
- Pipes move left by `pipeSpeed` each tick
- Gap size stays constant, gap vertical position is random within bounds
- Collision if bird y is outside the gap when bird x overlaps pipe x
- Collision if bird y < 0 (ceiling) or bird y >= gameArea height (floor)
- Score increments when bird passes a pipe (pipe x crosses bird x)
- `hasPassed` flag on pipe prevents double-counting score
- Pipes removed when x < -pipe width (off screen left)

**Test cases to write:**

1. Bird y increases each tick (falls due to gravity)
2. Bird velocity increases by gravity each tick
3. Flap sets velocity to flapStrength (negative)
4. Flap during fall resets velocity to flapStrength
5. Pipes move left by pipeSpeed each tick
6. New pipe spawns when tickCount % pipeSpawnInterval === 0
7. Pipe gap is within valid range (not too close to edges)
8. Collision when bird y is above gapTop at pipe x
9. Collision when bird y is below gapBottom at pipe x
10. No collision when bird is within gap
11. Collision when bird hits ceiling (y < 0)
12. Collision when bird hits floor (y >= height)
13. Score increments when pipe passes bird x
14. Score does not double-count (hasPassed flag)
15. Off-screen pipes are removed
16. Game over freezes state

**Rendering approach:**

- FrameBuffer sized to terminal
- Bird drawn as a character (e.g. `>` or a small sprite) at fixed x, varying y
- Pipes drawn as vertical columns with a gap
- Score displayed top-center
- "GAME OVER - press R to restart" overlay on death
- Scrolling ground decoration at bottom

**Controls:**

- Space: flap
- R: restart after game over
- ESC: back to menu (handled by parent)

---

### Agent C: Snake

**Scope:** `src/games/snake/`

**Files to implement:**

- `state.ts` - already scaffolded with types and `createInitialState`
- `logic.ts` - all pure game logic
- `logic.test.ts` - all tests for logic
- `render.ts` - draw SnakeState to FrameBuffer
- `index.ts` - wire keyboard input, game loop, rendering

**Game mechanics:**

- Grid-based movement on `gameArea` (width x height cells)
- Snake is an array of `Position` (head is index 0)
- Each tick: move head one cell in `direction`, remove tail (unless growing)
- Arrow keys change direction
- Cannot reverse: if going right, pressing left is ignored
- Food is a single `Position` on the grid
- When head lands on food: don't remove tail (snake grows), spawn new food, increment score
- Food must spawn on an unoccupied cell (not on any snake segment)
- Wall collision: head x/y out of bounds = game over
- Self collision: head position matches any body segment = game over
- `tickInterval` decreases as score increases (game speeds up)

**Test cases to write:**

1. Snake moves right: head x increases by 1
2. Snake moves left: head x decreases by 1
3. Snake moves up: head y decreases by 1
4. Snake moves down: head y increases by 1
5. Tail is removed each tick (snake doesn't grow without food)
6. Cannot reverse direction (right -> left ignored, keeps going right)
7. Cannot reverse direction (up -> down ignored)
8. Eating food: snake grows by 1 (tail not removed)
9. Eating food: score increments
10. Eating food: new food spawns
11. New food does not spawn on snake body
12. Wall collision: head x < 0 = game over
13. Wall collision: head x >= width = game over
14. Wall collision: head y < 0 = game over
15. Wall collision: head y >= height = game over
16. Self collision: head hits body = game over
17. Self collision: head hits second segment after reverse would be blocked anyway
18. Tick interval decreases every N points
19. Game over freezes state (no more movement)

**Rendering approach:**

- FrameBuffer sized to gameArea
- Border drawn around the grid
- Snake head drawn as one character, body as another
- Food drawn as a distinct colored character
- Score displayed above the grid
- "GAME OVER - press R to restart" overlay on death

**Controls:**

- Arrow keys / WASD: change direction
- R: restart after game over
- ESC: back to menu (handled by parent)

---

## Phase 3: Integration

- Verify menu -> game -> ESC -> menu flow works
- Test all three games end-to-end manually
- Fix any rendering/layout issues

## Phase 4: Polish

- Tune game feel (gravity curves, speeds, hitbox sizes)
- Refine the retro green color theme
- Add game over animation
- High score tracking (in-memory per session)

## Phase 5: Sound & Ship (Later)

- Sound effects and music (deferred)
- README with demo GIF
- npm publish config for `bunx terminal-arcade`

## OpenTUI Documentation Links

### Core Concepts

- Renderer: https://opentui.com/docs/core-concepts/renderer/
- Renderables: https://opentui.com/docs/core-concepts/renderables/
- Constructs: https://opentui.com/docs/core-concepts/constructs/
- Renderables vs Constructs: https://opentui.com/docs/core-concepts/renderables-vs-constructs/
- Layout: https://opentui.com/docs/core-concepts/layout/
- Keyboard: https://opentui.com/docs/core-concepts/keyboard/
- Console: https://opentui.com/docs/core-concepts/console/
- Colors: https://opentui.com/docs/core-concepts/colors/
- Lifecycle: https://opentui.com/docs/core-concepts/lifecycle/

### Components

- FrameBuffer: https://opentui.com/docs/components/frame-buffer/
- Select: https://opentui.com/docs/components/select/
- ASCIIFont: https://opentui.com/docs/components/ascii-font/
- Text: https://opentui.com/docs/components/text/
- Box: https://opentui.com/docs/components/box/
- ScrollBox: https://opentui.com/docs/components/scroll-box/
- Input: https://opentui.com/docs/components/input/
- Slider: https://opentui.com/docs/components/slider/
- Code: https://opentui.com/docs/components/code/
- Markdown: https://opentui.com/docs/components/markdown/
- Diff: https://opentui.com/docs/components/diff/

### Other

- Getting Started: https://opentui.com/docs/getting-started/
- Plugin API: https://opentui.com/docs/plugin-api/overview/
- Environment Variables: https://opentui.com/docs/reference/environment-variables/
