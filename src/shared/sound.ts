import { join } from 'path'

const JUMP_SOUND_PATH = join(import.meta.dirname, 'retro-bounce-jump-sound.wav')
const COLLECT_SOUND_PATH = join(import.meta.dirname, 'generic-collect-sound.wav')

export function playJumpSound(): void {
  Bun.spawn(['afplay', '-v', '0.5', JUMP_SOUND_PATH], {
    stdout: 'ignore',
    stderr: 'ignore',
  })
}

export function playCollectSound(): void {
  Bun.spawn(['afplay', '-v', '0.5', COLLECT_SOUND_PATH], {
    stdout: 'ignore',
    stderr: 'ignore',
  })
}
