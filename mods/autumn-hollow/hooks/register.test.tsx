import { expect, mock, test } from 'claude-code/testing'

import { easternTime, phaseAt } from './eastern.js'
import { observatorySvg } from './observatory.js'
import { rainSvg } from './rain.js'
import { sceneSvg } from './scene.js'

test('the phase follows the Eastern clock, daylight time included', async () => {
  expect(phaseAt(Date.UTC(2026, 10, 24, 18, 0))).toBe('day') // 1:00 PM EST
  expect(phaseAt(Date.UTC(2026, 10, 24, 22, 30))).toBe('dusk') // 5:30 PM EST
  expect(phaseAt(Date.UTC(2026, 10, 25, 3, 0))).toBe('night') // 10:00 PM EST
  expect(phaseAt(Date.UTC(2026, 6, 4, 10, 0))).toBe('dawn') // 6:00 AM EDT
  expect(easternTime(Date.UTC(2026, 10, 25, 2, 5))).toBe('9:05 PM')
})

test('each scene fits the size the engine takes', async () => {
  for (const p of ['dawn', 'day', 'dusk', 'night'] as const) {
    expect(sceneSvg(p).length < 131072).toBe(true)
    expect(observatorySvg(p).length < 131072).toBe(true)
    expect(rainSvg(p).length < 131072).toBe(true)
  }
})

test('the band shows the limits and the context fill', async ($, on) => {
  on('state.get', (_, e) => ({
    value:
      e.key === 'meter'
        ? {
            value: {
              limits: [
                { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-11-25T02:00:00Z' },
                { kind: 'seven_day', percentUsed: 80 },
              ],
              contextPercent: 31,
              costUsd: null,
            },
            version: 1,
          }
        : { value: 'night', version: 1 },
  }))

  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({
      plugin: 'autumn-hollow',
      component: 'AbovePrompt',
      surface,
      props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
    })
    expect((await ui.find({ type: 'Text', text: /42%/ }))?.text).toBe('42%')
    expect((await ui.find({ type: 'Text', text: /resets/ }))?.text).toBe('resets 9:00 PM ET')
    expect((await ui.find({ type: 'Text', text: /Night/ }))?.text).toBe('☾ Night')
    expect((await ui.find({ type: 'Text', text: /Weekly/ })) === undefined).toBe(true)
    expect((await ui.find({ type: 'Text', text: /80%/ })) === undefined).toBe(true)
    await ui.unmount()
  }
})

test('/look switches the scene and the pane shows the choice', async ($, on) => {
  mock.clock(on)
  const scenes: string[] = []
  let chosen: unknown = 'autumn'
  on('state.get', (_, e) => ({
    value: { value: e.key === 'look' ? chosen : e.key === 'phase' ? 'day' : null, version: 1 },
  }))
  on('state.set', (_, e) => {
    if (e.key === 'look') {
      chosen = e.value
    }

    return { value: { isSet: true as const, version: 2 } }
  })
  on('theme.set', (_, e) => {
    const scene = e.backdrop !== undefined && 'scene' in e.backdrop ? e.backdrop.scene : undefined
    scenes.push(String(scene))

    return { value: { isDrawn: true as const, requestId: 'look' } }
  })

  const ran = await $.command.run({
    command: 'look',
    args: 'observatory',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  expect(ran.text).toBe('Look set to Observatory.')
  expect(scenes.at(-1)?.startsWith('observatory-')).toBe(true)

  const ui = await $.ui.mount({
    plugin: 'autumn-hollow',
    component: 'Pane',
    requestId: 'almanac',
    surface: 'desktop',
    props: { title: 'Almanac', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
  })
  expect((await ui.find({ key: 'look-observatory' })) !== undefined).toBe(true)
  await ui.press({ key: 'look-autumn' })
  expect(scenes.at(-1)?.startsWith('autumn-')).toBe(true)
  await ui.unmount()
})

test('/look alone steps through all three looks in turn', async ($, on) => {
  mock.clock(on)
  let chosen: unknown = 'autumn'
  on('state.get', (_, e) => ({
    value: { value: e.key === 'look' ? chosen : e.key === 'phase' ? 'day' : null, version: 1 },
  }))
  on('state.set', (_, e) => {
    if (e.key === 'look') {
      chosen = e.value
    }

    return { value: { isSet: true as const, version: 2 } }
  })
  on('theme.set', () => ({ value: { isDrawn: true as const, requestId: 'look' } }))
  const run = { command: 'look', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as const
  const seen: unknown[] = []

  for (let i = 0; i < 3; i++) {
    await $.command.run(run)
    seen.push(chosen)
  }
  expect(seen.join(' ')).toBe('observatory rain autumn')
})
