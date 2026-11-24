/**
 * Générateur d'images de DÉMONSTRATION (motifs procéduraux en SVG → JPEG).
 * Libres de droits, déterministes (même graine → même image).
 * À remplacer par les vraies photos de la boutique.
 */
import sharp from 'sharp'

const SIZE = 800

/** PRNG déterministe (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hashSeed = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7)

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const r = clamp(((n >> 16) & 255) * (1 + amount))
  const g = clamp(((n >> 8) & 255) * (1 + amount))
  const b = clamp((n & 255) * (1 + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const svg = (body: string, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><defs>${defs}</defs>${body}</svg>`

const noiseFilter = (id: string, seed: number, freq = '0.8', opacity = 0.08) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity * 6} -${opacity * 2}"/>
  </filter>`

// --- Motifs ----------------------------------------------------------------

export interface PatternStyle {
  kind: 'marble' | 'planks' | 'floral' | 'brick' | 'geometric' | 'plain' | 'tiles' | 'wood'
  /** Couleur principale */
  base: string
  /** Couleur d'accent (veines, fleurs, joints…) */
  accent: string
}

function marble(r: () => number, { base, accent }: PatternStyle, seed: number) {
  const veins: string[] = []
  const count = 5 + Math.floor(r() * 4)
  for (let i = 0; i < count; i++) {
    let x = r() * SIZE
    let y = -50
    let d = `M${x.toFixed(1)},${y}`
    const drift = (r() - 0.5) * 6
    while (y < SIZE + 50) {
      const nx = x + drift * 20 + (r() - 0.5) * 140
      const ny = y + 60 + r() * 80
      d += ` Q${(x + (r() - 0.5) * 120).toFixed(1)},${((y + ny) / 2).toFixed(1)} ${nx.toFixed(1)},${ny.toFixed(1)}`
      x = nx
      y = ny
    }
    const w = (0.6 + r() * 3.2).toFixed(1)
    veins.push(`<path d="${d}" stroke="${accent}" stroke-width="${w}" fill="none" opacity="${(0.55 + r() * 0.4).toFixed(2)}" filter="url(#soft)"/>`)
    veins.push(`<path d="${d}" stroke="${shade(accent, -0.25)}" stroke-width="${(Number(w) * 0.35).toFixed(1)}" fill="none" opacity="0.6"/>`)
  }
  const defs = `
    <filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="clouds" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="5" seed="${seed}"/>
      <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.55"/>
    </filter>`
  return svg(
    `<rect width="100%" height="100%" fill="${base}"/>
     <rect width="100%" height="100%" filter="url(#clouds)" opacity="0.35"/>
     ${veins.join('')}`,
    defs,
  )
}

function planks(r: () => number, { base, accent }: PatternStyle, seed: number) {
  // Lambris : lattes verticales avec rainures sombres.
  const n = 8
  const w = SIZE / n
  const slats: string[] = []
  for (let i = 0; i < n; i++) {
    const c = shade(base, (r() - 0.5) * 0.18)
    slats.push(`<rect x="${i * w}" y="0" width="${w}" height="${SIZE}" fill="${c}"/>`)
    for (let g = 0; g < 6; g++) {
      const gx = i * w + 6 + r() * (w - 12)
      slats.push(
        `<path d="M${gx},0 C${gx + (r() - 0.5) * 10},${SIZE / 3} ${gx + (r() - 0.5) * 10},${(2 * SIZE) / 3} ${gx},${SIZE}" stroke="${shade(c, -0.12)}" stroke-width="${(0.5 + r()).toFixed(1)}" fill="none" opacity="0.6"/>`,
      )
    }
    slats.push(`<rect x="${i * w}" y="0" width="5" height="${SIZE}" fill="${accent}" opacity="0.85"/>`)
    slats.push(`<rect x="${i * w + 5}" y="0" width="2" height="${SIZE}" fill="#ffffff" opacity="0.12"/>`)
  }
  return svg(`${slats.join('')}<rect width="100%" height="100%" filter="url(#grain)"/>`, noiseFilter('grain', seed, '0.02 0.6', 0.12))
}

