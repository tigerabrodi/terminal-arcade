import { describe, test, expect } from 'bun:test'
import type { Dimensions } from '../../shared/types.js'
import { createInitialState, type DinoState, type Obstacle } from './state.js'
import {
  PLAYER_X,
  applyJump,
  calculateSpeed,
  checkCollision,
  getPlayerBounds,
  spawnObstacle,
  tick,
} from './logic.js'

const TEST_GAME_AREA: Dimensions = {
  width: 40,
  height: 20,
}

function createTestState(
  args: {
    player?: Partial<DinoState['player']>
    obstacles?: Array<Obstacle>
    score?: number
    isGameOver?: boolean
    scrollSpeed?: number
    tickCount?: number
    spawnCooldown?: number
    spawnSequenceIndex?: number
  } = {}
): DinoState {
  const state = createInitialState({ gameArea: TEST_GAME_AREA })

  return {
    ...state,
    player: {
      ...state.player,
      ...args.player,
    },
    obstacles: args.obstacles ?? state.obstacles,
    score: args.score ?? state.score,
    isGameOver: args.isGameOver ?? state.isGameOver,
    scrollSpeed: args.scrollSpeed ?? state.scrollSpeed,
    tickCount: args.tickCount ?? state.tickCount,
    spawnCooldown: args.spawnCooldown ?? state.spawnCooldown,
    spawnSequenceIndex: args.spawnSequenceIndex ?? state.spawnSequenceIndex,
  }
}

function createObstacle(args: {
  kind: DinoState['obstacles'][number]['kind']
  x: number
}): Obstacle {
  let spawnSequenceIndex = 2

  if (args.kind === 'cactus-small') {
    spawnSequenceIndex = 0
  } else if (args.kind === 'cactus-large') {
    spawnSequenceIndex = 1
  }

  const prototypeObstacle = spawnObstacle({
    gameArea: TEST_GAME_AREA,
    groundY: createInitialState({ gameArea: TEST_GAME_AREA }).groundY,
    spawnSequenceIndex,
  })

  return {
    ...prototypeObstacle,
    x: args.x,
  }
}

