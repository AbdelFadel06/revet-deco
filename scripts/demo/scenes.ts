/**
 * Scènes d'intérieur de DÉMONSTRATION pour les catégories (SVG → JPEG).
 * Perspective à un point de fuite, tons clairs et dorés.
 * À remplacer par de vraies photos de réalisations de la boutique.
 */
import sharp from 'sharp'
import { renderPattern, type PatternStyle } from './images'

const W = 800
const H = 1000

export type SceneKind = 'mur' | 'sol' | 'plafond' | 'deco' | 'noel'

interface Room {
  /** Coins du mur du fond */
  bx0: number
  by0: number
  bx1: number
  by1: number
}

const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ')

/** Les 5 faces d'une pièce vue de face. */
function faces({ bx0, by0, bx1, by1 }: Room) {
  return {
    back: poly([[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]]),
    floor: poly([[0, H], [W, H], [bx1, by1], [bx0, by1]]),
    ceiling: poly([[0, 0], [W, 0], [bx1, by0], [bx0, by0]]),
    left: poly([[0, 0], [bx0, by0], [bx0, by1], [0, H]]),
    right: poly([[W, 0], [bx1, by0], [bx1, by1], [W, H]]),
  }
}

/** Interpolation entre le bord du fond (t=0) et le bord avant (t=1). */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const defsCommon = `
  <linearGradient id="light" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.12"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e9cf9c"/><stop offset="0.5" stop-color="#c69c6d"/><stop offset="1" stop-color="#9b7445"/>
  </linearGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
    <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/>
  </radialGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
`

