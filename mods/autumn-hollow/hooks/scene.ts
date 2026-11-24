import type { Phase } from '../types'

type Sky = {
  top: string
  mid: string
  low: string
  orb: string
  orbGlow: string
  orbX: number
  orbY: number
  orbR: number
  stars: number
  far: string
  near: string
  castle: string
  window: string
  windowGlow: number
  ground: string
  trunk: string
  canopy: [string, string, string]
  leaves: [string, string, string, string]
  mist: string
}

const SKIES: Record<Phase, Sky> = {
  dawn: {
    top: '#8fa6c9', mid: '#f0c6a8', low: '#fbe3b8',
    orb: '#fff1c9', orbGlow: '#ffd9a0', orbX: 1180, orbY: 560, orbR: 46, stars: 0.15,
    far: '#b9a7b8', near: '#8d7a86', castle: '#5d5266', window: '#ffd98a', windowGlow: 0.55,
    ground: '#6f5a4a', trunk: '#4a3a30', canopy: ['#c96a2b', '#dd9334', '#a8452a'],
    leaves: ['#c96a2b', '#dd9334', '#a8452a', '#e3b34a'], mist: '#fff3dc',
  },
  day: {
    top: '#7fb0d6', mid: '#c4dbe6', low: '#f3e6c4',
    orb: '#fff6d8', orbGlow: '#ffe9a8', orbX: 1250, orbY: 150, orbR: 52, stars: 0,
    far: '#a9b9a6', near: '#8a8f6a', castle: '#6c6a78', window: '#f5d58a', windowGlow: 0.15,
    ground: '#7a6a45', trunk: '#54402f', canopy: ['#d2722a', '#e6a23a', '#b24c2a'],
    leaves: ['#d2722a', '#e6a23a', '#b24c2a', '#e8c04e'], mist: '#ffffff',
  },
  dusk: {
    top: '#2c2547', mid: '#8a4a63', low: '#e89a56',
    orb: '#ffd9a0', orbGlow: '#ff9d57', orbX: 330, orbY: 600, orbR: 50, stars: 0.5,
    far: '#5a3d5c', near: '#3c2a45', castle: '#231a30', window: '#ffc864', windowGlow: 0.9,
    ground: '#2a1f2a', trunk: '#1c1420', canopy: ['#a8501f', '#c97a28', '#7d3220'],
    leaves: ['#d06a26', '#e09a3a', '#a8452a', '#e8b850'], mist: '#f0a070',
  },
  night: {
    top: '#0b0a1c', mid: '#1a1836', low: '#2c2a4e',
    orb: '#f4efe0', orbGlow: '#b9c4ff', orbX: 1220, orbY: 170, orbR: 44, stars: 1,
    far: '#22203f', near: '#191730', castle: '#0e0c1c', window: '#ffc864', windowGlow: 1,
    ground: '#12101f', trunk: '#0c0a14', canopy: ['#7a3a1c', '#96581f', '#5a2618'],
    leaves: ['#b85e24', '#cf8a34', '#8c3c24', '#d6a848'], mist: '#8088c8',
  },
}

// A small deterministic generator, so each load draws the same scene.
function seeded(seed: number): () => number {
  let s = seed

  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296

    return s / 4294967296
  }
}

const LEAF = 'M0 -11 C7 -8 9 1 0 12 C-9 1 -7 -8 0 -11 Z'

function stars(sky: Sky): string {
  if (sky.stars === 0) {
    return ''
  }
  const rnd = seeded(7)
  let out = ''

  for (let i = 0; i < 70; i++) {
    const x = Math.round(rnd() * 1600)
    const y = Math.round(rnd() * 520)
    const r = (0.7 + rnd() * 1.3).toFixed(1)
    const o = ((0.35 + rnd() * 0.6) * sky.stars).toFixed(2)
    const twinkle = i % 5 === 0 ? ` class="tw" style="animation-delay:-${(rnd() * 9).toFixed(1)}s"` : ''
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff8e6" opacity="${o}"${twinkle}/>`
  }

  return out
}

