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

### Agent D: Pong

**Scope:** `src/games/pong/`

**Files to implement:**

- `state.ts` - already scaffolded with types and `createInitialState`
- `logic.ts` - all pure game logic
- `logic.test.ts` - all tests for logic
- `render.ts` - draw PongState to FrameBuffer
- `index.ts` - wire keyboard input, game loop, rendering

**Game mechanics:**

- Two paddles: player (left side, column 1) and CPU (right side, last column - 1)
- Ball bounces around the play area
- Up/Down arrows move the player paddle
- CPU paddle tracks the ball's y position with limited speed (beatable AI)
- Ball has `velocityX` and `velocityY`, moves each tick
- Ball bounces off top and bottom walls (invert `velocityY`)
- Ball bounces off paddles (invert `velocityX`, adjust `velocityY` based on where it hits the paddle)
- Ball passing left edge = CPU scores. Ball passing right edge = player scores.
- After a score, ball resets to center heading toward the scorer
- Game over when either player reaches `maxScore` (5)
- Winner displayed on game over screen

**Test cases to write:**

1. Player paddle moves up when direction is up
2. Player paddle moves down when direction is down
3. Player paddle does not move past top wall
4. Player paddle does not move past bottom wall
5. CPU paddle moves toward ball y position
6. CPU paddle does not exceed its max speed
7. CPU paddle does not move past walls
8. Ball moves by velocity each tick
9. Ball bounces off top wall (velocityY inverts)
10. Ball bounces off bottom wall (velocityY inverts)
11. Ball bounces off player paddle (velocityX inverts)
12. Ball bounces off CPU paddle (velocityX inverts)
13. Ball angle changes based on paddle hit location
14. Ball passing left edge increments CPU score
15. Ball passing right edge increments player score
16. Ball resets to center after score
17. Game over when player reaches maxScore
18. Game over when CPU reaches maxScore
19. Game over freezes state

**Rendering approach:**

- FrameBuffer sized to terminal
- Paddles drawn as vertical bars of `|` characters
- Ball drawn as `O`
- Dashed center line
- Score for both players displayed at top
- "YOU WIN" / "YOU LOSE" + "Press R to restart" overlay on game over

**Controls:**

- Up arrow: move paddle up
- Down arrow: move paddle down
- R: restart after game over
- ESC: back to menu (handled by parent)

---

### Agent E: Tetris

**Scope:** `src/games/tetris/`

**Files to implement:**

- `state.ts` - already scaffolded with types, `createInitialState`, piece shapes, and rotation data
- `logic.ts` - all pure game logic
- `logic.test.ts` - all tests for logic
- `render.ts` - draw TetrisState to FrameBuffer
- `index.ts` - wire keyboard input, game loop, rendering

**Game mechanics:**

- 10-wide, 20-tall board (configurable in state)
- 7 piece types: I, O, T, S, Z, L, J - shapes defined in `state.ts` `PIECE_SHAPES`
- Pieces spawn at top center, fall down one row every `ticksPerDrop` ticks
- Left/Right arrows move piece horizontally
- Up arrow rotates piece clockwise
- Down arrow soft drops (moves down faster)
- Space hard drops (instantly drops to lowest valid position and locks)
- Piece locks when it can't move down - becomes part of the board
- After locking, check for full rows and clear them
- Scoring: 1 line = 100, 2 lines = 300, 3 lines = 500, 4 lines = 800 (multiplied by level)
- Level increases every 10 lines cleared
- `ticksPerDrop` decreases with level (pieces fall faster)
- New piece spawns from `nextPiece`, a new `nextPiece` is randomly chosen
- Game over when a new piece spawns overlapping existing locked cells
- `isValidPosition` checks piece cells against board bounds and locked cells
- Use `state.ts` `getPieceCells` and `createPiece` helpers for piece management

**Test cases to write:**

1. Piece moves left when action is left
2. Piece moves right when action is right
3. Piece does not move past left wall
4. Piece does not move past right wall
5. Piece does not move into locked cells
6. Piece moves down on soft drop (action down)
7. Hard drop places piece at lowest valid row
8. Piece locks after hard drop
9. Piece rotates clockwise
10. Piece does not rotate into wall
11. Piece does not rotate into locked cells
12. O piece has only one rotation
13. Full row is cleared from board
14. Multiple rows cleared simultaneously
15. Rows above cleared lines shift down
16. Score calculated correctly: 1/2/3/4 lines
17. Score multiplied by level
18. Level increases every 10 lines
19. ticksPerDrop decreases with level
20. New piece spawns after locking with correct kind from nextPiece
21. Game over when new piece overlaps locked cells
22. Game over freezes state (no more movement)
23. Piece auto-drops after ticksPerDrop ticks with no input

**Rendering approach:**

- FrameBuffer with board centered on screen
- Board drawn with border around it
- Each piece type gets a unique color (I=cyan, O=yellow, T=purple, S=green, Z=red, L=orange, J=blue)
- Locked cells keep their piece color
- Current piece drawn at its position
- Next piece preview shown to the right of the board
- Score and level displayed above the board
- "GAME OVER - press R to restart" overlay on death

**Controls:**

- Left/Right arrows: move piece
- Up arrow: rotate
- Down arrow: soft drop
- Space: hard drop
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
