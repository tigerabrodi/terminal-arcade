import type { DinoInput, DinoState, Obstacle, Player } from './state.js'

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export const PLAYER_X = 4
export const PLAYER_WIDTH = 2
export const PLAYER_STANDING_HEIGHT = 3
export const PLAYER_DUCKING_HEIGHT = 2
export const BASE_SCROLL_SPEED = 1
export const SPAWN_COOLDOWN_TICKS = 18
export const BIRD_TOP_OFFSET = 3

const OBSTACLE_SEQUENCE: Array<Obstacle['kind']> = [
  'cactus-small',
  'cactus-large',
  'bird',
]

export function tick(args: { state: DinoState; input: DinoInput }): DinoState {
  const { state, input } = args

  if (state.isGameOver) {
    return state
  }

  const playerAfterDuck = applyDuck({
    player: state.player,
    isDucking: input.duck,
    groundY: state.groundY,
  })
  const isGrounded =
    playerAfterDuck.y === state.groundY && playerAfterDuck.velocityY === 0
  const playerAfterJump =
    input.jump && isGrounded
      ? applyJump({
          player: playerAfterDuck,
          jumpStrength: state.jumpStrength,
        })
      : playerAfterDuck
  const player = applyGravity({
    player: playerAfterJump,
    gravity: state.gravity,
    groundY: state.groundY,
  })
  const hasCollision = checkCollision({
    player,
    obstacles: state.obstacles,
    groundY: state.groundY,
  })

  if (hasCollision) {
    return {
      ...state,
      player,
      isGameOver: true,
      tickCount: state.tickCount + 1,
    }
  }

  const movedObstacles = moveObstacles({
    obstacles: state.obstacles,
    speed: state.scrollSpeed,
  })
  const visibleObstacles = movedObstacles.filter((obstacle) =>
    isObstacleVisible({ obstacle })
  )
  const nextSpawnCooldown = Math.max(0, state.spawnCooldown - 1)
  const shouldSpawnObstacle = nextSpawnCooldown === 0
  const nextObstacle = shouldSpawnObstacle
    ? spawnObstacle({
        gameArea: state.gameArea,
        groundY: state.groundY,
        spawnSequenceIndex: state.spawnSequenceIndex,
      })
    : null
  const obstacles = nextObstacle
    ? [...visibleObstacles, nextObstacle]
    : visibleObstacles
  const score = state.score + 1

  return {
    ...state,
    player,
    obstacles,
    score,
    scrollSpeed: calculateSpeed({
      score,
      baseSpeed: BASE_SCROLL_SPEED,
    }),
    tickCount: state.tickCount + 1,
    spawnCooldown: shouldSpawnObstacle
      ? SPAWN_COOLDOWN_TICKS
      : nextSpawnCooldown,
    spawnSequenceIndex: shouldSpawnObstacle
      ? state.spawnSequenceIndex + 1
      : state.spawnSequenceIndex,
  }
}

export function applyJump(args: {
  player: Player
  jumpStrength: number
}): Player {
  const { player, jumpStrength } = args

  return {
    ...player,
    velocityY: jumpStrength,
    isJumping: true,
    isDucking: false,
  }
}

export function applyGravity(args: {
  player: Player
  gravity: number
  groundY: number
}): Player {
  const { player, gravity, groundY } = args
  const isAlreadyGrounded = player.y >= groundY && player.velocityY >= 0

  if (isAlreadyGrounded) {
    return {
      ...player,
      y: groundY,
      velocityY: 0,
      isJumping: false,
    }
  }

  const velocityY = player.velocityY + gravity
  const y = player.y + velocityY
  const hasLanded = y >= groundY

  if (hasLanded) {
    return {
      ...player,
      y: groundY,
      velocityY: 0,
      isJumping: false,
    }
  }

  return {
    ...player,
    y,
    velocityY,
    isJumping: true,
  }
}

export function applyDuck(args: {
  player: Player
  isDucking: boolean
  groundY: number
}): Player {
  const { player, isDucking, groundY } = args
  const isGrounded = player.y === groundY && player.velocityY === 0

  if (!isGrounded) {
    return {
      ...player,
      isDucking: false,
    }
  }

  return {
    ...player,
    isDucking,
  }
}

export function moveObstacles(args: {
  obstacles: Array<Obstacle>
  speed: number
}): Array<Obstacle> {
  const { obstacles, speed } = args

  return obstacles.map((obstacle) => ({
    ...obstacle,
    x: obstacle.x - speed,
  }))
}

export function spawnObstacle(args: {
  gameArea: DinoState['gameArea']
  groundY: number
  spawnSequenceIndex: number
}): Obstacle {
  const { gameArea, groundY, spawnSequenceIndex } = args
  const kind =
    OBSTACLE_SEQUENCE[spawnSequenceIndex % OBSTACLE_SEQUENCE.length] ??
    'cactus-small'
  const spawnX = gameArea.width + Math.max(0, groundY - groundY)

  switch (kind) {
    case 'cactus-small':
      return {
        x: spawnX,
        kind,
        width: 1,
        height: 2,
      }
    case 'cactus-large':
      return {
        x: spawnX,
        kind,
        width: 2,
        height: 3,
      }
    case 'bird':
      return {
        x: spawnX,
        kind,
        width: 2,
        height: 2,
      }
  }
}

export function checkCollision(args: {
  player: Player
  obstacles: Array<Obstacle>
  groundY: number
}): boolean {
  const { player, obstacles, groundY } = args
  const playerBounds = getPlayerBounds({
    player,
    groundY,
  })

  return obstacles.some((obstacle) =>
    hasBoundsOverlap({
      firstBounds: playerBounds,
      secondBounds: getObstacleBounds({
        obstacle,
        groundY,
      }),
    })
  )
}

export function calculateSpeed(args: {
  score: number
  baseSpeed: number
}): number {
  const { score, baseSpeed } = args

  return baseSpeed + Math.floor(score / 100)
}

export function getPlayerBounds(args: {
  player: Player
  groundY: number
}): Bounds {
  const { player, groundY } = args
  const height = player.isDucking
    ? PLAYER_DUCKING_HEIGHT
    : PLAYER_STANDING_HEIGHT
  const y = Math.min(player.y, groundY) - height + 1

  return {
    x: PLAYER_X,
    y,
    width: PLAYER_WIDTH,
    height,
  }
}

export function getObstacleBounds(args: {
  obstacle: Obstacle
  groundY: number
}): Bounds {
  const { obstacle, groundY } = args
  const y =
    obstacle.kind === 'bird'
      ? groundY - BIRD_TOP_OFFSET
      : groundY - obstacle.height + 1

  return {
    x: obstacle.x,
    y,
    width: obstacle.width,
    height: obstacle.height,
  }
}

function isObstacleVisible(args: { obstacle: Obstacle }): boolean {
  const { obstacle } = args

  return obstacle.x + obstacle.width > 0
}

function hasBoundsOverlap(args: {
  firstBounds: Bounds
  secondBounds: Bounds
}): boolean {
  const { firstBounds, secondBounds } = args
  const hasHorizontalOverlap =
    firstBounds.x < secondBounds.x + secondBounds.width &&
    firstBounds.x + firstBounds.width > secondBounds.x
  const hasVerticalOverlap =
    firstBounds.y < secondBounds.y + secondBounds.height &&
    firstBounds.y + firstBounds.height > secondBounds.y

  return hasHorizontalOverlap && hasVerticalOverlap
}
