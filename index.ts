// dev-header: replaces Pi's startup banner with the dev logo beside the name, version and key
// hints, in plain `pi` and in dev. The logo needs the Kitty image protocol; other terminals get
// the text alone. The PNG is read once at load and encoded only when the width changes.
import { readFileSync } from 'node:fs'
import {
  type ExtensionAPI,
  type ExtensionContext,
  keyHint,
  keyText,
  rawKeyHint,
  type Theme,
  type ThemeColor,
  VERSION,
} from '@earendil-works/pi-coding-agent'
import {
  allocateImageId,
  type Component,
  getCapabilities,
  getPngDimensions,
  renderImage,
  truncateToWidth,
} from '@earendil-works/pi-tui'

const LOGO = readFileSync(new URL('./assets/logo.png', import.meta.url)).toString('base64')
const LOGO_SIZE = getPngDimensions(LOGO)
const LOGO_ROWS = 4
const LOGO_GAP = 2
const MIN_TEXT_COLUMNS = 20
// Rose in rose-pine-moon: beside the iris `dev` and apart from the footer's pine, foam and gold.
const PROFILE: ThemeColor = 'syntaxNumber'

// Dev records the conversation's profile as a custom entry; plain Pi has none.
const devProfile = (ctx: ExtensionContext): string | undefined => {
  const entry = ctx.sessionManager
    .getEntries()
    .findLast(entry => entry.type === 'custom' && entry.customType === 'dev/profile')
  const data = entry?.type === 'custom' ? entry.data : undefined
  return typeof data === 'object' &&
    data !== null &&
    'profile' in data &&
    typeof data.profile === 'string'
    ? data.profile
    : undefined
}

const textLines = (theme: Theme, profile: string | undefined): string[] => {
  const muted = (text: string) => theme.fg('muted', text)
  const dev = process.env.DEV_CODING_AGENT === 'true'
  const identity =
    theme.bold(theme.fg('accent', dev ? 'dev' : 'pi')) +
    (profile === undefined ? '' : theme.fg(PROFILE, ` ${profile}`)) +
    theme.fg('dim', dev ? ` · Pi ${VERSION}` : ` ${VERSION}`)
  const hints = [
    keyHint('app.interrupt', 'interrupt'),
    rawKeyHint(`${keyText('app.clear')}/${keyText('app.exit')}`, 'clear/exit'),
    rawKeyHint('/', 'commands'),
    rawKeyHint('!', 'bash'),
    rawKeyHint('/hotkeys', 'all keys'),
  ].join(muted(' · '))
  return [identity, hints]
}

const header = (theme: Theme, profile: string | undefined): Component => {
  const imageId = getCapabilities().images === 'kitty' ? allocateImageId() : undefined
  let cached: { readonly width: number; readonly lines: string[] } | undefined
  const render = (width: number): string[] => {
    const lines = textLines(theme, profile)
    const fit = (line: string, indent: number) =>
      ' '.repeat(indent) + truncateToWidth(line, width - indent)
    const image =
      imageId === undefined || LOGO_SIZE === null
        ? null
        : renderImage(LOGO, LOGO_SIZE, {
            maxHeightCells: LOGO_ROWS,
            maxWidthCells: LOGO_ROWS * 2,
            moveCursor: false,
            imageId,
          })
    const indent = image === null ? 0 : image.columns + LOGO_GAP
    if (image === null || width - indent < MIN_TEXT_COLUMNS) return lines.map(line => fit(line, 0))
    // Row 0 carries only the image; the text sits on the placeholder rows beside it.
    const top = Math.max(1, Math.floor((image.rows - lines.length) / 2))
    return Array.from({ length: Math.max(image.rows, top + lines.length) }, (_, row) => {
      if (row === 0) return image.sequence
      const line = lines[row - top]
      return line === undefined ? '' : fit(line, indent)
    })
  }
  return {
    render: width => {
      if (cached?.width !== width) cached = { width, lines: render(width) }
      return cached.lines
    },
    invalidate: () => {
      cached = undefined
    },
  }
}

export default function (pi: ExtensionAPI): void {
  pi.on('session_start', (_event, ctx) => {
    if (ctx.mode !== 'tui') return
    const profile = devProfile(ctx)
    ctx.ui.setHeader((_tui, theme) => header(theme, profile))
  })
}
