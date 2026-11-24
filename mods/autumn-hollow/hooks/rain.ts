import type { Phase } from '../types'

type Sky = {
  top: string
  low: string
  far: string
  near: string
  lit: number
  windowA: string
  windowB: string
  neonA: string
  neonB: string
  rain: string
  rainOpacity: number
  haze: string
  sill: string
}

const SKIES: Record<Phase, Sky> = {
  dawn: {
    top: '#6c7a8a', low: '#c9b8b0', far: '#8c98a4', near: '#5c6672', lit: 0.35,
    windowA: '#ffd9a0', windowB: '#bfe6e2', neonA: '#3fc7bd', neonB: '#e86aa8',
    rain: '#ffffff', rainOpacity: 0.3, haze: '#e6d8d0', sill: '#3a4048',
  },
  day: {
    top: '#8e9aa6', low: '#cfd6da', far: '#a3adb6', near: '#6f7a85', lit: 0.12,
    windowA: '#ffe6b8', windowB: '#d2ecea', neonA: '#3fc7bd', neonB: '#e86aa8',
    rain: '#ffffff', rainOpacity: 0.38, haze: '#e8edf0', sill: '#4a525c',
  },
  dusk: {
    top: '#1c2230', low: '#5a4a62', far: '#2c3444', near: '#161b26', lit: 0.8,
    windowA: '#ffc66e', windowB: '#7fd8d0', neonA: '#35d6c8', neonB: '#ff5fa8',
    rain: '#cfe8ff', rainOpacity: 0.26, haze: '#8a6a88', sill: '#0c0f16',
  },
  night: {
    top: '#07090f', low: '#131b28', far: '#141b28', near: '#0a0d14', lit: 1,
    windowA: '#ffc66e', windowB: '#6fd0c8', neonA: '#2fe0d0', neonB: '#ff4f9e',
    rain: '#bfdcff', rainOpacity: 0.22, haze: '#1f4a58', sill: '#04050a',
  },
}

function seeded(seed: number): () => number {
  let s = seed

  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296

    return s / 4294967296
  }
}

// One row of towers with a grid of windows, some of them lit.
function skyline(sky: Sky, seed: number, base: number, fill: string, tall: number, lit: number): string {
  const rnd = seeded(seed)
  let out = ''
  let x = -20

  while (x < 1620) {
    const w = Math.round(70 + rnd() * 110)
    const h = Math.round(tall * (0.45 + rnd() * 0.55))
    const top = base - h
    out += `<rect x="${x}" y="${top}" width="${w}" height="${900 - top}" fill="${fill}"/>`

    if (rnd() < 0.3) {
      out += `<rect x="${x + w / 2 - 2}" y="${top - 46}" width="4" height="46" fill="${fill}"/>`
    }

    for (let wy = top + 16; wy < base + 40; wy += 26) {
      for (let wx = x + 12; wx < x + w - 16; wx += 22) {
        if (rnd() < 0.42) {
          const color = rnd() < 0.72 ? sky.windowA : sky.windowB
          out += `<rect x="${wx}" y="${wy}" width="9" height="13" fill="${color}" opacity="${(lit * (0.45 + rnd() * 0.55)).toFixed(2)}"/>`
        }
      }
    }
    x += w + Math.round(rnd() * 14)
  }

  return out
}

function neon(sky: Sky): string {
  if (sky.lit < 0.5) {
    return ''
  }
  const sign = (x: number, y: number, w: number, h: number, color: string, i: number): string =>
    `<g class="hum" style="animation-delay:-${i * 2.3}s">` +
    `<rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" rx="12" fill="${color}" opacity="0.14"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="${color}" stroke-width="3"/>` +
    `</g>`

  return (
    sign(180, 560, 20, 86, sky.neonB, 0) +
    sign(1330, 520, 90, 26, sky.neonA, 1) +
    sign(1480, 610, 18, 70, sky.neonB, 2) +
    sign(60, 640, 70, 22, sky.neonA, 3)
  )
}

