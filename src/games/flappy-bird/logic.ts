import type { Bird, FlappyBirdInput, FlappyBirdState, Pipe } from './state.js'

export function applyGravity(args: { bird: Bird; gravity: number }): Bird {
  const { bird, gravity } = args
  const velocity = bird.velocity + gravity

  return {
    ...bird,
    velocity,
    y: bird.y + velocity,
  }
}

export function flap(args: { bird: Bird; flapStrength: number }): Bird {
  const { bird, flapStrength } = args

  return {
    ...bird,
    velocity: flapStrength,
  }
}

export function movePipes(args: {
  pipes: Array<Pipe>
  speed: number
}): Array<Pipe> {
  const { pipes, speed } = args

  return pipes.map((pipe) => ({
    ...pipe,
    x: pipe.x - speed,
  }))
}

export function spawnPipe(args: {
  gameArea: FlappyBirdState['gameArea']
  gapMargin: number
  gapSize: number
  randomValue: number
}): Pipe {
  const { gameArea, gapMargin, gapSize, randomValue } = args
  const minGapTop = gapMargin
  const maxGapTop = gameArea.height - gapMargin - gapSize
  const gapTop =
    minGapTop + Math.floor(randomValue * (maxGapTop - minGapTop + 1))

  return {
    x: gameArea.width,
    gapTop,
    gapBottom: gapTop + gapSize,
    hasPassed: false,
  }
}

export function updateScore(args: {
  birdX: number
  pipeWidth: number
  pipes: Array<Pipe>
}): {
  pipes: Array<Pipe>
  scoreGained: number
} {
  const { birdX, pipeWidth, pipes } = args
  let scoreGained = 0

  return {
    pipes: pipes.map((pipe) => {
      const hasJustPassed = !pipe.hasPassed && pipe.x + pipeWidth <= birdX

      if (!hasJustPassed) {
        return pipe
      }

      scoreGained += 1

      return {
        ...pipe,
        hasPassed: true,
      }
    }),
    scoreGained,
  }
}

export function checkCollision(args: {
  bird: Bird
  birdX: number
  birdWidth: number
  birdHeight: number
  pipes: Array<Pipe>
  pipeWidth: number
  gameArea: FlappyBirdState['gameArea']
}): boolean {
  const { bird, birdX, birdWidth, birdHeight, pipes, pipeWidth, gameArea } =
    args

  if (bird.y < 0 || bird.y + birdHeight > gameArea.height) {
    return true
  }

  return pipes.some((pipe) => {
    const isOverlappingOnX =
      birdX < pipe.x + pipeWidth && birdX + birdWidth > pipe.x
    const isInsideGap =
      pipe.gapTop <= bird.y && bird.y + birdHeight <= pipe.gapBottom

    return isOverlappingOnX && !isInsideGap
  })
}

export function tick(args: {
  state: FlappyBirdState
  input: FlappyBirdInput
  randomValue?: number
}): FlappyBirdState {
  const { state, input, randomValue } = args

  if (state.isGameOver) {
    return state
  }

  const bird = applyGravity({
    bird: input.flap
      ? flap({
          bird: state.bird,
          flapStrength: state.flapStrength,
        })
      : state.bird,
    gravity: state.gravity,
  })
  const tickCount = state.tickCount + 1
  const movedPipes = movePipes({
    pipes: state.pipes,
    speed: state.pipeSpeed,
  })
  const shouldSpawnPipe =
    tickCount > 0 && tickCount % state.pipeSpawnInterval === 0
  const spawnedPipes = shouldSpawnPipe
    ? [
        ...movedPipes,
        spawnPipe({
          gameArea: state.gameArea,
          gapMargin: state.gapMargin,
          gapSize: state.gapSize,
          randomValue: randomValue ?? Math.random(),
        }),
      ]
    : movedPipes
  const scoreResult = updateScore({
    birdX: state.birdX,
    pipeWidth: state.pipeWidth,
    pipes: spawnedPipes,
  })
  const pipes = scoreResult.pipes.filter((pipe) => pipe.x + state.pipeWidth > 0)
  const isGameOver = checkCollision({
    bird,
    birdX: state.birdX,
    birdWidth: state.birdWidth,
    birdHeight: state.birdHeight,
    pipes,
    pipeWidth: state.pipeWidth,
    gameArea: state.gameArea,
  })

  return {
    ...state,
    bird,
    pipes,
    score: state.score + scoreResult.scoreGained,
    isGameOver,
    tickCount,
  }
}
