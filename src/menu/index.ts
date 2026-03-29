import {
  type Renderable,
  BoxRenderable,
  ASCIIFontRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  type CliRenderer,
} from '@opentui/core'
import { COLORS } from '../shared/colors.js'
import { GAME_OPTIONS, type GameId } from '../shared/types.js'

export function createMenu(args: {
  renderer: CliRenderer
  onSelectGame: (args: { gameId: GameId }) => void
}): { container: Renderable; cleanup: () => void } {
  const { renderer, onSelectGame } = args

  const container = new BoxRenderable(renderer, {
    id: 'menu-container',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    gap: 1,
  })

  const title = new ASCIIFontRenderable(renderer, {
    id: 'menu-title',
    text: 'ARCADE',
    font: 'block',
    color: COLORS.primary,
  })

  const subtitle = new TextRenderable(renderer, {
    id: 'menu-subtitle',
    content: 'Pick a game. ESC to quit.',
    fg: COLORS.textDim,
  })

  const select = new SelectRenderable(renderer, {
    id: 'menu-select',
    width: 40,
    height: 10,
    options: GAME_OPTIONS.map((game) => ({
      name: game.name,
      description: game.description,
    })),
    backgroundColor: COLORS.background,
    selectedBackgroundColor: '#1a3a1a',
    selectedTextColor: COLORS.primary,
    textColor: COLORS.textDim,
    descriptionColor: COLORS.textDim,
    wrapSelection: true,
  })

  select.on(SelectRenderableEvents.ITEM_SELECTED, (index: number) => {
    const game = GAME_OPTIONS[index]
    if (game) {
      onSelectGame({ gameId: game.id })
    }
  })

  container.add(title)
  container.add(subtitle)
  container.add(select)

  select.focus()

  const cleanup = () => {
    container.destroyRecursively()
  }

  return { container, cleanup }
}
