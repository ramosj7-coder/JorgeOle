import type { Phase } from '../types'

type Sky = {
  top: string
  mid: string
  low: string
  stars: number
  orb: string
  orbGlow: string
  orbX: number
  orbY: number
  orbR: number
  far: string
  hill: string
  dome: string
  domeEdge: string
  slit: string
  slitGlow: number
  cloud: string
  cloudOpacity: number
  line: string
}

const SKIES: Record<Phase, Sky> = {
  dawn: {
    top: '#3b4a78', mid: '#b98aa0', low: '#f4c9a0', stars: 0.3,
    orb: '#ffe9c4', orbGlow: '#ffc890', orbX: 300, orbY: 640, orbR: 44,
    far: '#7d7a9c', hill: '#4a4a6c', dome: '#c9ccd8', domeEdge: '#9a9db0', slit: '#2a2c44', slitGlow: 0.3,
    cloud: '#ffe6d2', cloudOpacity: 0.5, line: '#e8e0ff',
  },
  day: {
    top: '#5f9bd0', mid: '#a9cfe6', low: '#e6eef2', stars: 0,
    orb: '#fffbe6', orbGlow: '#fff0b8', orbX: 330, orbY: 150, orbR: 50,
    far: '#93a9b8', hill: '#5f7a78', dome: '#eef0f4', domeEdge: '#b7bcc8', slit: '#4a5068', slitGlow: 0,
    cloud: '#ffffff', cloudOpacity: 0.75, line: '#ffffff',
  },
  dusk: {
    top: '#141a3c', mid: '#4b3a72', low: '#c97a5e', stars: 0.6,
    orb: '#ffd2a0', orbGlow: '#ff9860', orbX: 1300, orbY: 650, orbR: 46,
    far: '#3a3260', hill: '#1f1d3a', dome: '#6c6e8c', domeEdge: '#4a4c68', slit: '#14142a', slitGlow: 0.7,
    cloud: '#e8a088', cloudOpacity: 0.3, line: '#cfd6ff',
  },
  night: {
    top: '#050818', mid: '#0c1430', low: '#182448', stars: 1,
    orb: '#eef2ff', orbGlow: '#9fb4ff', orbX: 300, orbY: 190, orbR: 34,
    far: '#111a38', hill: '#0a0f24', dome: '#3a4266', domeEdge: '#262c4a', slit: '#05060f', slitGlow: 1,
    cloud: '#6070b0', cloudOpacity: 0.12, line: '#aebcff',
  },
}

function seeded(seed: number): () => number {
  let s = seed

  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296

    return s / 4294967296
  }
}

// The whole field turns about a pole high on the left, once in ten minutes.
const POLE = { x: 520, y: 120 }

function stars(sky: Sky): string {
  if (sky.stars === 0) {
    return ''
  }
  const rnd = seeded(113)
  let out = ''

  for (let i = 0; i < 200; i++) {
    const angle = rnd() * Math.PI * 2
    const dist = 40 + Math.sqrt(rnd()) * 1250
    const x = Math.round(POLE.x + Math.cos(angle) * dist)
    const y = Math.round(POLE.y + Math.sin(angle) * dist)
    const r = (0.9 + rnd() * rnd() * 2.4).toFixed(1)
    const o = ((0.5 + rnd() * 0.5) * sky.stars).toFixed(2)
    const tint = i % 9 === 0 ? '#ffe2b0' : i % 7 === 0 ? '#bcd0ff' : '#ffffff'
    const twinkle = i % 6 === 0 ? ` class="tw" style="animation-delay:-${(rnd() * 8).toFixed(1)}s"` : ''
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${tint}" opacity="${o}"${twinkle}/>`
  }

  // Three invented constellations: joined stars, no real figure.
  const figures: number[][][] = [
    [[760, 210], [830, 170], [900, 215], [960, 180], [1010, 240]],
    [[980, 420], [1040, 380], [1110, 410], [1090, 480], [1020, 490], [980, 420]],
    [[230, 380], [290, 430], [270, 500], [350, 520]],
  ]

  for (const figure of figures) {
    const d = figure.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ')
    out += `<path d="${d}" fill="none" stroke="${sky.line}" stroke-width="1" opacity="${(0.28 * sky.stars).toFixed(2)}"/>`

    for (const p of figure) {
      out += `<circle cx="${p[0]}" cy="${p[1]}" r="2.4" fill="#ffffff" opacity="${(0.95 * sky.stars).toFixed(2)}"/>`
    }
  }

  return `<g class="turn">${out}</g>`
}

function meteors(sky: Sky): string {
  if (sky.stars < 0.5) {
    return ''
  }
  const shots = [
    { x: 1050, y: 90, wait: 23, delay: 4 },
    { x: 620, y: 60, wait: 37, delay: 19 },
  ]

  return shots
    .map(
      (s, i) =>
        `<g transform="translate(${s.x} ${s.y}) rotate(28)">` +
        `<rect class="shot" style="animation:shot${i} ${s.wait}s linear -${s.delay}s infinite" x="0" y="-1" width="120" height="2" rx="1" fill="url(#streak)" opacity="0"/>` +
        `</g>`,
    )
    .join('')
}

function clouds(sky: Sky): string {
  const puff = (x: number, y: number, s: number): string =>
    `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="120" ry="26"/><ellipse cx="-50" cy="-16" rx="60" ry="24"/><ellipse cx="40" cy="-22" rx="74" ry="30"/></g>`

  return (
    `<g fill="${sky.cloud}" opacity="${sky.cloudOpacity}">` +
    `<g class="drift">${puff(260, 300, 1)}${puff(1180, 210, 1.3)}</g>` +
    `<g class="drift" style="animation-duration:120s">${puff(760, 120, 0.8)}${puff(1480, 400, 0.9)}</g>` +
    `</g>`
  )
}

