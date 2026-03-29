import { join } from 'path'

const JUMP_SOUND_PATH = join(import.meta.dirname, 'retro-bounce-jump-sound.wav')

export function playJumpSound(): void {
  Bun.spawn(['afplay', JUMP_SOUND_PATH], {
    stdout: 'ignore',
    stderr: 'ignore',
  })
}