const wrap = (body: string, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsCommon}${defs}</defs>${body}<rect width="${W}" height="${H}" fill="url(#vignette)"/></svg>`

async function patternDataUri(code: string, style: PatternStyle) {
  const buf = await renderPattern(code, style)
  const small = await sharp(buf).resize(420).jpeg({ quality: 80 }).toBuffer()
  return `data:image/jpeg;base64,${small.toString('base64')}`
}

/** Parquet en perspective : lames qui convergent vers le point de fuite. */
function perspectiveFloor(room: Room, colors: string[], seam: string) {
  const { bx0, bx1, by1 } = room
  const n = 14
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const t0 = i / n
    const t1 = (i + 1) / n
    const pts: [number, number][] = [
      [lerp(bx0, bx1, t0), by1],
      [lerp(bx0, bx1, t1), by1],
      [lerp(0, W, t1), H],
      [lerp(0, W, t0), H],
    ]
    out.push(`<polygon points="${poly(pts)}" fill="${colors[i % colors.length]}"/>`)
    out.push(`<line x1="${pts[0][0]}" y1="${by1}" x2="${pts[3][0]}" y2="${H}" stroke="${seam}" stroke-width="1.5" opacity="0.6"/>`)
  }
  // Joints transversaux décalés (vue en profondeur : espacement croissant).
  for (let r = 1; r < 9; r++) {
    const t = Math.pow(r / 9, 1.8)
    const y = lerp(by1, H, t)
    const xl = lerp(bx0, 0, t)
    const xr = lerp(bx1, W, t)
    for (let i = r % 2; i < n; i += 2) {
      const xa = lerp(xl, xr, i / n)
      const xb = lerp(xl, xr, (i + 1) / n)
      out.push(`<line x1="${xa}" y1="${y}" x2="${xb}" y2="${y}" stroke="${seam}" stroke-width="1.2" opacity="0.5"/>`)
    }
  }
  return out.join('')
}

function plant(x: number, y: number, s = 1) {
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const a = -70 + i * 17
    return `<ellipse cx="0" cy="-70" rx="16" ry="62" fill="${i % 2 ? '#4f6b4a' : '#3d5a3a'}" transform="rotate(${a}) translate(0,${-(i % 3) * 8})"/>`
  }).join('')
  return `<g transform="translate(${x},${y}) scale(${s})">
    <ellipse cx="0" cy="8" rx="52" ry="10" fill="#000" opacity="0.18" filter="url(#shadow)"/>
    <g transform="translate(0,-60)">${leaves}</g>
    <path d="M-38,-62 L38,-62 L30,8 L-30,8 Z" fill="#f4f1ec"/><path d="M-38,-62 L38,-62 L36,-50 L-36,-50 Z" fill="url(#gold)"/>
  </g>`
}

// --- Scènes -----------------------------------------------------------------

async function mur() {
  const room: Room = { bx0: 110, by0: 120, bx1: 690, by1: 760 }
  const f = faces(room)
  const wallpaper = await patternDataUri('SCENE-MUR', { kind: 'marble', base: '#f7f4ef', accent: '#c69c6d' })
  const sofa = `
    <g>
      <ellipse cx="400" cy="800" rx="300" ry="22" fill="#000" opacity="0.25" filter="url(#shadow)"/>
      <rect x="140" y="585" width="520" height="150" rx="26" fill="#6e5a48"/>
      <rect x="120" y="640" width="70" height="150" rx="22" fill="#5f4d3c"/>
      <rect x="610" y="640" width="70" height="150" rx="22" fill="#5f4d3c"/>
      <rect x="180" y="680" width="440" height="100" rx="18" fill="#7d6753"/>
      <rect x="205" y="610" width="180" height="90" rx="20" fill="#86705b"/>
      <rect x="415" y="610" width="180" height="90" rx="20" fill="#86705b"/>
      <rect x="230" y="600" width="80" height="62" rx="14" fill="#e9dcc6"/>
      <rect x="490" y="600" width="80" height="62" rx="14" fill="#c69c6d"/>
      <rect x="160" y="780" width="10" height="40" fill="#2a1d14"/><rect x="630" y="780" width="10" height="40" fill="#2a1d14"/>
    </g>`
  const lamp = `<g><line x1="560" y1="0" x2="560" y2="230" stroke="#9b7445" stroke-width="2"/><path d="M515,230 L605,230 L585,190 L535,190 Z" fill="url(#gold)"/><ellipse cx="560" cy="300" rx="120" ry="70" fill="#fff6dd" opacity="0.25" filter="url(#shadow)"/></g>`
  return wrap(
    `<polygon points="${f.ceiling}" fill="#fbfaf7"/>
     <image href="${wallpaper}" x="${room.bx0}" y="${room.by0}" width="${room.bx1 - room.bx0}" height="${room.by1 - room.by0}" preserveAspectRatio="xMidYMid slice"/>
     <polygon points="${f.back}" fill="url(#light)"/>
     <polygon points="${f.left}" fill="#efe9df"/><polygon points="${f.right}" fill="#e6dfd3"/>
     ${perspectiveFloor(room, ['#d9c3a2', '#d2b993', '#ddc8a8', '#cfb48c'], '#a68a63')}
     <line x1="${room.bx0}" y1="${room.by1}" x2="${room.bx1}" y2="${room.by1}" stroke="#fff" stroke-width="6"/>
     ${lamp}${sofa}${plant(690, 880, 1.1)}`,
  )
}

async function sol() {
  const room: Room = { bx0: 170, by0: 90, bx1: 630, by1: 470 }
  const f = faces(room)
  const window = `
    <rect x="300" y="150" width="200" height="270" fill="#dfe9ec"/>
    <rect x="300" y="150" width="200" height="270" fill="none" stroke="#fff" stroke-width="10"/>
    <line x1="400" y1="150" x2="400" y2="420" stroke="#fff" stroke-width="8"/><line x1="300" y1="285" x2="500" y2="285" stroke="#fff" stroke-width="8"/>
    <polygon points="300,420 500,420 640,1000 160,1000" fill="#fff8e6" opacity="0.18"/>`
  const rug = `<polygon points="290,640 510,640 600,860 200,860" fill="#efe7da" opacity="0.92"/><polygon points="305,652 495,652 578,846 222,846" fill="none" stroke="#c69c6d" stroke-width="3"/>`
  return wrap(
    `<polygon points="${f.ceiling}" fill="#fbfaf7"/>
     <polygon points="${f.back}" fill="#f6f2ec"/>
     <polygon points="${f.left}" fill="#efe9df"/><polygon points="${f.right}" fill="#e8e1d6"/>
     ${window}
     ${perspectiveFloor(room, ['#b98a55', '#a87a47', '#c39661', '#9e7040', '#b48650'], '#5d3f1f')}
     <polygon points="${poly([[0, H], [W, H], [room.bx1, room.by1], [room.bx0, room.by1]])}" fill="url(#light)" opacity="0.6"/>
     <rect x="${room.bx0}" y="${room.by1 - 14}" width="${room.bx1 - room.bx0}" height="14" fill="#fff"/>
     ${rug}${plant(130, 930, 1.2)}`,
  )
}

function plafond() {
  // Pièce vue légèrement en contre-plongée : grand plafond.
  const room: Room = { bx0: 160, by0: 520, bx1: 640, by1: 900 }
  const f = faces(room)
  const { bx0, by0, bx1 } = room
  const ceil: string[] = []
  // Caissons de faux staff : grille 4 × 4 en perspective.
  const rows = 4
  const cols = 4
  const rowT = (r: number) => Math.pow(r / rows, 1.35) // espacement croissant vers l'avant
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t0 = rowT(r) // 0 = fond, 1 = avant
      const t1 = rowT(r + 1)
      // Caisson légèrement en retrait dans sa case.
      const inset = 0.12
      const k0 = (c + inset) / cols
      const k1 = (c + 1 - inset) / cols
      const ty0 = lerp(t0, t1, inset)
      const ty1 = lerp(t0, t1, 1 - inset)
      const y0 = lerp(by0, 0, ty0)
      const y1 = lerp(by0, 0, ty1)
      const l0 = lerp(bx0, 0, ty0)
      const r0 = lerp(bx1, W, ty0)
      const l1 = lerp(bx0, 0, ty1)
      const r1 = lerp(bx1, W, ty1)
      const pts: [number, number][] = [
        [lerp(l0, r0, k0), y0],
        [lerp(l0, r0, k1), y0],
        [lerp(l1, r1, k1), y1],
        [lerp(l1, r1, k0), y1],
      ]
      ceil.push(`<polygon points="${poly(pts)}" fill="#f1ede6" stroke="#d9cfbf" stroke-width="3"/>`)
      ceil.push(`<polygon points="${poly(pts)}" fill="none" stroke="#fff" stroke-width="1.5" transform="translate(2,2)"/>`)
    }
  }
  // Rosace centrale + lustre.
  const cx = 400
  const cy = lerp(by0, 0, 0.42)
  const rosette = Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-34" rx="9" ry="22" fill="#f7f4ef" stroke="#d9cfbf" stroke-width="1.5" transform="rotate(${i * 30})"/>`).join('')
  const chandelier = `
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 120}" stroke="#9b7445" stroke-width="3"/>
    <ellipse cx="${cx}" cy="${cy + 150}" rx="90" ry="22" fill="none" stroke="url(#gold)" stroke-width="6"/>
    ${[-70, -35, 0, 35, 70].map((dx) => `<line x1="${cx + dx}" y1="${cy + 150}" x2="${cx + dx}" y2="${cy + 125}" stroke="url(#gold)" stroke-width="4"/><ellipse cx="${cx + dx}" cy="${cy + 118}" rx="6" ry="11" fill="#fff6d8"/>`).join('')}
    <ellipse cx="${cx}" cy="${cy + 140}" rx="160" ry="80" fill="#fff3cf" opacity="0.25" filter="url(#shadow)"/>`
  // Corniches : 3 filets le long des arêtes plafond / murs.
  const cornice = [0, 14, 26]
    .map((d, i) => {
      const s = i === 1 ? '#c9bba5' : '#ffffff'
      const w = i === 1 ? 5 : 9
      return `<polyline points="${poly([[0, d * 1.8], [bx0 - d * 0.3, by0 - d], [bx1 + d * 0.3, by0 - d], [W, d * 1.8]])}" fill="none" stroke="${s}" stroke-width="${w}"/>`
    })
    .join('')
  return wrap(
    `<polygon points="${f.ceiling}" fill="#f7f4ef"/>
     ${ceil.join('')}
     <g transform="translate(${cx},${cy})"><circle r="52" fill="#f4f0e9" stroke="#d9cfbf" stroke-width="2"/>${rosette}<circle r="14" fill="url(#gold)"/></g>
     <polygon points="${f.back}" fill="#efe9df"/>
     <polygon points="${f.left}" fill="#e7e0d4"/><polygon points="${f.right}" fill="#e1d9cc"/>
     <polyline points="${poly([[0, 0], [bx0, by0], [bx1, by0], [W, 0]])}" fill="none" stroke="#fff" stroke-width="22"/>
     ${cornice}
     <polygon points="${f.floor}" fill="#cdb79a"/>
     ${chandelier}`,
  )
}

