import type { Ball, Paddle, PongInput, PongState } from './state.js'

const PLAYER_PADDLE_X = 1
const MAX_BOUNCE_ANGLE = 1.5

function clamp(args: { value: number; min: number; max: number }): number {
  const { value, min, max } = args

  return Math.min(Math.max(value, min), max)
}

function clampPaddlePosition(args: {
  y: number
  paddleHeight: number
  gameArea: PongState['gameArea']
}): number {
  const { y, paddleHeight, gameArea } = args

  return clamp({
    value: y,
    min: 0,
    max: gameArea.height - paddleHeight,
  })
}

function isBallWithinPaddle(args: { ballY: number; paddle: Paddle }): boolean {
  const { ballY, paddle } = args

  return ballY >= paddle.y && ballY <= paddle.y + paddle.height - 1
}

function createBounceVelocityY(args: {
  ballY: number
  paddle: Paddle
}): number {
  const { ballY, paddle } = args
  const paddleCenter = paddle.y + (paddle.height - 1) / 2
  const normalizedOffset =
    (ballY - paddleCenter) / Math.max(1, paddle.height / 2)

  return clamp({
    value: normalizedOffset * MAX_BOUNCE_ANGLE,
    min: -MAX_BOUNCE_ANGLE,
    max: MAX_BOUNCE_ANGLE,
  })
}

export function movePlayer(args: {
  paddle: Paddle
  direction: PongInput['direction']
  speed: number
  gameArea: PongState['gameArea']
}): Paddle {
  const { paddle, direction, speed, gameArea } = args

  if (direction === null) {
    return paddle
  }

  const delta = direction === 'up' ? -speed : speed

  return {
    ...paddle,
    y: clampPaddlePosition({
      y: paddle.y + delta,
      paddleHeight: paddle.height,
      gameArea,
    }),
  }
}

export function moveCpu(args: {
  paddle: Paddle
  ball: Ball
  speed: number
  gameArea: PongState['gameArea']
}): Paddle {
  const { paddle, ball, speed, gameArea } = args
  const targetY = ball.y - paddle.height / 2
  const delta = clamp({
    value: targetY - paddle.y,
    min: -speed,
    max: speed,
  })

  return {
    ...paddle,
    y: clampPaddlePosition({
      y: paddle.y + delta,
      paddleHeight: paddle.height,
      gameArea,
    }),
  }
}

export function moveBall(args: { ball: Ball; speed: number }): Ball {
  const { ball, speed } = args

  return {
    ...ball,
    x: ball.x + ball.velocityX * speed,
    y: ball.y + ball.velocityY * speed,
  }
}

export function checkWallBounce(args: {
  ball: Ball
  gameArea: PongState['gameArea']
}): Ball {
  const { ball, gameArea } = args
  const bottomWallY = gameArea.height - 1

  if (ball.y < 0) {
    return {
      ...ball,
      y: 0,
      velocityY: Math.abs(ball.velocityY),
    }
  }

  if (ball.y > bottomWallY) {
    return {
      ...ball,
      y: bottomWallY,
      velocityY: -Math.abs(ball.velocityY),
    }
  }

  return ball
}

export function checkPaddleCollision(args: {
  ball: Ball
  player: Paddle
  cpu: Paddle
  gameArea: PongState['gameArea']
}): Ball {
  const { ball, player, cpu, gameArea } = args
  const cpuPaddleX = gameArea.width - 2

  if (
    ball.velocityX < 0 &&
    ball.x <= PLAYER_PADDLE_X + 1 &&
    ball.x >= 0 &&
    isBallWithinPaddle({
      ballY: ball.y,
      paddle: player,
    })
  ) {
    return {
      ...ball,
      x: PLAYER_PADDLE_X + 1,
      velocityX: Math.abs(ball.velocityX),
      velocityY: createBounceVelocityY({
        ballY: ball.y,
        paddle: player,
      }),
    }
  }

  if (
    ball.velocityX > 0 &&
    ball.x >= cpuPaddleX - 1 &&
    ball.x <= gameArea.width - 1 &&
    isBallWithinPaddle({
      ballY: ball.y,
      paddle: cpu,
    })
  ) {
    return {
      ...ball,
      x: cpuPaddleX - 1,
      velocityX: -Math.abs(ball.velocityX),
      velocityY: createBounceVelocityY({
        ballY: ball.y,
        paddle: cpu,
      }),
    }
  }

  return ball
}

export function checkScore(args: {
  ball: Ball
  gameArea: PongState['gameArea']
}): { playerScored: boolean; cpuScored: boolean } {
  const { ball, gameArea } = args

  return {
    playerScored: ball.x >= gameArea.width,
    cpuScored: ball.x < 0,
  }
}

export function resetBall(args: {
  gameArea: PongState['gameArea']
  direction: 'left' | 'right'
}): Ball {
  const { gameArea, direction } = args

  return {
    x: Math.floor(gameArea.width / 2),
    y: Math.floor(gameArea.height / 2),
    velocityX: direction === 'left' ? -1 : 1,
    velocityY: 0,
  }
}

export function tick(args: { state: PongState; input: PongInput }): PongState {
  const { state, input } = args

  if (state.isGameOver) {
    return state
  }

  const player = movePlayer({
    paddle: state.player,
    direction: input.direction,
    speed: state.paddleSpeed,
    gameArea: state.gameArea,
  })
  const cpu = moveCpu({
    paddle: state.cpu,
    ball: state.ball,
    speed: state.paddleSpeed,
    gameArea: state.gameArea,
  })
  const movedBall = moveBall({
    ball: state.ball,
    speed: state.ballSpeed,
  })
  const wallBouncedBall = checkWallBounce({
    ball: movedBall,
    gameArea: state.gameArea,
  })
  const score = checkScore({
    ball: wallBouncedBall,
    gameArea: state.gameArea,
  })

  if (score.playerScored || score.cpuScored) {
    const playerScore = state.playerScore + (score.playerScored ? 1 : 0)
    const cpuScore = state.cpuScore + (score.cpuScored ? 1 : 0)
    let winner: PongState['winner'] = null

    if (playerScore >= state.maxScore) {
      winner = 'player'
    } else if (cpuScore >= state.maxScore) {
      winner = 'cpu'
    }

    return {
      ...state,
      player,
      cpu,
      ball: resetBall({
        gameArea: state.gameArea,
        direction: score.playerScored ? 'left' : 'right',
      }),
      playerScore,
      cpuScore,
      winner,
      isGameOver: winner !== null,
    }
  }

  return {
    ...state,
    player,
    cpu,
    ball: checkPaddleCollision({
      ball: wallBouncedBall,
      player,
      cpu,
      gameArea: state.gameArea,
    }),
  }
}