function wood(r: () => number, { base, accent }: PatternStyle, seed: number) {
  // Parquet : lames horizontales décalées.
  const rows = 6
  const h = SIZE / rows
  const parts: string[] = []
  for (let i = 0; i < rows; i++) {
    let x = -r() * 300
    while (x < SIZE) {
      const len = 260 + r() * 260
      const c = shade(base, (r() - 0.5) * 0.22)
      parts.push(`<rect x="${x}" y="${i * h}" width="${len}" height="${h}" fill="${c}"/>`)
      for (let g = 0; g < 4; g++) {
        const gy = i * h + 8 + r() * (h - 16)
        parts.push(`<path d="M${x},${gy} Q${x + len / 2},${gy + (r() - 0.5) * 14} ${x + len},${gy}" stroke="${shade(c, -0.15)}" stroke-width="1" fill="none" opacity="0.55"/>`)
      }
      parts.push(`<rect x="${x}" y="${i * h}" width="2" height="${h}" fill="${accent}" opacity="0.7"/>`)
      x += len
    }
    parts.push(`<rect x="0" y="${i * h}" width="${SIZE}" height="2" fill="${accent}" opacity="0.7"/>`)
  }
  return svg(`${parts.join('')}<rect width="100%" height="100%" filter="url(#grain)"/>`, noiseFilter('grain', seed, '0.6 0.02', 0.1))
}

function floral(r: () => number, { base, accent }: PatternStyle, seed: number) {
  const flowers: string[] = []
  const step = 200
  for (let gy = 0; gy < SIZE + step; gy += step) {
    for (let gx = 0; gx < SIZE + step; gx += step) {
      const ox = (gy / step) % 2 ? step / 2 : 0
      const cx = gx + ox + (r() - 0.5) * 30
      const cy = gy + (r() - 0.5) * 30
      const s = 0.7 + r() * 0.5
      const rot = r() * 72
      const petals = Array.from({ length: 5 }, (_, k) =>
        `<ellipse cx="0" cy="-24" rx="13" ry="26" transform="rotate(${k * 72})" fill="${accent}" opacity="0.85"/>`,
      ).join('')
      const leaf = `<ellipse cx="38" cy="30" rx="8" ry="22" transform="rotate(-40 38 30)" fill="${shade(accent, -0.45)}" opacity="0.5"/>`
      flowers.push(
        `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${s.toFixed(2)}) rotate(${rot.toFixed(1)})">${leaf}${petals}<circle r="9" fill="${shade(accent, -0.35)}"/></g>`,
      )
    }
  }
  return svg(`<rect width="100%" height="100%" fill="${base}"/>${flowers.join('')}<rect width="100%" height="100%" filter="url(#paper)"/>`, noiseFilter('paper', seed))
}

function brick(r: () => number, { base, accent }: PatternStyle, seed: number) {
  const bw = 160
  const bh = 64
  const parts: string[] = [`<rect width="100%" height="100%" fill="${accent}"/>`]
  for (let row = 0; row * bh < SIZE; row++) {
    const off = row % 2 ? -bw / 2 : 0
    for (let x = off; x < SIZE; x += bw) {
      const c = shade(base, (r() - 0.5) * 0.3)
      parts.push(`<rect x="${x + 4}" y="${row * bh + 4}" width="${bw - 8}" height="${bh - 8}" rx="2" fill="${c}"/>`)
    }
  }
  parts.push(`<rect width="100%" height="100%" filter="url(#rough)"/>`)
  return svg(parts.join(''), noiseFilter('rough', seed, '0.5', 0.16))
}

function geometric(r: () => number, { base, accent }: PatternStyle, seed: number) {
  // Éventails art déco.
  const s = 100
  const parts: string[] = [`<rect width="100%" height="100%" fill="${base}"/>`]
  for (let row = 0; row * (s / 2) < SIZE + s; row++) {
    const off = row % 2 ? s / 2 : 0
    for (let x = -s + off; x < SIZE + s; x += s) {
      const cx = x + s / 2
      const cy = row * (s / 2)
      for (let k = 3; k >= 1; k--) {
        const rr = (s / 2) * (k / 3)
        parts.push(`<path d="M${cx - rr},${cy} A${rr},${rr} 0 0 1 ${cx + rr},${cy}" fill="none" stroke="${accent}" stroke-width="2.5"/>`)
      }
    }
  }
  void r
  parts.push(`<rect width="100%" height="100%" filter="url(#paper)"/>`)
  return svg(parts.join(''), noiseFilter('paper', seed))
}

