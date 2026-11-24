import sharp from 'sharp'
import { type PatternStyle, renderPattern, renderProductCard } from './images'
const styles: [string, PatternStyle][] = [
  ['PP-M01', { kind: 'marble', base: '#f7f4ef', accent: '#c69c6d' }],
  ['PP-M02', { kind: 'marble', base: '#1c1a19', accent: '#d4af6a' }],
  ['PP-L01', { kind: 'planks', base: '#c89b6d', accent: '#3a2414' }],
  ['PP-L02', { kind: 'planks', base: '#6f6a64', accent: '#1f1c1a' }],
  ['PP-F01', { kind: 'floral', base: '#f3ece0', accent: '#c56b4a' }],
  ['PP-B01', { kind: 'brick', base: '#a8553a', accent: '#d9cfc2' }],
  ['PP-G01', { kind: 'geometric', base: '#1f3b36', accent: '#c69c6d' }],
  ['SOL-C01', { kind: 'tiles', base: '#ece4d6', accent: '#2f4a5a' }],
  ['SOL-B01', { kind: 'wood', base: '#a0703f', accent: '#4a2f17' }],
  ['IN-U01', { kind: 'plain', base: '#b9b2a4', accent: '#000000' }],
]
const bufs = await Promise.all(styles.map(([c, s]) => renderPattern(c, s)))
bufs.push(await renderProductCard('Spray peinture or', '#40200c', '#c69c6d'))
bufs.push(await renderProductCard('Faux staff', '#faf6f0', '#40200c', { kind: 'plain', base: '#f2efe9', accent: '#000' }))
const thumbs = await Promise.all(bufs.map((b) => sharp(b).resize(200, 200).toBuffer()))
await sharp({ create: { width: 1200, height: 400, channels: 3, background: '#fff' } })
  .composite(thumbs.map((input, i) => ({ input, left: (i % 6) * 200, top: Math.floor(i / 6) * 200 })))
  .jpeg().toFile(process.argv[2])
console.log('ok')