function leaves(sky: Sky): { css: string; svg: string } {
  const rnd = seeded(31)
  let css = ''
  let svg = ''

  for (let i = 0; i < 16; i++) {
    // Resting place: scattered, thicker toward the sides than the middle.
    const side = rnd() < 0.5 ? rnd() * 520 : 1080 + rnd() * 520
    const x = Math.round(i % 4 === 0 ? 520 + rnd() * 560 : side)
    const y = Math.round(80 + rnd() * 700)
    const scale = (0.8 + rnd() * 0.9).toFixed(2)
    const turn = Math.round(rnd() * 360)
    const fall = Math.round(26 + rnd() * 22)
    const sway = (5 + rnd() * 4).toFixed(1)
    const delay = (rnd() * fall).toFixed(1)
    const drift = Math.round(60 + rnd() * 120) * (rnd() < 0.5 ? -1 : 1)
    const color = sky.leaves[i % 4]
    css += `@keyframes f${i}{from{transform:translate(${-drift}px,${-y - 60}px)}to{transform:translate(${drift}px,${960 - y}px)}}`
    svg +=
      `<g transform="translate(${x} ${y})">` +
      `<g style="animation:f${i} ${fall}s linear -${delay}s infinite">` +
      `<g class="sw" style="animation-duration:${sway}s">` +
      `<path d="${LEAF}" transform="rotate(${turn}) scale(${scale})" fill="${color}" opacity="0.92"/>` +
      `</g></g></g>`
  }

  return { css, svg }
}

function lanterns(sky: Sky): string {
  if (sky.windowGlow < 0.5) {
    return ''
  }
  const spots = [[1010, 300], [1085, 230], [1420, 250], [1500, 330], [930, 390]] as const
  let out = ''
  spots.forEach(([x, y], i) => {
    out +=
      `<g class="bob" style="animation-delay:-${i * 1.7}s">` +
      `<circle cx="${x}" cy="${y}" r="16" fill="${sky.window}" opacity="${(0.16 * sky.windowGlow).toFixed(2)}"/>` +
      `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff0c4" opacity="${(0.95 * sky.windowGlow).toFixed(2)}"/>` +
      `</g>`
  })

  return out
}

function castle(sky: Sky): string {
  const w = (x: number, y: number, i: number): string =>
    `<rect x="${x}" y="${y}" width="7" height="13" rx="3.5" fill="${sky.window}" opacity="${sky.windowGlow}"` +
    (sky.windowGlow >= 0.5 ? ` class="fl" style="animation-delay:-${i * 1.3}s"` : '') +
    '/>'

  return (
    `<g fill="${sky.castle}">` +
    // the crag
    '<path d="M1040 900 L1090 640 L1150 590 L1210 560 L1400 556 L1470 600 L1530 680 L1600 720 L1600 900 Z"/>' +
    // the keep and its walls
    '<rect x="1215" y="430" width="150" height="140"/>' +
    '<path d="M1215 430 h18 v-14 h16 v14 h18 v-14 h16 v14 h18 v-14 h16 v14 h18 v-14 h16 v14 h14 Z"/>' +
    '<rect x="1150" y="500" width="70" height="90"/>' +
    '<rect x="1360" y="490" width="90" height="100"/>' +
    // towers with pointed roofs
    '<rect x="1180" y="380" width="44" height="200"/><path d="M1172 382 L1202 290 L1232 382 Z"/>' +
    '<rect x="1268" y="300" width="50" height="160"/><path d="M1258 302 L1293 180 L1328 302 Z"/>' +
    '<rect x="1352" y="360" width="40" height="200"/><path d="M1344 362 L1372 278 L1400 362 Z"/>' +
    '<rect x="1432" y="430" width="34" height="160"/><path d="M1425 432 L1449 366 L1473 432 Z"/>' +
    '<rect x="1140" y="460" width="30" height="130"/><path d="M1134 462 L1155 404 L1176 462 Z"/>' +
    // a bridge
    '<path d="M1090 640 L1090 622 L1150 600 L1150 640 Q1120 610 1090 640 Z"/>' +
    '</g>' +
    w(1198, 420, 0) + w(1198, 470, 1) + w(1289, 330, 2) + w(1289, 380, 3) + w(1369, 400, 4) +
    w(1446, 460, 5) + w(1240, 470, 6) + w(1270, 510, 7) + w(1320, 470, 8) + w(1400, 520, 9) + w(1152, 490, 10)
  )
}