function deco() {
  const flowers = Array.from({ length: 9 }, (_, i) => {
    const a = -60 + i * 15
    const len = 150 + (i % 3) * 40
    const rad = (a * Math.PI) / 180
    const x = 400 + Math.sin(rad) * len
    const y = 560 - Math.cos(rad) * len
    const color = ['#f3e3d3', '#e8b9a6', '#ffffff', '#d98a9a'][i % 4]
    const petals = Array.from({ length: 6 }, (_, k) => `<ellipse cx="0" cy="-16" rx="11" ry="18" fill="${color}" transform="rotate(${k * 60})"/>`).join('')
    return `<path d="M400,560 Q${(400 + x) / 2 + 10},${(560 + y) / 2} ${x},${y}" stroke="#5f7a52" stroke-width="3" fill="none"/>
      <ellipse cx="${(400 + x) / 2}" cy="${(560 + y) / 2}" rx="7" ry="18" fill="#6f8c61" transform="rotate(${a + 40} ${(400 + x) / 2} ${(560 + y) / 2})"/>
      <g transform="translate(${x},${y})">${petals}<circle r="7" fill="url(#gold)"/></g>`
  }).join('')
  return wrap(
    `<rect width="${W}" height="${H}" fill="#f8f5f0"/>
     <!-- Moulures murales en ruban doré -->
     <rect x="90" y="90" width="620" height="520" fill="none" stroke="url(#gold)" stroke-width="5"/>
     <rect x="112" y="112" width="576" height="476" fill="none" stroke="url(#gold)" stroke-width="2"/>
     <!-- Miroir ovale -->
     <ellipse cx="400" cy="330" rx="150" ry="190" fill="#e7ecee"/>
     <ellipse cx="400" cy="330" rx="150" ry="190" fill="none" stroke="url(#gold)" stroke-width="14"/>
     <path d="M310,230 Q360,200 420,215" stroke="#fff" stroke-width="10" opacity="0.6" fill="none" stroke-linecap="round"/>
     <!-- Console -->
     <ellipse cx="400" cy="900" rx="300" ry="20" fill="#000" opacity="0.2" filter="url(#shadow)"/>
     <rect x="120" y="680" width="560" height="26" fill="#2b2420"/>
     <rect x="120" y="706" width="560" height="10" fill="url(#gold)"/>
     <path d="M160,716 L175,900 M640,716 L625,900" stroke="url(#gold)" stroke-width="10"/>
     <!-- Bouquet -->
     ${flowers}
     <path d="M350,560 L450,560 L440,680 L360,680 Z" fill="#ffffff"/>
     <rect x="350" y="590" width="100" height="10" fill="url(#gold)"/>
     <!-- Ruban doré enroulé -->
     <g transform="translate(570,640)"><circle r="38" fill="url(#gold)"/><circle r="16" fill="#f8f5f0"/><path d="M30,20 Q80,40 60,40 L40,40" stroke="url(#gold)" stroke-width="12" fill="none"/></g>
     <!-- Bougie -->
     <rect x="200" y="590" width="34" height="90" rx="4" fill="#fbf7ef"/><ellipse cx="217" cy="580" rx="6" ry="12" fill="#ffcf6b"/>`,
  )
}

