/**
 * Démo de la galerie : ajoute quelques photos de la boutique (media-source)
 * comme photos supplémentaires de motifs existants. Idempotent (clés fixes).
 *
 *   npx tsx scripts/media/gallery-demo.ts
 */
import { join } from 'node:path'
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import sharp from 'sharp'

config({ path: '.env.local' })

/** code motif → photos à ajouter après la photo principale */
const EXTRA: Record<string, { file: string; caption: string }[]> = {
  'PP-L01': [
    { file: 'IMG_3805.JPG', caption: 'Chambre en lambris bois' },
    { file: 'IMG_3807.JPG', caption: 'Couloir en lambris bois' },
  ],
  'PP-L03': [{ file: 'IMG_3812.JPG', caption: 'Mur TV en lambris et éclairage' }],
  'P3D-01': [{ file: 'IMG_3816.JPG', caption: 'Mur entier en panneaux 3D' }],
  'PP-B03': [{ file: 'IMG_3806.JPG', caption: 'Effet pierre en boutique' }],
}

async function main() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN manquant dans .env.local')
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token,
    apiVersion: '2025-01-01',
    useCdn: false,
  })
  const tx = client.transaction()
  for (const [code, extras] of Object.entries(EXTRA)) {
    const id = await client.fetch<string | null>(`*[_type == "pattern" && code == $code][0]._id`, { code })
    if (!id) continue
    const items: Record<string, unknown>[] = []
    for (const [i, x] of extras.entries()) {
      const buffer = await sharp(join('media-source', 'originaux', x.file))
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer()
      const asset = await client.assets.upload('image', buffer, { filename: x.file.toLowerCase() })
      items.push({ _key: `extra${i}`, _type: 'image', asset: { _type: 'reference', _ref: asset._id }, caption: x.caption })
    }
    const oldKeys = [0, 1, 2, 3].map((i) => `photos[_key=="extra${i}"]`)
    tx.patch(id, (p) => p.unset(oldKeys).append('photos', items))
    process.stdout.write('.')
  }
  await tx.commit()
  console.log(`\n✓ Photos ajoutées à ${Object.keys(EXTRA).length} motifs.`)
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err)
  process.exit(1)
})
