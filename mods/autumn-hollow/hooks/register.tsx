import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs, Timer } from 'claude-code'

import type { Limit, Look, Meter, Phase } from '../types'
import { easternTime, phaseAt } from './eastern.js'
import { makeColors } from './make-colors.js'
import { observatoryAlt, observatorySvg } from './observatory.js'
import { rainAlt, rainSvg } from './rain.js'
import { sceneAlt, sceneSvg } from './scene.js'

const NAME = 'autumn-hollow'
const PHASES: readonly Phase[] = ['dawn', 'day', 'dusk', 'night']

const meter = atom({ plugin: 'autumn-hollow', key: 'meter' } as const, null)
const phase = atom({ plugin: 'autumn-hollow', key: 'phase' } as const, 'day')
const look = atom({ plugin: 'autumn-hollow', key: 'look' } as const, 'autumn')

const PANE = 'almanac'
const LOOKS: readonly Look[] = ['autumn', 'observatory', 'rain']
const LOOK_NAME: Record<Look, string> = { autumn: 'Autumn castle', observatory: 'Observatory', rain: 'Rainy city' }

// Sunlit parchment by day, a candle-lit common room by night.
const autumn = makeColors({
  label: 'Autumn Hollow',
  roles: { accent: '#b5551d', danger: '#a8322a', success: '#55742f', warning: '#b07a12', pro: '#6b4a8f' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#eadfc8',
        'surface-1': '#f1e8d4',
        'surface-2': '#f8f1e2',
        'text-primary': '#2b2018',
        'text-secondary': '#55453a',
        'text-muted': '#6b5a4c',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#17131f',
        'surface-1': '#1f1a29',
        'surface-2': '#272133',
        'surface-3': '#2e283b',
        'text-primary': '#f1e6d2',
        'text-secondary': '#cfc2ad',
        'text-muted': '#aa9d8c',
      },
    },
  },
})

// Chart paper by day, deep blue and brass under the dome by night.
const observatory = makeColors({
  label: 'Observatory',
  roles: { accent: '#a97f2c', danger: '#b23a3a', success: '#3f7d5a', warning: '#c2691c', pro: '#5a5fb0' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#dfe4ec',
        'surface-1': '#e8ecf2',
        'surface-2': '#f2f4f8',
        'text-primary': '#161c2c',
        'text-secondary': '#3c4660',
        'text-muted': '#535d76',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b1020',
        'surface-1': '#121829',
        'surface-2': '#192033',
        'surface-3': '#1f273b',
        'text-primary': '#e9edf7',
        'text-secondary': '#c2c9db',
        'text-muted': '#9aa3ba',
      },
    },
  },
})

// Overcast slate by day, charcoal with teal and neon pink after dark.
const rain = makeColors({
  label: 'Rainy city',
  roles: { accent: '#1f8f8a', danger: '#c0394a', success: '#3d8a5c', warning: '#b9801c', pro: '#b0489a' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#dde1e4',
        'surface-1': '#e6e9ec',
        'surface-2': '#f0f2f4',
        'text-primary': '#171b20',
        'text-secondary': '#3d454e',
        'text-muted': '#545d67',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0e1116',
        'surface-1': '#151a20',
        'surface-2': '#1c222a',
        'surface-3': '#222932',
        'text-primary': '#e8edf0',
        'text-secondary': '#c1cad0',
        'text-muted': '#98a3ab',
      },
    },
  },
})

const PALETTE = { autumn, observatory, rain }

const GLASS: Record<Look, Record<Phase, { tint: string; opacity: number }>> = {
  autumn: {
    dawn: { tint: '#f1e8d4', opacity: 0.74 },
    day: { tint: '#f1e8d4', opacity: 0.74 },
    dusk: { tint: '#1f1a29', opacity: 0.72 },
    night: { tint: '#17131f', opacity: 0.7 },
  },
  observatory: {
    dawn: { tint: '#e8ecf2', opacity: 0.76 },
    day: { tint: '#e8ecf2', opacity: 0.76 },
    dusk: { tint: '#121829', opacity: 0.7 },
    night: { tint: '#0b1020', opacity: 0.66 },
  },
  rain: {
    dawn: { tint: '#e6e9ec', opacity: 0.76 },
    day: { tint: '#e6e9ec', opacity: 0.76 },
    dusk: { tint: '#151a20', opacity: 0.7 },
    night: { tint: '#0e1116', opacity: 0.68 },
  },
}