function noel() {
  const layers = [
    [400, 160, 120, 330],
    [400, 250, 175, 460],
    [400, 360, 230, 600],
    [400, 480, 285, 740],
  ]
  const tree = layers
    .map(([x, top, half, bottom], i) => `<path d="M${x},${top} L${x + half},${bottom} Q${x},${bottom + 30} ${x - half},${bottom} Z" fill="${i % 2 ? '#24483f' : '#1d3d35'}"/>`)
    .join('')
  const baubles: string[] = []
  const colors = ['url(#gold)', '#b3302a', '#f4efe6', 'url(#gold)', '#b3302a']
  let k = 0
  for (const [x, top, half, bottom] of layers) {
    const y = bottom - 25
    for (let j = -2; j <= 2; j++) {
      const bx = x + (j * half) / 2.6
      if (Math.abs(j) === 2 && top < 200) continue
      baubles.push(`<circle cx="${bx}" cy="${y - Math.abs(j) * 6}" r="${15 + (k % 3) * 3}" fill="${colors[k % colors.length]}"/><circle cx="${bx - 4}" cy="${y - Math.abs(j) * 6 - 5}" r="4" fill="#fff" opacity="0.6"/>`)
      k++
    }
  }
  const garland = layers
    .map(([x, , half, bottom]) => `<path d="M${x - half * 0.8},${bottom - 60} Q${x},${bottom - 10} ${x + half * 0.8},${bottom - 60}" fill="none" stroke="url(#gold)" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>`)
    .join('')
  const star = `<path transform="translate(400,150)" d="M0,-42 L11,-13 L42,-13 L17,6 L26,36 L0,18 L-26,36 L-17,6 L-42,-13 L-11,-13 Z" fill="url(#gold)"/>`
  const gift = (x: number, w: number, h: number, c: string) =>
    `<rect x="${x}" y="${900 - h}" width="${w}" height="${h}" fill="${c}"/><rect x="${x + w / 2 - 6}" y="${900 - h}" width="12" height="${h}" fill="url(#gold)"/><rect x="${x}" y="${900 - h * 0.62}" width="${w}" height="10" fill="url(#gold)"/>`
  return wrap(
    `<rect width="${W}" height="${H}" fill="#f7f3ec"/>
     <rect y="860" width="${W}" height="140" fill="#d9c7ad"/>
     <ellipse cx="400" cy="160" rx="260" ry="220" fill="#fff4d6" opacity="0.5" filter="url(#shadow)"/>
     <ellipse cx="400" cy="900" rx="320" ry="28" fill="#000" opacity="0.2" filter="url(#shadow)"/>
     <rect x="380" y="760" width="40" height="110" fill="#5a3a22"/>
     ${tree}${garland}${baubles.join('')}${star}
     ${gift(170, 120, 110, '#b3302a')}${gift(520, 140, 90, '#f4efe6')}${gift(300, 90, 70, '#1d3d35')}`,
  )
}

export async function renderScene(kind: SceneKind): Promise<Buffer> {
  const markup = kind === 'mur' ? await mur() : kind === 'sol' ? await sol() : kind === 'plafond' ? plafond() : kind === 'deco' ? deco() : noel()
  return sharp(Buffer.from(markup)).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
}
