# AGENTS.md

## Project

Terminal Arcade - retro arcade games in your terminal, built with Bun + OpenTUI.

## Approach: Strict TDD

We use Test-Driven Development for all game logic:

1. Write the test first
2. See it fail
3. Write the implementation
4. See it pass
5. Refactor if needed

The only code NOT tested is rendering (`render.ts`) and glue (`index.ts`) - those are purely visual/integration.

## Commands - Run After Every Piece of Work

```bash
bun test          # Run all tests
bun tsc           # Type check
bun lint          # ESLint
bun run format    # Prettier
```

All four must pass before considering any task done.

## Code Conventions

### Every function takes a single object argument

No positional args. Every function parameter is a single destructured object so it's type-safe and self-documenting at the call site.

```ts
// WRONG
function tick(state: SnakeState, input: SnakeInput): SnakeState

// RIGHT
function tick(args: { state: SnakeState; input: SnakeInput }): SnakeState
```

### File structure per game

Each game lives in `src/games/{game-name}/` with this structure:

- `state.ts` - Types, interfaces, initial state factory
- `logic.ts` - Pure functions only. No OpenTUI imports. No side effects.
- `logic.test.ts` - Tests for logic.ts
- `render.ts` - Draws game state to FrameBuffer. No tests.
- `index.ts` - Wires input -> logic -> render. Exports `createGame()`.

### Game module contract

Every game exports this from its `index.ts`:

```ts
export function createGame(args: {
  renderer: CliRenderer
  onExit: () => void
}): { cleanup: () => void }
```

### Pure logic separation

`logic.ts` files must NEVER import from `@opentui/core`. They are pure state transformations. This is what makes them testable.

### Shared types

`src/shared/types.ts` has `Position`, `Dimensions`, `GameId`, `AppScreen`. Use these for common structures. Do not create game-specific duplicates.

### Colors

`src/shared/colors.ts` has the retro green palette. Import `COLORS` from there. Do not hardcode color values in game files.

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

### Getting Started

- https://opentui.com/docs/getting-started/
