/** Aperçu des scènes de catégories : npx tsx scripts/demo/preview-scenes.mts <sortie.jpg> */
import sharp from 'sharp'
import { renderScene, type SceneKind } from './scenes'
const kinds: SceneKind[] = ['mur', 'sol', 'plafond', 'deco', 'noel']
const thumbs = await Promise.all(kinds.map(async (k) => sharp(await renderScene(k)).resize(320, 400).toBuffer()))
await sharp({ create: { width: 1600, height: 400, channels: 3, background: '#fff' } })
  .composite(thumbs.map((input, i) => ({ input, left: i * 320, top: 0 })))
  .jpeg().toFile(process.argv[2])
console.log('ok')