function rain(sky: Sky): { css: string; svg: string } {
  const rnd = seeded(59)
  let css = ''
  let svg = ''

  for (let i = 0; i < 46; i++) {
    const x = Math.round(rnd() * 1700 - 50)
    const y = Math.round(rnd() * 900)
    const len = Math.round(26 + rnd() * 44)
    const fall = (2.6 + rnd() * 2.2).toFixed(1)
    const delay = (rnd() * 5).toFixed(1)
    const o = (sky.rainOpacity * (0.5 + rnd() * 0.5)).toFixed(2)
    css += `@keyframes r${i}{from{transform:translate(${Math.round((y + 80) * 0.12)}px,${-y - 80}px)}to{transform:translate(${-Math.round((980 - y) * 0.12)}px,${980 - y}px)}}`
    svg +=
      `<g transform="translate(${x} ${y})"><g style="animation:r${i} ${fall}s linear -${delay}s infinite">` +
      `<line x1="0" y1="0" x2="${-Math.round(len * 0.12)}" y2="${len}" stroke="${sky.rain}" stroke-width="1.4" stroke-linecap="round" opacity="${o}"/>` +
      `</g></g>`
  }

  return { css, svg }
}

// Drops resting on the glass; a few of them creep down the pane.
function drops(sky: Sky): { css: string; svg: string } {
  const rnd = seeded(211)
  let css = ''
  let svg = ''

  for (let i = 0; i < 26; i++) {
    const side = rnd() < 0.5 ? rnd() * 480 : 1120 + rnd() * 480
    const x = Math.round(i % 5 === 0 ? 480 + rnd() * 640 : side)
    const y = Math.round(40 + rnd() * 620)
    const r = (2.5 + rnd() * 4).toFixed(1)
    const drop =
      `<ellipse cx="0" cy="0" rx="${r}" ry="${(Number(r) * 1.3).toFixed(1)}" fill="${sky.rain}" opacity="0.2"/>` +
      `<circle cx="${(-Number(r) * 0.3).toFixed(1)}" cy="${(-Number(r) * 0.4).toFixed(1)}" r="${(Number(r) * 0.3).toFixed(1)}" fill="#ffffff" opacity="0.5"/>`

    if (i % 4 === 0) {
      const run = Math.round(180 + rnd() * 220)
      const time = Math.round(28 + rnd() * 26)
      css += `@keyframes d${i}{0%{transform:translateY(0);opacity:1}70%{opacity:1}100%{transform:translateY(${run}px);opacity:0}}`
      svg +=
        `<g transform="translate(${x} ${y})"><g style="animation:d${i} ${time}s ease-in -${Math.round(rnd() * time)}s infinite">` +
        `<rect x="-0.8" y="-60" width="1.6" height="60" fill="${sky.rain}" opacity="0.12"/>${drop}</g></g>`
    } else {
      svg += `<g transform="translate(${x} ${y})">${drop}</g>`
    }
  }

  return { css, svg }
}

const ALT: Record<Phase, string> = {
  dawn: 'Rain on a window over a grey city at dawn, a few lights still on',
  day: 'Rain on a window over a city skyline on an overcast day',
  dusk: 'Rain on a window as the city lights and neon signs come on at dusk',
  night: 'Rain on a window over a city at night, windows and neon signs glowing',
}

export function rainAlt(phase: Phase): string {
  return ALT[phase]
}

export function rainSvg(phase: Phase): string {
  const sky = SKIES[phase]
  const falling = rain(sky)
  const resting = drops(sky)

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' +
    '<style>' +
    '@keyframes hum{from{opacity:1}to{opacity:.78}}' +
    '@keyframes haze{from{transform:translateX(-50px)}to{transform:translateX(50px)}}' +
    '.hum{animation:hum 5s ease-in-out infinite alternate}' +
    '.haze{animation:haze 50s ease-in-out infinite alternate}' +
    falling.css +
    resting.css +
    '</style>' +
    '<defs>' +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.low}"/></linearGradient>` +
    `<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.haze}" stop-opacity="0"/><stop offset="1" stop-color="${sky.haze}" stop-opacity="0.55"/></linearGradient>` +
    '</defs>' +
    '<rect width="1600" height="900" fill="url(#sky)"/>' +
    skyline(sky, 17, 640, sky.far, 420, sky.lit * 0.6) +
    '<g class="haze"><rect x="-100" y="380" width="1800" height="330" fill="url(#fog)"/></g>' +
    skyline(sky, 43, 760, sky.near, 380, sky.lit) +
    neon(sky) +
    '<rect y="560" width="1600" height="340" fill="url(#fog)" opacity="0.5"/>' +
    falling.svg +
    resting.svg +
    // the sill and the window frame
    `<rect y="862" width="1600" height="38" fill="${sky.sill}"/>` +
    `<rect x="796" y="0" width="8" height="862" fill="${sky.sill}" opacity="0.55"/>` +
    '</svg>'
  )
}