function themeFor(which: Look, now: Phase, withStyle: boolean): ThemeSetArgs {
  return {
    colors: PALETTE[which].theme,
    overrideColorScheme: now === 'dawn' || now === 'day' ? 'light' : 'dark',
    backdrop: { scene: `${which}-${now}`, glass: { blur: 14, ...GLASS[which][now] } },
    ...(withStyle ? { style: { Heading: { fontFamily: ['serif'] } } } : {}),
  }
}

const LABEL: Record<Phase, string> = { dawn: '☀ Dawn', day: '☀ Day', dusk: '☾ Dusk', night: '☾ Night' }
const KIND: Record<string, string> = { five_hour: '5-hour', seven_day: 'Weekly', spend_limit: 'Spend' }
const CELLS = 12

function bar(percent: number): { full: string; rest: string; color: string } {
  const clamped = Math.max(0, Math.min(100, percent))
  const filled = clamped > 0 ? Math.max(1, Math.round((clamped / 100) * CELLS)) : 0

  return {
    full: '█'.repeat(filled),
    rest: '░'.repeat(CELLS - filled),
    color: clamped >= 90 ? '#c8453a' : clamped >= 75 ? '#d39a2c' : '#c9742b',
  }
}

function parseScene(scene: string): { which: Look; now: Phase } {
  const [a, b] = scene.split('-')

  return {
    which: LOOKS.find(l => l === a) ?? 'autumn',
    now: PHASES.find(p => p === b) ?? 'day',
  }
}

function snapshot(u: {
  rateLimits: readonly Limit[]
  context: { percent?: number; tokens?: number; window: number }
  cost?: { usd: number }
}): Meter {
  return {
    limits: u.rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
    contextPercent: u.context.percent ?? null,
    costUsd: u.cost?.usd ?? null,
    contextTokens: u.context.tokens ?? null,
    contextWindow: u.context.window,
  }
}

function resetNote(l: Limit, nowMs: number): string | undefined {
  const at = l.resetsAt === undefined ? Number.NaN : Date.parse(l.resetsAt)

  if (Number.isNaN(at)) {
    return undefined
  }
  const hours = (at - nowMs) / 3_600_000

  if (hours > 20) {
    return `resets in ${Math.round(hours / 24)} d`
  }

  return `resets ${easternTime(at)} ET`
}

let shown: string | undefined

// Sets the theme when the look or the phase of the day has changed.
async function apply($: EngineInterface): Promise<void> {
  const now = phaseAt(await $.clock.now())
  const which = await read($, look)
  const key = `${which}-${now}`

  if (key === shown) {
    return
  }
  shown = key
  await update($, phase, () => now)

  try {
    await $.theme.set(themeFor(which, now, true))
  } catch (error) {
    $.ui.log(String(error))
    await $.theme.set(themeFor(which, now, false))
  }
}

async function choose($: EngineInterface, which: Look): Promise<void> {
  await update($, look, () => which)
  await apply($)
}