describe('dino logic', () => {
  test('player stays on ground when not jumping', () => {
    const state = createTestState({
      spawnCooldown: 5,
    })

    const nextState = tick({
      state,
      input: {
        jump: false,
        duck: false,
      },
    })

    expect(nextState.player.y).toBe(state.groundY)
    expect(nextState.player.velocityY).toBe(0)
    expect(nextState.player.isJumping).toBe(false)
  })

  test('jump sets upward velocity and marks the player as jumping', () => {
    const state = createTestState({
      spawnCooldown: 5,
    })

    const jumpedPlayer = applyJump({
      player: state.player,
      jumpStrength: state.jumpStrength,
    })

    const nextState = tick({
      state,
      input: {
        jump: true,
        duck: false,
      },
    })

    expect(jumpedPlayer.velocityY).toBe(state.jumpStrength)
    expect(jumpedPlayer.isJumping).toBe(true)
    expect(nextState.player.y).toBeLessThan(state.groundY)
    expect(nextState.player.velocityY).toBeLessThan(0)
  })

  test('gravity applies each tick and pulls the player back toward the ground', () => {
    const state = createTestState({
      player: {
        y: 10,
        velocityY: -1.2,
        isJumping: true,
      },
      spawnCooldown: 5,
    })

    const nextState = tick({
      state,
      input: {
        jump: false,
        duck: false,
      },
    })

    expect(nextState.player.y).toBeGreaterThan(state.player.y - 1.2)

    let fallingState = nextState

    for (let index = 0; index < 20; index += 1) {
      fallingState = tick({
        state: {
          ...fallingState,
          spawnCooldown: 5,
          obstacles: [],
        },
        input: {
          jump: false,
          duck: false,
        },
      })
    }

    expect(fallingState.player.y).toBe(state.groundY)
  })

  test('player cannot jump while already jumping', () => {
    const state = createTestState({
      player: {
        y: 10,
        velocityY: -0.5,
        isJumping: true,
      },
      spawnCooldown: 5,
    })

    const nextState = tick({
      state,
      input: {
        jump: true,
        duck: false,
      },
    })

    expect(nextState.player.velocityY).not.toBe(state.jumpStrength)
  })

  test('landing resets jumping state and vertical velocity', () => {
    const state = createTestState({
      player: {
        y: 18.8,
        velocityY: 2,
        isJumping: true,
      },
      spawnCooldown: 5,
    })

    const nextState = tick({
      state,
      input: {
        jump: false,
        duck: false,
      },
    })

    expect(nextState.player.y).toBe(state.groundY)
    expect(nextState.player.velocityY).toBe(0)
    expect(nextState.player.isJumping).toBe(false)
  })

  test('ducking only works on the ground and changes the hitbox height', () => {
    const groundedState = createTestState({
      spawnCooldown: 5,
    })

    const groundedNextState = tick({
      state: groundedState,
      input: {
        jump: false,
        duck: true,
      },
    })

    expect(groundedNextState.player.isDucking).toBe(true)
    expect(
      getPlayerBounds({
        player: groundedNextState.player,
        groundY: groundedState.groundY,
      }).height
    ).toBe(2)

    const airborneState = createTestState({
      player: {
        y: 10,
        velocityY: -0.5,
        isJumping: true,
      },
      spawnCooldown: 5,
    })

    const airborneNextState = tick({
      state: airborneState,
      input: {
        jump: false,
        duck: true,
      },
    })

    expect(airborneNextState.player.isDucking).toBe(false)
  })

  test('obstacles move left by scroll speed each tick', () => {
    const obstacle = createObstacle({
      kind: 'cactus-large',
      x: 20,
    })
    const state = createTestState({
      obstacles: [obstacle],
      scrollSpeed: 2,
      spawnCooldown: 5,
    })

    const nextState = tick({
      state,
      input: {
        jump: false,
        duck: false,
      },
    })

    expect(nextState.obstacles[0]?.x).toBe(18)
  })

  test('collision is detected when the player overlaps a cactus', () => {
    const state = createTestState({
      obstacles: [
        createObstacle({
          kind: 'cactus-small',
          x: PLAYER_X,
        }),
      ],
      spawnCooldown: 5,
    })

    expect(
      checkCollision({
        player: state.player,
        obstacles: state.obstacles,
        groundY: state.groundY,
      })
    ).toBe(true)
  })

  test('no collision happens when the player jumps over a cactus', () => {
    const state = createTestState({
      player: {
        y: 12,
        velocityY: -0.2,
        isJumping: true,
      },
      obstacles: [
        createObstacle({
          kind: 'cactus-small',
          x: PLAYER_X,
        }),
      ],
      spawnCooldown: 5,
    })

    expect(
      checkCollision({
        player: state.player,
        obstacles: state.obstacles,
        groundY: state.groundY,
      })
    ).toBe(false)
  })

  test('no collision happens when the player ducks under a bird', () => {
    const state = createTestState({
      player: {
        isDucking: true,
      },
      obstacles: [
        createObstacle({
          kind: 'bird',
          x: PLAYER_X,
        }),
      ],
      spawnCooldown: 5,
    })

    expect(
      checkCollision({
        player: state.player,
        obstacles: state.obstacles,
        groundY: state.groundY,
      })
    ).toBe(false)
  })

  test('collision happens when the player stands into a bird', () => {
    const state = createTestState({
      obstacles: [
        createObstacle({
          kind: 'bird',
          x: PLAYER_X,
        }),
      ],
      spawnCooldown: 5,
    })

    expect(
      checkCollision({
        player: state.player,
        obstacles: state.obstacles,
        groundY: state.groundY,
      })
    ).toBe(true)
  })

  test('speed increases every 100 score points', () => {
    expect(
      calculateSpeed({
        score: 0,
        baseSpeed: 1,
      })
    ).toBe(1)
    expect(
      calculateSpeed({
        score: 100,
        baseSpeed: 1,
      })
    ).toBe(2)
    expect(
      calculateSpeed({
        score: 250,
        baseSpeed: 1,
      })
    ).toBe(3)
  })

  test('obstacles are removed after they fully leave the screen', () => {
    const state = createTestState({
      obstacles: [
        createObstacle({
          kind: 'cactus-large',
          x: -2,
        }),
      ],
      spawnCooldown: 5,
    })

    const nextState = tick({
      state,
      input: {
        jump: false,
        duck: false,
      },
    })

    expect(nextState.obstacles).toHaveLength(0)
  })

  test('spawn cooldown prevents back to back obstacles', () => {
    const state = createTestState({
      obstacles: [],
      spawnCooldown: 0,
    })

    const firstTickState = tick({
      state,
      input: {
        jump: false,
        duck: false,
      },
    })

    const secondTickState = tick({
      state: firstTickState,
      input: {
        jump: false,
        duck: false,
      },
    })

    expect(firstTickState.obstacles).toHaveLength(1)
    expect(secondTickState.obstacles).toHaveLength(1)
    expect(secondTickState.spawnCooldown).toBeGreaterThan(0)
  })

  test('game over is set on collision and later ticks freeze the state', () => {
    const state = createTestState({
      obstacles: [
        createObstacle({
          kind: 'cactus-small',
          x: PLAYER_X,
        }),
      ],
      spawnCooldown: 5,
    })

    const gameOverState = tick({
      state,
      input: {
        jump: false,
        duck: false,
      },
    })

    expect(gameOverState.isGameOver).toBe(true)
    expect(gameOverState.score).toBe(0)

    const frozenState = tick({
      state: gameOverState,
      input: {
        jump: true,
        duck: true,
      },
    })

    expect(frozenState).toBe(gameOverState)
  })

  test('spawn sequence rotates through cactus small, cactus large, bird, then repeats', () => {
    const groundY = createInitialState({ gameArea: TEST_GAME_AREA }).groundY

    expect(
      spawnObstacle({
        gameArea: TEST_GAME_AREA,
        groundY,
        spawnSequenceIndex: 0,
      }).kind
    ).toBe('cactus-small')
    expect(
      spawnObstacle({
        gameArea: TEST_GAME_AREA,
        groundY,
        spawnSequenceIndex: 1,
      }).kind
    ).toBe('cactus-large')
    expect(
      spawnObstacle({
        gameArea: TEST_GAME_AREA,
        groundY,
        spawnSequenceIndex: 2,
      }).kind
    ).toBe('bird')
    expect(
      spawnObstacle({
        gameArea: TEST_GAME_AREA,
        groundY,
        spawnSequenceIndex: 3,
      }).kind
    ).toBe('cactus-small')
  })
})