function tree(sky: Sky): string {
  const [a, b, c] = sky.canopy

  return (
    `<g>` +
    `<path d="M150 900 C160 760 150 640 190 520 C200 600 215 640 250 600 C230 680 215 780 235 900 Z" fill="${sky.trunk}"/>` +
    `<path d="M190 560 C120 500 90 470 40 470 M200 540 C260 480 300 470 350 440" stroke="${sky.trunk}" stroke-width="16" fill="none" stroke-linecap="round"/>` +
    `<g class="br">` +
    `<ellipse cx="90" cy="400" rx="170" ry="120" fill="${c}"/>` +
    `<ellipse cx="260" cy="350" rx="190" ry="130" fill="${a}"/>` +
    `<ellipse cx="150" cy="290" rx="160" ry="110" fill="${b}"/>` +
    `<ellipse cx="330" cy="430" rx="110" ry="70" fill="${c}" opacity="0.9"/>` +
    `<ellipse cx="20" cy="320" rx="110" ry="90" fill="${a}" opacity="0.9"/>` +
    `</g></g>`
  )
}

const ALT: Record<Phase, string> = {
  dawn: 'Dawn over a castle on a crag, autumn leaves drifting down',
  day: 'A bright autumn day by a castle on a crag, leaves drifting down',
  dusk: 'Dusk behind a castle with lit windows, autumn leaves drifting down',
  night: 'A moonlit castle with glowing windows and lanterns, autumn leaves drifting down',
}

export function sceneAlt(phase: Phase): string {
  return ALT[phase]
}

export function sceneSvg(phase: Phase): string {
  const sky = SKIES[phase]
  const fall = leaves(sky)

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' +
    '<style>' +
    '@keyframes sw{from{transform:translateX(-22px) rotate(-28deg)}to{transform:translateX(22px) rotate(34deg)}}' +
    '@keyframes tw{from{opacity:1}to{opacity:.35}}' +
    '@keyframes fl{from{opacity:1}to{opacity:.72}}' +
    '@keyframes bob{from{transform:translateY(-7px)}to{transform:translateY(7px)}}' +
    '@keyframes br{from{transform:translateX(-3px)}to{transform:translateX(4px)}}' +
    '@keyframes mist{from{transform:translateX(-60px)}to{transform:translateX(60px)}}' +
    '.sw{animation:sw 6s ease-in-out infinite alternate}' +
    '.tw{animation:tw 5s ease-in-out infinite alternate}' +
    '.fl{animation:fl 4s ease-in-out infinite alternate}' +
    '.bob{animation:bob 7s ease-in-out infinite alternate}' +
    '.br{animation:br 9s ease-in-out infinite alternate}' +
    '.mist{animation:mist 40s ease-in-out infinite alternate}' +
    fall.css +
    '</style>' +
    '<defs>' +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="0.6" stop-color="${sky.mid}"/><stop offset="1" stop-color="${sky.low}"/></linearGradient>` +
    `<radialGradient id="glow"><stop offset="0" stop-color="${sky.orbGlow}" stop-opacity="0.55"/><stop offset="1" stop-color="${sky.orbGlow}" stop-opacity="0"/></radialGradient>` +
    '</defs>' +
    '<rect width="1600" height="900" fill="url(#sky)"/>' +
    stars(sky) +
    `<circle cx="${sky.orbX}" cy="${sky.orbY}" r="${sky.orbR * 4}" fill="url(#glow)"/>` +
    `<circle cx="${sky.orbX}" cy="${sky.orbY}" r="${sky.orbR}" fill="${sky.orb}"/>` +
    `<path d="M0 640 C200 560 380 600 560 650 C760 700 900 600 1100 620 C1300 640 1450 580 1600 610 L1600 900 L0 900 Z" fill="${sky.far}"/>` +
    `<g class="mist" opacity="0.22"><ellipse cx="700" cy="690" rx="520" ry="26" fill="${sky.mist}"/><ellipse cx="1200" cy="730" rx="420" ry="20" fill="${sky.mist}"/></g>` +
    castle(sky) +
    lanterns(sky) +
    `<path d="M0 760 C240 690 420 740 640 790 C860 840 1000 760 1100 800 L1100 900 L0 900 Z" fill="${sky.near}"/>` +
    `<path d="M0 830 C300 790 700 860 1000 850 C1250 842 1450 870 1600 850 L1600 900 L0 900 Z" fill="${sky.ground}"/>` +
    tree(sky) +
    fall.svg +
    '</svg>'
  )
}