export const register: Register = on => {
  let timer: Timer | undefined
  shown = undefined

  on('session.start', async ($, e, next) => {
    for (const palette of [autumn, observatory, rain]) {
      const unpainted = palette.problems.find(line => line.startsWith("Desktop won't paint"))

      if (unpainted !== undefined) {
        $.ui.log(unpainted)
      }
    }

    await $.command.register({
      name: 'look',
      description: 'Switch the backdrop: /look autumn, /look observatory, /look rain, or /look alone for the next one',
    })
    await $.command.register({ name: 'almanac', description: 'Open the Almanac panel: time of day, look and usage' })

    await apply($)
    timer?.cancel()
    // The sky is checked every five minutes and redrawn when the phase turns.
    timer = $.clock.every(300_000, () => {
      void apply($).catch(error => $.ui.log(String(error)))
    })

    const usage = await $.session.usage()
    await update($, meter, () => snapshot(usage))
    void $.ui.open({ id: PANE, title: 'Almanac' })

    return next(e)
  })

  on('command.run', { command: 'look' }, async ($, e) => {
    const asked = e.args.trim().toLowerCase()
    const current = await read($, look)
    const which = LOOKS.find(l => l === asked) ?? (asked === '' ? LOOKS[(LOOKS.indexOf(current) + 1) % LOOKS.length] : undefined)

    if (which === undefined) {
      return { text: `No look named "${asked}". Try /look autumn, /look observatory or /look rain.` }
    }
    await choose($, which)

    return { text: `Look set to ${LOOK_NAME[which]}.` }
  })

  on('command.run', { command: 'almanac' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Almanac' })

    return { text: 'Almanac opened.' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, meter, () => snapshot(e))

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }

    if (e.props.plugin !== NAME) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const { which, now } = parseScene(e.props.scene)

    if (which === 'rain') {
      return <Svg source={rainSvg(now)} alt={rainAlt(now)} isInteractive />
    }

    return which === 'observatory' ? (
      <Svg source={observatorySvg(now)} alt={observatoryAlt(now)} isInteractive />
    ) : (
      <Svg source={sceneSvg(now)} alt={sceneAlt(now)} isInteractive />
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    const now = await read($, phase)
    const m = await read($, meter)

    const gauge = (label: string, percent: number, note?: string) => {
      const b = bar(percent)

      return (
        <Box key={label} flexDirection="row" gap={1}>
          <Text dimColor>{label}</Text>
          <Text color={b.color}>{b.full}</Text>
          <Text dimColor>{b.rest}</Text>
          <Text tabular>{Math.round(percent)}%</Text>
          {note === undefined ? null : <Text dimColor>{note}</Text>}
        </Box>
      )
    }

    const reset = (l: Limit): string | undefined => {
      const at = l.resetsAt === undefined ? Number.NaN : Date.parse(l.resetsAt)

      return Number.isNaN(at) ? undefined : `resets ${easternTime(at)} ET`
    }

    // The weekly limit stays in the Almanac panel, where there is room for it.
    const limits = (m?.limits ?? []).filter(l => l.kind !== 'seven_day')

    return (
      <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
        <Text color="#c9742b">{LABEL[now]}</Text>
        {limits.map(l => gauge(KIND[l.kind] ?? l.kind, l.percentUsed, l.kind === 'five_hour' ? reset(l) : undefined))}
        {limits.length === 0 ? <Text dimColor>Plan limits: no reading yet</Text> : null}
        {m !== null && m.contextPercent !== null ? gauge('Context', m.contextPercent) : null}
        {m !== null && limits.length === 0 && m.costUsd !== null ? (
          <Text dimColor>about ${m.costUsd.toFixed(2)} this session (estimate)</Text>
        ) : null}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const nowMs = await $.clock.now()
    const now = phaseAt(nowMs)
    const current = await read($, look)
    const m = await read($, meter)
    const limits = m?.limits ?? []

    const row = (label: string, percent: number, note?: string) => {
      const b = bar(percent)

      return (
        <Box key={label} flexDirection="column">
          <Box flexDirection="row" gap={1}>
            <Text>{label}</Text>
            <Text tabular bold>
              {Math.round(percent)}%
            </Text>
          </Box>
          <Box flexDirection="row">
            <Text color={b.color}>{b.full}</Text>
            <Text dimColor>{b.rest}</Text>
          </Box>
          {note === undefined ? null : <Text dimColor>{note}</Text>}
        </Box>
      )
    }

    const tokens =
      m !== null && typeof m.contextTokens === 'number' && typeof m.contextWindow === 'number'
        ? `${Math.round(m.contextTokens / 1000)}k of ${Math.round(m.contextWindow / 1000)}k tokens`
        : undefined

    return (
      <Box flexDirection="column" gap={1} padding={1}>
        <Box flexDirection="column">
          <Text bold>
            {LABEL[now]} · {easternTime(nowMs)} ET
          </Text>
          <Text dimColor>The sky follows Eastern time and turns at 5:30 AM, 8 AM, 5 PM and 7:30 PM.</Text>
        </Box>

        <Box flexDirection="column">
          <Text bold>Look</Text>
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {LOOKS.map(l => (
              <Button
                key={`look-${l}`}
                label={l === current ? `● ${LOOK_NAME[l]}` : LOOK_NAME[l]}
                variant={l === current ? 'primary' : 'secondary'}
                onPress={() => choose($, l)}
              />
            ))}
          </Box>
        </Box>

        <Box flexDirection="column" gap={1}>
          <Text bold>Usage</Text>
          {limits.map(l => row(`${KIND[l.kind] ?? l.kind} limit`, l.percentUsed, resetNote(l, nowMs)))}
          {limits.length === 0 ? <Text dimColor>Plan limits: no reading yet.</Text> : null}
          {m !== null && m.contextPercent !== null ? row('Context window', m.contextPercent, tokens) : null}
          {m !== null && m.costUsd !== null ? (
            <Text dimColor>About ${m.costUsd.toFixed(2)} this session, a local estimate and not a bill.</Text>
          ) : null}
        </Box>
      </Box>
    )
  })
}