function tiles(r: () => number, { base, accent }: PatternStyle, seed: number) {
  // Carreaux de ciment : motif à quatre pétales géométriques.
  const t = 200
  const parts: string[] = [`<rect width="100%" height="100%" fill="${base}"/>`]
  for (let y = 0; y < SIZE; y += t) {
    for (let x = 0; x < SIZE; x += t) {
      const c = x + t / 2
      const d = y + t / 2
      parts.push(`<rect x="${x}" y="${y}" width="${t}" height="${t}" fill="none" stroke="${shade(base, -0.15)}" stroke-width="3"/>`)
      parts.push(`<path d="M${c},${y + 20} L${x + t - 20},${d} L${c},${y + t - 20} L${x + 20},${d} Z" fill="none" stroke="${accent}" stroke-width="6"/>`)
      parts.push(`<circle cx="${c}" cy="${d}" r="22" fill="${accent}"/>`)
      for (const [qx, qy] of [[x, y], [x + t, y], [x, y + t], [x + t, y + t]]) {
        parts.push(`<path d="M${qx - 30},${qy} A30,30 0 0 0 ${qx + 30},${qy} A30,30 0 0 0 ${qx - 30},${qy}" fill="${shade(accent, 0.25)}" opacity="0.8"/>`)
      }
    }
  }
  void r
  parts.push(`<rect width="100%" height="100%" filter="url(#paper)"/>`)
  return svg(parts.join(''), noiseFilter('paper', seed, '0.7', 0.1))
}

function plain(_r: () => number, { base }: PatternStyle, seed: number) {
  const defs = `
    <filter id="tex" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves="4" seed="${seed}"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.3"/>
    </filter>`
  return svg(`<rect width="100%" height="100%" fill="${base}"/><rect width="100%" height="100%" filter="url(#tex)" opacity="0.5"/>`, defs)
}

const RENDERERS = { marble, planks, wood, floral, brick, geometric, tiles, plain }

export async function renderPattern(code: string, style: PatternStyle): Promise<Buffer> {
  const seed = hashSeed(code)
  const markup = RENDERERS[style.kind](rng(seed), style, seed % 1000)
  return sharp(Buffer.from(markup)).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
}

/** Visuel produit simple (produits sans motifs) : fond + nom en serif. */
export async function renderProductCard(title: string, bg: string, fg: string, style?: PatternStyle): Promise<Buffer> {
  const seed = hashSeed(title)
  const backdrop = style ? await renderPattern(title, style) : null
  const words = title.split(' ')
  const lines: string[] = []
  for (const w of words) {
    const last = lines[lines.length - 1]
    if (last && (last + ' ' + w).length <= 14) lines[lines.length - 1] = last + ' ' + w
    else lines.push(w)
  }
  const text = lines
    .map((l, i) => `<text x="400" y="${400 + (i - (lines.length - 1) / 2) * 80}" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="64" fill="${fg}">${l.replace(/&/g, '&amp;')}</text>`)
    .join('')
  const overlay = svg(
    `${backdrop ? '' : `<rect width="100%" height="100%" fill="${bg}"/>`}
     <rect x="140" y="${400 - lines.length * 40 - 60}" width="520" height="${lines.length * 80 + 120}" rx="260" fill="${bg}" opacity="${backdrop ? 0.88 : 1}"/>
     <rect x="160" y="${400 - lines.length * 40 - 40}" width="480" height="${lines.length * 80 + 80}" rx="240" fill="none" stroke="${fg}" stroke-width="2"/>
     ${text}<rect width="100%" height="100%" filter="url(#paper)"/>`,
    noiseFilter('paper', seed % 1000),
  )
  const base = backdrop ? sharp(backdrop) : sharp(Buffer.from(overlay))
  return backdrop
    ? base.composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    : base.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
}