function observatory(sky: Sky): string {
  const glow = sky.slitGlow

  return (
    // the hill, low on the right
    `<path d="M700 900 C860 760 1040 700 1240 690 C1400 684 1520 720 1600 760 L1600 900 Z" fill="${sky.hill}"/>` +
    // the drum and the dome
    `<rect x="1170" y="640" width="220" height="70" fill="${sky.domeEdge}"/>` +
    `<path d="M1160 642 A120 120 0 0 1 1400 642 Z" fill="${sky.dome}"/>` +
    `<path d="M1160 642 A120 120 0 0 1 1220 540 A150 150 0 0 0 1200 642 Z" fill="${sky.domeEdge}" opacity="0.6"/>` +
    // the open slit and the telescope looking out of it
    `<path d="M1262 642 L1262 548 A120 120 0 0 1 1306 530 L1306 642 Z" fill="${sky.slit}"/>` +
    (glow > 0
      ? `<path class="fl" d="M1262 642 L1262 548 A120 120 0 0 1 1306 530 L1306 642 Z" fill="#ffb860" fill-opacity="${(0.3 * glow).toFixed(2)}"/>`
      : '') +
    `<path d="M1276 610 L1196 486 L1212 476 L1296 600 Z" fill="${sky.domeEdge}"/>` +
    `<path d="M1196 486 L1212 476 L1205 466 L1189 476 Z" fill="${sky.dome}"/>` +
    // a door, a lit window and a rail
    `<rect x="1268" y="668" width="24" height="42" rx="3" fill="${sky.slit}"/>` +
    `<rect x="1200" y="662" width="16" height="20" rx="2" fill="#ffc870" opacity="${Math.max(0.12, glow).toFixed(2)}"/>` +
    `<rect x="1344" y="662" width="16" height="20" rx="2" fill="#ffc870" opacity="${Math.max(0.12, glow).toFixed(2)}"/>` +
    `<rect x="1160" y="636" width="240" height="8" rx="2" fill="${sky.domeEdge}"/>` +
    // pines beside it
    `<g fill="${sky.hill}">` +
    '<path d="M1040 760 L1070 640 L1100 760 Z"/><path d="M1085 750 L1108 668 L1131 750 Z"/>' +
    '<path d="M1450 730 L1478 620 L1506 730 Z"/><path d="M1500 745 L1522 660 L1544 745 Z"/>' +
    '</g>'
  )
}

const ALT: Record<Phase, string> = {
  dawn: 'An observatory dome on a hill as the last stars fade at dawn',
  day: 'An observatory dome on a hill under a bright sky with slow clouds',
  dusk: 'An observatory dome at dusk, its slit open as the first stars come out',
  night: 'An observatory dome under a slowly turning field of stars',
}

export function observatoryAlt(phase: Phase): string {
  return ALT[phase]
}

export function observatorySvg(phase: Phase): string {
  const sky = SKIES[phase]

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' +
    '<style>' +
    '@keyframes turn{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}' +
    '@keyframes tw{from{opacity:1}to{opacity:.4}}' +
    '@keyframes fl{from{opacity:1}to{opacity:.7}}' +
    '@keyframes drift{from{transform:translateX(-70px)}to{transform:translateX(70px)}}' +
    '@keyframes shot0{0%{transform:translateX(0);opacity:0}1%{opacity:.8}5%{transform:translateX(420px);opacity:0}100%{transform:translateX(420px);opacity:0}}' +
    '@keyframes shot1{0%{transform:translateX(0);opacity:0}1%{opacity:.7}4%{transform:translateX(360px);opacity:0}100%{transform:translateX(360px);opacity:0}}' +
    `.turn{transform-origin:${POLE.x}px ${POLE.y}px;animation:turn 600s linear infinite}` +
    '.tw{animation:tw 6s ease-in-out infinite alternate}' +
    '.fl{animation:fl 5s ease-in-out infinite alternate}' +
    '.drift{animation:drift 90s ease-in-out infinite alternate}' +
    '</style>' +
    '<defs>' +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="0.6" stop-color="${sky.mid}"/><stop offset="1" stop-color="${sky.low}"/></linearGradient>` +
    `<radialGradient id="glow"><stop offset="0" stop-color="${sky.orbGlow}" stop-opacity="0.5"/><stop offset="1" stop-color="${sky.orbGlow}" stop-opacity="0"/></radialGradient>` +
    '<linearGradient id="streak" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity="1"/></linearGradient>' +
    '</defs>' +
    '<rect width="1600" height="900" fill="url(#sky)"/>' +
    stars(sky) +
    meteors(sky) +
    `<circle cx="${sky.orbX}" cy="${sky.orbY}" r="${sky.orbR * 4}" fill="url(#glow)"/>` +
    `<circle cx="${sky.orbX}" cy="${sky.orbY}" r="${sky.orbR}" fill="${sky.orb}"/>` +
    clouds(sky) +
    `<path d="M0 720 C220 640 420 690 640 720 C860 750 1000 690 1200 700 C1380 708 1500 670 1600 690 L1600 900 L0 900 Z" fill="${sky.far}"/>` +
    observatory(sky) +
    `<path d="M0 850 C260 800 560 840 800 870 C900 882 1000 890 1100 900 L0 900 Z" fill="${sky.hill}"/>` +
    '</svg>'
  )
}
